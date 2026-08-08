
import { withTransaction, query } from "@/postgres/lib/db";
import * as coinRepo from "@/postgres/repositories/coins";
import { getOrderStats } from "@/postgres/repositories/orders";
import type { TransactionType, WalletRecord, WalletTransactionRecord, MembershipTierRecord } from "@/postgres/models/Coin";

const IDEMPOTENCY_NS = "b2w:coins";

// ── Coin config defaults & resolvers ──────────────────────────────────────
// Vendors can override these per-product. When a product hasn't set a value,
// we fall back to these platform defaults.
export const DEFAULT_COIN_VALIDITY_DAYS = 90;
export const DEFAULT_MAX_COIN_REDEMPTION_PERCENT = 20; // % of item price payable via coins

export function resolveCoinValidityDays(vendorValidityDays?: number | null): number {
  if (typeof vendorValidityDays === "number" && vendorValidityDays > 0) {
    return Math.min(Math.floor(vendorValidityDays), 365); // sane upper bound
  }
  return DEFAULT_COIN_VALIDITY_DAYS;
}

export function resolveMaxCoinRedemptionPercent(vendorPercent?: number | null): number {
  if (typeof vendorPercent === "number" && vendorPercent >= 0) {
    return Math.min(vendorPercent, 100);
  }
  return DEFAULT_MAX_COIN_REDEMPTION_PERCENT;
}

function makeIdempotencyKey(prefix: string, uniqueId: string): string {
  return `${IDEMPOTENCY_NS}:${prefix}:${uniqueId}`;
}

export async function getUserWallet(userId: string): Promise<WalletRecord> {
  return coinRepo.getOrCreateWallet(userId);
}

export async function getWalletWithTier(userId: string) {
  const wallet = await getUserWallet(userId);
  const currentTier = await coinRepo.getUserTier(userId);
  const tiers = await coinRepo.getMembershipTiers();
  const nextTier = tiers.find(t => t.level > (currentTier?.level ?? 0));
  return { wallet, currentTier, nextTier, allTiers: tiers };
}

export async function getTransactionHistory(
  userId: string,
  options?: { limit?: number; offset?: number; type?: TransactionType }
): Promise<WalletTransactionRecord[]> {
  return coinRepo.getTransactions(userId, options);
}

export async function earnCoins(params: {
  userId: string;
  amount: number;
  source: string;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
  description?: string;
  isPending?: boolean;
  expiryDate?: Date;
  validityDays?: number; // NEW — pass product.coinValidityDays when earning from a purchase
}): Promise<WalletTransactionRecord>  {
  const idempotencyKey = makeIdempotencyKey("earn", `${params.referenceType ?? "generic"}:${params.referenceId ?? params.source}:${params.userId}`);

  const existing = await coinRepo.getTransactionByIdempotencyKey(idempotencyKey);
  if (existing) return existing;

  return withTransaction(async () => {
    const wallet = await coinRepo.getOrCreateWallet(params.userId);
    if (wallet.status === "frozen") throw new Error("Wallet is frozen");

    const tier = await coinRepo.getUserTier(params.userId);
    const multiplier = tier?.coinMultiplier ?? 1;
    const adjustedAmount = Math.round(params.amount * Number(multiplier));

    if (params.isPending) {
      await coinRepo.updateWalletBalance(wallet.id, adjustedAmount, "pendingCoins");
    } else {
      await coinRepo.updateWalletBalance(wallet.id, adjustedAmount, "balance");
    }
    await coinRepo.updateWalletBalance(wallet.id, adjustedAmount, "lifetimeEarned");

    const updatedWallet = await coinRepo.getWalletById(wallet.id);
    if (!updatedWallet) throw new Error("Wallet not found after update");

    const tx = await coinRepo.createTransaction({
      walletId: wallet.id,
      userId: params.userId,
      type: params.campaignId ? "promotional_credit" : "earn",
      amount: adjustedAmount,
      balanceBefore: wallet.balance + wallet.pendingCoins,
      balanceAfter: params.isPending
        ? wallet.balance + wallet.pendingCoins + adjustedAmount
        : updatedWallet.balance,
      source: params.source,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      campaignId: params.campaignId ?? null,
      expiryDate: params.expiryDate ?? new Date(Date.now() + resolveCoinValidityDays(params.validityDays) * 24 * 60 * 60 * 1000),
      description: params.description ?? `Earned ${adjustedAmount} coins`,
      idempotencyKey,
    });

    await coinRepo.queueNotification({
      userId: params.userId,
      notificationType: "coins_earned",
      title: "Coins Earned!",
      body: `You earned ${adjustedAmount} Super Coins${params.description ? ` - ${params.description}` : ""}`,
      channel: "in_app",
      referenceType: params.referenceType,
      referenceId: params.referenceId,
    });

    return tx;
  });
}

