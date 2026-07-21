import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";
import { createAuditLog } from "@/postgres/repositories/coins";
import { earnCoins, expireCoins } from "@/lib/coins/wallet-service";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const status = searchParams.get("status") ?? undefined;

  const result = await coinRepo.getAllWalletsPaginated({ limit, offset, status });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { action, userId, amount, reason } = body;

    if (action === "freeze") {
      const wallet = await coinRepo.getOrCreateWallet(userId);
      await coinRepo.freezeWallet(wallet.id);
      await createAuditLog({ adminId: user.userId, action: "freeze_wallet", resourceType: "wallet", resourceId: wallet.id, details: { userId } });
      return NextResponse.json({ success: true });
    }

    if (action === "unfreeze") {
      const wallet = await coinRepo.getOrCreateWallet(userId);
      await coinRepo.unfreezeWallet(wallet.id);
      await createAuditLog({ adminId: user.userId, action: "unfreeze_wallet", resourceType: "wallet", resourceId: wallet.id, details: { userId } });
      return NextResponse.json({ success: true });
    }

    if (action === "credit") {
      const tx = await earnCoins({ userId, amount, source: "admin_credit", description: reason ?? "Admin credit" });
      await createAuditLog({ adminId: user.userId, action: "admin_credit", resourceType: "wallet", resourceId: tx.walletId, details: { userId, amount, reason } });
      return NextResponse.json({ transaction: tx });
    }

    if (action === "debit") {
      const tx = await expireCoins(userId, amount, reason ?? "Admin debit");
      if (!tx) return NextResponse.json({ error: "No coins to debit" }, { status: 400 });
      await createAuditLog({ adminId: user.userId, action: "admin_debit", resourceType: "wallet", resourceId: tx.walletId, details: { userId, amount, reason } });
      return NextResponse.json({ transaction: tx });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
