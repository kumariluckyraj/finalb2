import type { TimestampedRecord } from "./common";

export type WalletStatus = "active" | "frozen";

export type TransactionType =
  | "earn" | "spend" | "refund" | "expire" | "adjustment"
  | "admin_credit" | "admin_debit" | "reversal"
  | "promotional_credit" | "referral_reward";

export type CampaignType =
  | "festival" | "promotional" | "category_bonus" | "brand_bonus"
  | "game" | "lucky_wheel" | "scratch_card" | "achievement";

export type CampaignStatus = "draft" | "active" | "paused" | "ended" | "cancelled";

export type RuleType = "earn" | "spend" | "limit" | "expiry" | "tier";

export type RedemptionType =
  | "fixed_discount" | "percentage_discount" | "coupon"
  | "partner_reward" | "gift_card" | "membership"
  | "premium_subscription" | "exclusive_product" | "shipping_discount";

export type NotificationType =
  | "coins_earned" | "coins_redeemed" | "coins_expiring"
  | "membership_upgraded" | "campaign_available" | "birthday_reward";

export type NotificationChannel = "push" | "email" | "sms" | "in_app";

export type NotificationStatus = "pending" | "sent" | "failed";

export interface WalletRecord extends TimestampedRecord {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  lifetimeRefunded: number;
  pendingCoins: number;
  status: WalletStatus;
}

export interface WalletTransactionRecord {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  referenceType: string | null;
  referenceId: string | null;
  campaignId: string | null;
  expiryDate: Date | null;
  description: string;
  metadata: Record<string, unknown>;
  idempotencyKey: string | null;
  createdAt: Date;
}

export interface CoinRuleRecord extends TimestampedRecord {
  id: string;
  ruleKey: string;
  name: string;
  description: string;
  ruleType: RuleType;
  config: Record<string, unknown>;
  isActive: boolean;
  priority: number;
}

export interface CampaignRecord extends TimestampedRecord {
  id: string;
  name: string;
  description: string;
  campaignType: CampaignType;
  config: Record<string, unknown>;
  startDate: Date;
  endDate: Date;
  budgetCoins: number;
  coinsAwarded: number;
  maxPerUser: number;
  status: CampaignStatus;
}

export interface MembershipTierRecord extends TimestampedRecord {
  id: string;
  name: string;
  level: number;
  minLifetimeSpend: number;
  minOrders: number;
  minCoinsEarned: number;
  coinMultiplier: number;
  maxRedemptionPercent: number;
  maxRedemptionCoins: number;
  benefits: Record<string, unknown>;
  isActive: boolean;
}

export interface UserTierHistoryRecord {
  id: string;
  userId: string;
  tierId: string;
  previousTierId: string | null;
  reason: string;
  createdAt: Date;
}

export interface RedemptionRuleRecord extends TimestampedRecord {
  id: string;
  name: string;
  ruleType: RedemptionType;
  config: Record<string, unknown>;
  isActive: boolean;
  priority: number;
}

export interface CoinExpiryBatchRecord {
  id: string;
  batchDate: Date;
  status: "pending" | "processing" | "completed" | "failed";
  coinsExpired: number;
  usersAffected: number;
  errorLog: Record<string, unknown>[];
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface NotificationQueueRecord {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  sentAt: Date | null;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: string;
  adminId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
}