export async function redeemCoins(params: {
  userId: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  idempotencyKey?: string;
}): Promise<{ transaction: WalletTransactionRecord; coinDiscount: number; remainingAmount: number }> {
  await expireUserCoins(params.userId);

  const key = params.idempotencyKey ?? makeIdempotencyKey("redeem", `${params.referenceType ?? "generic"}:${params.referenceId ?? "unknown"}:${params.userId}`);
  const existing = await coinRepo.getTransactionByIdempotencyKey(key);
  if (existing) {
    const remaining = await coinRepo.getOrCreateWallet(params.userId);
    const coinValue = 1;
    return { transaction: existing, coinDiscount: existing.amount * coinValue, remainingAmount: remaining.balance - existing.amount };
  }

  return withTransaction(async () => {
    const wallet = await coinRepo.getOrCreateWallet(params.userId);
    if (wallet.status === "frozen") throw new Error("Wallet is frozen");
    if (wallet.balance < params.amount) throw new Error("Insufficient coin balance");

    await coinRepo.updateWalletBalance(wallet.id, -params.amount, "balance");
    await coinRepo.updateWalletBalance(wallet.id, params.amount, "lifetimeSpent");

    const updatedWallet = await coinRepo.getWalletById(wallet.id);
    if (!updatedWallet) throw new Error("Wallet not found after update");

    const tx = await coinRepo.createTransaction({
      walletId: wallet.id,
      userId: params.userId,
      type: "spend",
      amount: params.amount,
      balanceBefore: wallet.balance,
      balanceAfter: updatedWallet.balance,
      source: "redemption",
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      description: params.description ?? `Redeemed ${params.amount} coins`,
      idempotencyKey: key,
    });

    await coinRepo.queueNotification({
      userId: params.userId,
      notificationType: "coins_redeemed",
      title: "Coins Redeemed",
      body: `You redeemed ${params.amount} Super Coins`,
      channel: "in_app",
      referenceType: params.referenceType,
      referenceId: params.referenceId,
    });

    const coinValue = 1;
    return { transaction: tx, coinDiscount: params.amount * coinValue, remainingAmount: updatedWallet.balance };
  });
}

export async function refundCoins(
  userId: string,
  referenceType: string,
  referenceId: string,
  orderAmount?: number,
): Promise<WalletTransactionRecord | null> {
  const existingEarns = await coinRepo.getTransactionsByReference(referenceType, referenceId);
  const earnTxs = existingEarns.filter(t => t.type === "earn" || t.type === "promotional_credit");

  if (earnTxs.length === 0) {
    const pendingOrders = await coinRepo.getTransactionsByReference(referenceType, referenceId);
    const pendingTx = pendingOrders.find(t => t.source === "order_pending");
    if (pendingTx) return null;
    return null;
  }

  const totalEarned = earnTxs.reduce((sum, t) => sum + t.amount, 0);

  return withTransaction(async () => {
    const wallet = await coinRepo.getOrCreateWallet(userId);
    const refundAmount = Math.min(totalEarned, wallet.balance);

    if (refundAmount <= 0) return null;

    await coinRepo.updateWalletBalance(wallet.id, -refundAmount, "balance");
    await coinRepo.updateWalletBalance(wallet.id, refundAmount, "lifetimeRefunded");

    const updatedWallet = await coinRepo.getWalletById(wallet.id);
    if (!updatedWallet) throw new Error("Wallet not found");

    const tx = await coinRepo.createTransaction({
      walletId: wallet.id,
      userId,
      type: "refund",
      amount: refundAmount,
      balanceBefore: wallet.balance,
      balanceAfter: updatedWallet.balance,
      source: "order_refund",
      referenceType,
      referenceId,
      description: `Refunded ${refundAmount} coins for ${referenceType} #${referenceId}`,
    });

    return tx;
  });
}

export async function expireCoins(userId: string, amount: number, description?: string): Promise<WalletTransactionRecord | null> {
  return withTransaction(async () => {
    const wallet = await coinRepo.getOrCreateWallet(userId);
    const expireAmount = Math.min(amount, wallet.balance);
    if (expireAmount <= 0) return null;

    await coinRepo.updateWalletBalance(wallet.id, -expireAmount, "balance");
    await coinRepo.updateWalletBalance(wallet.id, expireAmount, "lifetimeExpired");

    const updatedWallet = await coinRepo.getWalletById(wallet.id);
    if (!updatedWallet) throw new Error("Wallet not found");

    return coinRepo.createTransaction({
      walletId: wallet.id,
      userId,
      type: "expire",
      amount: expireAmount,
      balanceBefore: wallet.balance,
      balanceAfter: updatedWallet.balance,
      source: "expiry",
      description: description ?? `${expireAmount} coins expired`,
    });
  });
}

