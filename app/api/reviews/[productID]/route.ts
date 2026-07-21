import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";
import { listReviewsByProductId, createReview } from "@/postgres/repositories/reviews";
import { toApiReview } from "@/lib/apiTransform";
import {
  getOrCreateWallet, updateWalletBalance, createTransaction,
  getCoinRuleByKey,
} from "@/postgres/repositories/coins";
import type { ReviewFilters } from "@/postgres/models/Review";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productID: string }> }) {
  try {
    const { productID } = await params;
    const url = new URL(req.url);
    const filters: ReviewFilters = {};
    const ratingParam = url.searchParams.get("rating");
    if (ratingParam) filters.rating = parseInt(ratingParam);
    const hasMediaParam = url.searchParams.get("hasMedia");
    if (hasMediaParam === "true") filters.hasMedia = true;
    const sort = url.searchParams.get("sort") as ReviewFilters["sort"];
    if (sort && ["recent", "highest", "lowest"].includes(sort)) filters.sort = sort;

    const reviews = await listReviewsByProductId(productID, filters);
    const mapped = reviews.map(toApiReview);
    const avg = mapped.length ? mapped.reduce((a, r) => a + (r.rating ?? 0), 0) / mapped.length : 0;
    return NextResponse.json({ reviews: mapped, avg: avg.toFixed(1), count: mapped.length });
  } catch (error: any) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productID: string }> }) {
  const { productID } = await params;
  const user = await getAuthUser();

  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rating, comment, images, video } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Check if user actually purchased this product
    const orderCheck = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE user_id = $1 AND product_id = $2 AND status = 'delivered'`,
      [user.userId, productID]
    );
    const verified = parseInt(orderCheck.rows[0]?.count ?? "0") > 0;

    const review = await createReview({
      productId: productID,
      userId: user.userId,
      userName: user.email?.split("@")[0] || "Anonymous",
      rating,
      comment: comment || "",
      images: images || [],
      video: video || null,
      verified,
    });

    // Award coin rewards
    try {
      const wallet = await getOrCreateWallet(user.userId);
      const rules = await Promise.all([
        getCoinRuleByKey("product_review"),
        images?.length ? getCoinRuleByKey("photo_review") : null,
        video ? getCoinRuleByKey("video_review") : null,
      ]);

      for (const rule of rules) {
        if (!rule || !rule.isActive || !rule.config) continue;
        const amount = (rule.config as any)?.reward_coins ?? 0;
        if (amount <= 0) continue;
        const balanceBefore = wallet.balance;
        await updateWalletBalance(wallet.id, amount, "balance");
        await updateWalletBalance(wallet.id, amount, "lifetimeEarned");
        await createTransaction({
          walletId: wallet.id,
          userId: user.userId,
          type: "earn",
          amount,
          balanceBefore,
          balanceAfter: balanceBefore + amount,
          source: "review",
          referenceType: "review",
          referenceId: review.id,
          description: rule.name || `Coins for ${rule.ruleKey}`,
        });
      }
    } catch (coinErr) {
      // Coin reward failure shouldn't block review creation
    }

    return NextResponse.json({ review: toApiReview(review) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
