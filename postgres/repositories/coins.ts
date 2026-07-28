import { query, withTransaction } from "../lib/db";
import type {
  WalletRecord, WalletTransactionRecord, CoinRuleRecord,
  CampaignRecord, MembershipTierRecord, UserTierHistoryRecord,
  RedemptionRuleRecord, CoinExpiryBatchRecord, NotificationQueueRecord,
  AuditLogRecord, TransactionType,
} from "../models/Coin";

const walletSelect = `
  SELECT
    id, user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned",
    lifetime_spent AS "lifetimeSpent", lifetime_expired AS "lifetimeExpired",
    lifetime_refunded AS "lifetimeRefunded", pending_coins AS "pendingCoins",
    status, created_at AS "createdAt", updated_at AS "updatedAt"
  FROM wallets
`;

const txSelect = `
  SELECT
    id, wallet_id AS "walletId", user_id AS "userId", type, amount,
    balance_before AS "balanceBefore", balance_after AS "balanceAfter",
    source, reference_type AS "referenceType", reference_id AS "referenceId",
    campaign_id AS "campaignId", expiry_date AS "expiryDate",
    description, metadata, idempotency_key AS "idempotencyKey", created_at AS "createdAt"
  FROM wallet_transactions
`;

export async function getOrCreateWallet(userId: string): Promise<WalletRecord> {
  const existing = await query<WalletRecord>(`${walletSelect} WHERE user_id = $1`, [userId]);
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query<WalletRecord>(
    `INSERT INTO wallets (user_id) VALUES ($1)
     RETURNING id, user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned",
       lifetime_spent AS "lifetimeSpent", lifetime_expired AS "lifetimeExpired",
       lifetime_refunded AS "lifetimeRefunded", pending_coins AS "pendingCoins",
       status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [userId]
  );
  return rows[0];
}

export async function getWallet(userId: string): Promise<WalletRecord | null> {
  const { rows } = await query<WalletRecord>(`${walletSelect} WHERE user_id = $1`, [userId]);
  return rows[0] ?? null;
}

export async function getWalletById(id: string): Promise<WalletRecord | null> {
  const { rows } = await query<WalletRecord>(`${walletSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateWalletBalance(
  walletId: string,
  delta: number,
  field: "balance" | "lifetimeEarned" | "lifetimeSpent" | "lifetimeExpired" | "lifetimeRefunded" | "pendingCoins",
): Promise<WalletRecord> {
  const colMap: Record<string, string> = {
    balance: "balance",
    lifetimeEarned: "lifetime_earned",
    lifetimeSpent: "lifetime_spent",
    lifetimeExpired: "lifetime_expired",
    lifetimeRefunded: "lifetime_refunded",
    pendingCoins: "pending_coins",
  };
  const col = colMap[field];
  const { rows } = await query<WalletRecord>(
    `UPDATE wallets SET ${col} = GREATEST(0, ${col} + $2), updated_at = now()
     WHERE id = $1
     RETURNING id, user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned",
       lifetime_spent AS "lifetimeSpent", lifetime_expired AS "lifetimeExpired",
       lifetime_refunded AS "lifetimeRefunded", pending_coins AS "pendingCoins",
       status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [walletId, delta]
  );
  return rows[0];
}

export async function freezeWallet(walletId: string): Promise<WalletRecord> {
  const { rows } = await query<WalletRecord>(
    `UPDATE wallets SET status = 'frozen', updated_at = now() WHERE id = $1
     RETURNING id, user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned",
       lifetime_spent AS "lifetimeSpent", lifetime_expired AS "lifetimeExpired",
       lifetime_refunded AS "lifetimeRefunded", pending_coins AS "pendingCoins",
       status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [walletId]
  );
  return rows[0];
}

export async function unfreezeWallet(walletId: string): Promise<WalletRecord> {
  const { rows } = await query<WalletRecord>(
    `UPDATE wallets SET status = 'active', updated_at = now() WHERE id = $1
     RETURNING id, user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned",
       lifetime_spent AS "lifetimeSpent", lifetime_expired AS "lifetimeExpired",
       lifetime_refunded AS "lifetimeRefunded", pending_coins AS "pendingCoins",
       status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [walletId]
  );
  return rows[0];
}

export async function createTransaction(tx: {
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  referenceType?: string | null;
  referenceId?: string | null;
  campaignId?: string | null;
  expiryDate?: Date | null;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<WalletTransactionRecord> {
  const { rows } = await query<WalletTransactionRecord>(
    `INSERT INTO wallet_transactions
      (wallet_id, user_id, type, amount, balance_before, balance_after,
       source, reference_type, reference_id, campaign_id, expiry_date,
       description, metadata, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id, wallet_id AS "walletId", user_id AS "userId", type, amount,
       balance_before AS "balanceBefore", balance_after AS "balanceAfter",
       source, reference_type AS "referenceType", reference_id AS "referenceId",
       campaign_id AS "campaignId", expiry_date AS "expiryDate",
       description, metadata, idempotency_key AS "idempotencyKey", created_at AS "createdAt"`,
    [
      tx.walletId, tx.userId, tx.type, tx.amount, tx.balanceBefore, tx.balanceAfter,
      tx.source, tx.referenceType ?? null, tx.referenceId ?? null,
      tx.campaignId ?? null, tx.expiryDate ?? null,
      tx.description ?? "", JSON.stringify(tx.metadata ?? {}),
      tx.idempotencyKey ?? null,
    ]
  );
  return rows[0];
}

export async function getTransactions(
  userId: string,
  options?: { limit?: number; offset?: number; type?: TransactionType }
): Promise<WalletTransactionRecord[]> {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];
  if (options?.type) { conditions.push("type = $2"); params.push(options.type); }
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const { rows } = await query<WalletTransactionRecord>(
    `${txSelect} WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return rows;
}

export async function getTransactionByIdempotencyKey(key: string): Promise<WalletTransactionRecord | null> {
  const { rows } = await query<WalletTransactionRecord>(
    `${txSelect} WHERE idempotency_key = $1`, [key]
  );
  return rows[0] ?? null;
}

export async function getTransactionsByReference(
  referenceType: string, referenceId: string
): Promise<WalletTransactionRecord[]> {
  const { rows } = await query<WalletTransactionRecord>(
    `${txSelect} WHERE reference_type = $1 AND reference_id = $2 ORDER BY created_at DESC`,
    [referenceType, referenceId]
  );
  return rows;
}

export async function getExpiringCoinsSummary(
  userId: string
): Promise<{ amount: number; expiryDate: string } | null> {
  const earnResult = await query<{ id: string; amount: number; expiryDate: string }>(
    `SELECT id, amount, expiry_date AS "expiryDate"
     FROM wallet_transactions
     WHERE user_id = $1
       AND type IN ('earn', 'promotional_credit')
       AND expiry_date IS NOT NULL
     ORDER BY created_at ASC`,
    [userId]
  );
  if (earnResult.rows.length === 0) return null;

  // Coins already gone (spent, refunded back, or previously expired) eat into
  // the OLDEST earn batches first — that's what makes this FIFO.
  const consumedResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM wallet_transactions
     WHERE user_id = $1 AND type IN ('spend', 'expire', 'refund')`,
    [userId]
  );
  let toConsume = parseInt(consumedResult.rows[0].total, 10);

  for (const tx of earnResult.rows) {
    const amount = Number(tx.amount);
    if (toConsume >= amount) {
      toConsume -= amount;
      continue; // this whole batch has already been used up
    }
    const remainingInBatch = amount - toConsume;
    toConsume = 0;
    if (remainingInBatch > 0 && new Date(tx.expiryDate) > new Date()) {
      return { amount: remainingInBatch, expiryDate: tx.expiryDate };
    }
  }
  return null;
}

export async function getCoinRules(ruleType?: string): Promise<CoinRuleRecord[]> {
  if (ruleType) {
    const { rows } = await query<CoinRuleRecord>(
      `SELECT id, rule_key AS "ruleKey", name, description, rule_type AS "ruleType",
        config, is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM coin_rules WHERE rule_type = $1 AND is_active = true ORDER BY priority DESC`,
      [ruleType]
    );
    return rows;
  }
  const { rows } = await query<CoinRuleRecord>(
    `SELECT id, rule_key AS "ruleKey", name, description, rule_type AS "ruleType",
      config, is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM coin_rules WHERE is_active = true ORDER BY rule_type, priority DESC`
  );
  return rows;
}

export async function getCoinRuleByKey(ruleKey: string): Promise<CoinRuleRecord | null> {
  const { rows } = await query<CoinRuleRecord>(
    `SELECT id, rule_key AS "ruleKey", name, description, rule_type AS "ruleType",
      config, is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM coin_rules WHERE rule_key = $1`,
    [ruleKey]
  );
  return rows[0] ?? null;
}

export async function getActiveCampaigns(): Promise<CampaignRecord[]> {
  const { rows } = await query<CampaignRecord>(
    `SELECT id, name, description, campaign_type AS "campaignType",
      config, start_date AS "startDate", end_date AS "endDate",
      budget_coins AS "budgetCoins", coins_awarded AS "coinsAwarded",
      max_per_user AS "maxPerUser", status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM campaigns WHERE status = 'active' AND start_date <= now() AND end_date >= now()
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function createCampaign(c: Omit<CampaignRecord, "id" | "createdAt" | "updatedAt" | "coinsAwarded">): Promise<CampaignRecord> {
  const { rows } = await query<CampaignRecord>(
    `INSERT INTO campaigns (name, description, campaign_type, config, start_date, end_date, budget_coins, max_per_user, status)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)
     RETURNING id, name, description, campaign_type AS "campaignType",
       config, start_date AS "startDate", end_date AS "endDate",
       budget_coins AS "budgetCoins", coins_awarded AS "coinsAwarded",
       max_per_user AS "maxPerUser", status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [c.name, c.description, c.campaignType, JSON.stringify(c.config), c.startDate, c.endDate, c.budgetCoins, c.maxPerUser, c.status]
  );
  return rows[0];
}

export async function getMembershipTiers(): Promise<MembershipTierRecord[]> {
  const { rows } = await query<MembershipTierRecord>(
    `SELECT id, name, level, min_lifetime_spend AS "minLifetimeSpend",
      min_orders AS "minOrders", min_coins_earned AS "minCoinsEarned",
      coin_multiplier AS "coinMultiplier", max_redemption_percent AS "maxRedemptionPercent",
      max_redemption_coins AS "maxRedemptionCoins", benefits,
      is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM membership_tiers WHERE is_active = true ORDER BY level ASC`
  );
  return rows;
}

export async function getUserTier(userId: string): Promise<(MembershipTierRecord & { userTierId: string }) | null> {
  const { rows } = await query<MembershipTierRecord & { userTierId: string }>(
    `SELECT mt.id, mt.name, mt.level, mt.min_lifetime_spend AS "minLifetimeSpend",
      mt.min_orders AS "minOrders", mt.min_coins_earned AS "minCoinsEarned",
      mt.coin_multiplier AS "coinMultiplier", mt.max_redemption_percent AS "maxRedemptionPercent",
      mt.max_redemption_coins AS "maxRedemptionCoins", mt.benefits,
      mt.is_active AS "isActive", mt.created_at AS "createdAt", mt.updated_at AS "updatedAt",
      uth.id AS "userTierId"
     FROM user_tier_history uth
     JOIN membership_tiers mt ON mt.id = uth.tier_id
     WHERE uth.user_id = $1
     ORDER BY uth.created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function setUserTier(userId: string, tierId: string, previousTierId: string | null, reason: string): Promise<UserTierHistoryRecord> {
  const { rows } = await query<UserTierHistoryRecord>(
    `INSERT INTO user_tier_history (user_id, tier_id, previous_tier_id, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id AS "userId", tier_id AS "tierId",
       previous_tier_id AS "previousTierId", reason, created_at AS "createdAt"`,
    [userId, tierId, previousTierId, reason]
  );
  return rows[0];
}

export async function getRedemptionRules(): Promise<RedemptionRuleRecord[]> {
  const { rows } = await query<RedemptionRuleRecord>(
    `SELECT id, name, rule_type AS "ruleType", config,
      is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM redemption_rules WHERE is_active = true ORDER BY priority DESC`
  );
  return rows;
}

export async function getRedemptionRuleByType(ruleType: string): Promise<RedemptionRuleRecord | null> {
  const { rows } = await query<RedemptionRuleRecord>(
    `SELECT id, name, rule_type AS "ruleType", config,
      is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM redemption_rules WHERE rule_type = $1 AND is_active = true LIMIT 1`,
    [ruleType]
  );
  return rows[0] ?? null;
}

export async function createExpiryBatch(batchDate: Date): Promise<CoinExpiryBatchRecord> {
  const { rows } = await query<CoinExpiryBatchRecord>(
    `INSERT INTO coin_expiry_batches (batch_date) VALUES ($1)
     RETURNING id, batch_date AS "batchDate", status, coins_expired AS "coinsExpired",
       users_affected AS "usersAffected", error_log AS "errorLog",
       started_at AS "startedAt", completed_at AS "completedAt", created_at AS "createdAt"`,
    [batchDate]
  );
  return rows[0];
}

export async function queueNotification(n: {
  userId: string;
  notificationType: string;
  title: string;
  body: string;
  channel: string;
  referenceType?: string | null;
  referenceId?: string | null;
}): Promise<NotificationQueueRecord> {
  const { rows } = await query<NotificationQueueRecord>(
    `INSERT INTO notification_queue (user_id, notification_type, title, body, channel, reference_type, reference_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, user_id AS "userId", notification_type AS "notificationType",
       title, body, channel, status, reference_type AS "referenceType",
       reference_id AS "referenceId", metadata, sent_at AS "sentAt", created_at AS "createdAt"`,
    [n.userId, n.notificationType, n.title, n.body, n.channel, n.referenceType ?? null, n.referenceId ?? null]
  );
  return rows[0];
}

export async function createAuditLog(log: {
  adminId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<AuditLogRecord> {
  const { rows } = await query<AuditLogRecord>(
    `INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6)
     RETURNING id, admin_id AS "adminId", action, resource_type AS "resourceType",
       resource_id AS "resourceId", details, ip_address AS "ipAddress", created_at AS "createdAt"`,
    [log.adminId ?? null, log.action, log.resourceType, log.resourceId ?? null, JSON.stringify(log.details ?? {}), log.ipAddress ?? null]
  );
  return rows[0];
}

export async function getPendingNotifications(limit = 50): Promise<NotificationQueueRecord[]> {
  const { rows } = await query<NotificationQueueRecord>(
    `SELECT id, user_id AS "userId", notification_type AS "notificationType",
       title, body, channel, status, reference_type AS "referenceType",
       reference_id AS "referenceId", metadata, sent_at AS "sentAt", created_at AS "createdAt"
     FROM notification_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getWalletAnalytics() {
  const { rows } = await query<{
    totalIssued: number;
    totalRedeemed: number;
    totalExpired: number;
    totalOutstanding: number;
    activeWallets: number;
    totalWallets: number;
  }>(
    `SELECT
      COALESCE(SUM(lifetime_earned), 0) AS "totalIssued",
      COALESCE(SUM(lifetime_spent), 0) AS "totalRedeemed",
      COALESCE(SUM(lifetime_expired), 0) AS "totalExpired",
      COALESCE(SUM(balance), 0) AS "totalOutstanding",
      COUNT(*) FILTER (WHERE status = 'active') AS "activeWallets",
      COUNT(*) AS "totalWallets"
     FROM wallets`
  );
  return rows[0];
}

export async function getTopUsers(limit = 20) {
  const { rows } = await query<{ userId: string; name: string; email: string; balance: number; lifetimeEarned: number }>(
    `SELECT w.user_id AS "userId", u.name, u.email, w.balance, w.lifetime_earned AS "lifetimeEarned"
     FROM wallets w JOIN users u ON u.id = w.user_id
     ORDER BY w.lifetime_earned DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getAllWalletsPaginated(options: { limit?: number; offset?: number; status?: string }) {
  const conditions = ["1=1"];
  const params: unknown[] = [];
  if (options.status) { conditions.push(`w.status = $${params.length + 1}`); params.push(options.status); }
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM wallets w WHERE ${conditions.join(" AND ")}`,
    params
  );
  const { rows } = await query<WalletRecord & { name: string; email: string }>(
    `SELECT w.id, w.user_id AS "userId", u.name, u.email, w.balance,
       w.lifetime_earned AS "lifetimeEarned", w.lifetime_spent AS "lifetimeSpent",
       w.lifetime_expired AS "lifetimeExpired", w.lifetime_refunded AS "lifetimeRefunded",
       w.pending_coins AS "pendingCoins", w.status, w.created_at AS "createdAt", w.updated_at AS "updatedAt"
     FROM wallets w JOIN users u ON u.id = w.user_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY w.balance DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { rows, total: parseInt(countResult.rows[0].count, 10) };
}