export async function expireUserCoins(userId: string): Promise<number> {
  const { rows: earnTxs } = await query<{ id: string; amount: number }>(
    `SELECT id, amount
     FROM wallet_transactions
     WHERE user_id = $1
       AND type IN ('earn', 'promotional_credit')
       AND expiry_date IS NOT NULL
       AND expiry_date <= now()
     ORDER BY created_at ASC`,
    [userId]
  );

  let totalExpired = 0;

  for (const earnTx of earnTxs) {
    const idempotencyKey = `expire:${earnTx.id}`;
    const already = await coinRepo.getTransactionByIdempotencyKey(idempotencyKey);
    if (already) continue;

    await withTransaction(async () => {
      const wallet = await coinRepo.getOrCreateWallet(userId);
      const expireAmount = Math.min(Number(earnTx.amount), wallet.balance);
      if (expireAmount <= 0) return;

      await coinRepo.updateWalletBalance(wallet.id, -expireAmount, "balance");
      await coinRepo.updateWalletBalance(wallet.id, expireAmount, "lifetimeExpired");
      const updatedWallet = await coinRepo.getWalletById(wallet.id);
      if (!updatedWallet) throw new Error("Wallet not found");

      await coinRepo.createTransaction({
        walletId: wallet.id,
        userId,
        type: "expire",
        amount: expireAmount,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        source: "expiry",
        referenceType: "earn_transaction",
        referenceId: earnTx.id,
        description: `${expireAmount} coins expired (90-day validity)`,
        idempotencyKey,
      });

      totalExpired += expireAmount;
    });
  }

  return totalExpired;
}

export async function checkAndUpgradeTier(userId: string): Promise<MembershipTierRecord | null> {
  const tiers = await coinRepo.getMembershipTiers();
  const wallet = await coinRepo.getOrCreateWallet(userId);
  const currentTierRecord = await coinRepo.getUserTier(userId);

  const orderStats = await getOrderStats(userId);

  let bestTier: MembershipTierRecord = tiers[0];
  for (const tier of tiers) {
    const meetsSpend = orderStats.totalSpent >= tier.minLifetimeSpend;
    const meetsOrders = orderStats.totalOrders >= tier.minOrders;
    const meetsCoins = wallet.lifetimeEarned >= tier.minCoinsEarned;
    if (meetsSpend && meetsOrders && meetsCoins) {
      bestTier = tier;
    }
  }

  if (!currentTierRecord || bestTier.level > currentTierRecord.level) {
    await coinRepo.setUserTier(
      userId,
      bestTier.id,
      currentTierRecord?.id ?? null,
      `Auto-upgrade to ${bestTier.name}`
    );

    await coinRepo.queueNotification({
      userId,
      notificationType: "membership_upgraded",
      title: "Tier Upgraded!",
      body: `Congratulations! You've been upgraded to ${bestTier.name} tier!`,
      channel: "in_app",
    });

    return bestTier;
  }

  return null;
}

export async function processExpiryBatch(): Promise<{ batchId: string; expired: number; usersAffected: number }> {
  const today = new Date();
  const batch = await coinRepo.createExpiryBatch(today);

  return withTransaction(async () => {
    const result = await query<{ walletId: string; userId: string; amount: number }>(
      `SELECT wt.wallet_id AS "walletId", wt.user_id AS "userId", SUM(wt.amount) AS amount
       FROM wallet_transactions wt
       WHERE wt.type IN ('earn', 'promotional_credit')
         AND wt.expiry_date IS NOT NULL
         AND wt.expiry_date <= now()
         AND wt.id NOT IN (
           SELECT reference_id FROM wallet_transactions
           WHERE reference_type = 'expiry' AND type = 'expire'
         )
       GROUP BY wt.wallet_id, wt.user_id`
    );

    let totalExpired = 0;
    for (const row of result.rows) {
      const wallet = await coinRepo.getWalletById(row.walletId);
      if (!wallet || wallet.balance <= 0) continue;

      const expireAmount = Math.min(row.amount, wallet.balance);
      if (expireAmount <= 0) continue;

      await expireCoins(row.userId, expireAmount, `Batch expiry ${today.toISOString().split("T")[0]}`);
      totalExpired += expireAmount;
    }

    return {
      batchId: batch.id,
      expired: totalExpired,
      usersAffected: result.rows.length,
    };
  });
}
