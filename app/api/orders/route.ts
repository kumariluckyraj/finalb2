import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { razorpay } from "@/lib/razorpay";
import { withTransaction, query } from "@/postgres/lib/db";
import { listOrdersByUserId } from "@/postgres/repositories/orders";
import { getCart } from "@/postgres/repositories/cart";
import { toApiOrder } from "@/lib/apiTransform";
import { findCouponById, incrementCouponUsage, recordCouponUsage, getUserCouponUsage } from "@/postgres/repositories/coupons";
import { findPromotionByCode, incrementPromotionUsage, recordPromotionUsage, getUserPromotionUsage } from "@/postgres/repositories/promotions";
import { createSellerOrder } from "@/postgres/repositories/sellerOrders";
import type { CartWithItemsRecord } from "@/postgres/models/Cart";

type ProductRow = {
  id: string;
  vendorId: string;
  price: number;
  stock: number | null;
};

const COMMISSION_PERCENT = 10; // 10% platform commission

type OrderRow = {
  id: string;
  userId: string;
  productId: string;
  vendorId: string;
  quantity: number;
  size: string | null;
  addressFullName: string | null;
  addressPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPincode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

class RouteError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    const { productId, quantity, address, paymentMethod, size, fromCart, couponId, promotionCode, coinsUsed } = await req.json();

    const { createdOrders, totalAmount } = await withTransaction(async (client) => {
      let itemsToProcess: { productId: string; quantity: number; size?: string }[] = [];
      let fromCartCart: CartWithItemsRecord | null = null;
      if (fromCart) {
        fromCartCart = await getCart(user.userId);
        if (!fromCartCart.items || fromCartCart.items.length === 0) throw new RouteError("Cart is empty", 400);
        itemsToProcess = fromCartCart.items
          .map(item => ({ productId: item.productId?.id, quantity: item.quantity, size: item.size }))
          .filter((i): i is { productId: string; quantity: number; size: string } => !!i.productId);
      } else {
        itemsToProcess = [{ productId, quantity, size }];
      }

      if (itemsToProcess.length === 0) throw new RouteError("No items to process", 400);

      const createdOrders = [];
      let grandTotal = 0;
      let appliedCoupon: any = null;
      let appliedPromotion: any = null;
      let couponDiscountTotal = 0;

      for (const item of itemsToProcess) {
        const { rows } = await client.query<ProductRow>(
          `
            SELECT id, vendor_id AS "vendorId", price::float8 AS price, stock
            FROM products
            WHERE id = $1
            FOR UPDATE
          `,
          [item.productId]
        );

        const productRow = rows[0];
        if (!productRow) throw new RouteError(`Product not found`, 404);

        if (typeof productRow.stock === "number") {
          if (productRow.stock < item.quantity) throw new RouteError("Out of stock", 409);
          await client.query(
            `UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1`,
            [item.productId, item.quantity]
          );
        }

        if (couponId && !appliedCoupon) {
          const coupon = await findCouponById(couponId);
          if (!coupon || !coupon.isActive || new Date() < new Date(coupon.startsAt) || new Date() > new Date(coupon.endsAt)) {
            throw new RouteError("Invalid or expired coupon", 400);
          }
          if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new RouteError("Coupon usage limit reached", 400);
          }
          const userUsage = await getUserCouponUsage(coupon.id, user.userId);
          if (userUsage >= coupon.perUserLimit) {
            throw new RouteError("Coupon already used", 400);
          }
          if (coupon.minCartValue && grandTotal + (productRow.price * item.quantity) < coupon.minCartValue) {
            throw new RouteError(`Minimum cart value of ₹${coupon.minCartValue} required`, 400);
          }
          appliedCoupon = coupon;
        }

        // Validate promotion code
        if (!appliedCoupon && !appliedPromotion && promotionCode) {
          const promo = await findPromotionByCode(promotionCode);
          if (!promo) throw new RouteError("Invalid or expired promotion code", 400);
          if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
            throw new RouteError("Promotion usage limit reached", 400);
          }
          if (promo.perUserLimit) {
            const promoUserUsage = await getUserPromotionUsage(promo.id, user.userId);
            if (promoUserUsage >= promo.perUserLimit) {
              throw new RouteError("Promotion already used", 400);
            }
          }
          if (promo.minOrderValue && grandTotal + (productRow.price * item.quantity) < promo.minOrderValue) {
            throw new RouteError(`Minimum order value of ₹${promo.minOrderValue} required`, 400);
          }
          // Check category/ product targeting
          const productCat = await client.query<{ category: string }>(`SELECT category FROM products WHERE id = $1`, [item.productId]);
          const cat = productCat.rows[0]?.category;
          if (promo.applicableCategories?.length > 0 && cat && !promo.applicableCategories.includes(cat)) {
            throw new RouteError("Promotion not applicable for this product category", 400);
          }
          if (promo.applicableProducts?.length > 0 && !promo.applicableProducts.includes(item.productId)) {
            throw new RouteError("Promotion not applicable for this product", 400);
          }
          appliedPromotion = promo;
          // Apply discount using same logic as coupon
          appliedCoupon = promo;
        }

        const itemTotal = productRow.price * item.quantity;
        grandTotal += itemTotal;
        let orderTotal = itemTotal;
        if (appliedCoupon) {
          let discAmt: number;
          if (appliedCoupon.discountType === "percentage") {
            discAmt = itemTotal * (appliedCoupon.discountValue / 100);
            const maxDisc = appliedCoupon.maxDiscount ?? appliedCoupon.maxDiscountAmount;
            if (maxDisc) discAmt = Math.min(discAmt, maxDisc);
          } else {
            discAmt = appliedCoupon.discountValue;
          }
          discAmt = Math.min(discAmt, itemTotal);
          couponDiscountTotal += discAmt;
          orderTotal = itemTotal - discAmt;
        }

        const { rows: orderRows } = await client.query<OrderRow>(
          `
            INSERT INTO orders (
              id, user_id, product_id, vendor_id, quantity, size, address_full_name, address_phone,
              address_line1, address_line2, address_city, address_state, address_pincode,
              payment_method, payment_status, status, total_amount
            )
            VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15)
            RETURNING id, user_id AS "userId", product_id AS "productId", vendor_id AS "vendorId", quantity, size, address_full_name AS "addressFullName", address_phone AS "addressPhone", address_line1 AS "addressLine1", address_line2 AS "addressLine2", address_city AS "addressCity", address_state AS "addressState", address_pincode AS "addressPincode", payment_method AS "paymentMethod", payment_status AS "paymentStatus", razorpay_order_id AS "razorpayOrderId", razorpay_payment_id AS "razorpayPaymentId", status, total_amount::float8 AS "totalAmount", created_at AS "createdAt", updated_at AS "updatedAt"
          `,
          [
            user.userId,
            productRow.id,
            productRow.vendorId,
            item.quantity,
            item.size || null,
            address?.fullName ?? null,
            address?.phone ?? null,
            address?.line1 ?? null,
            address?.line2 ?? null,
            address?.city ?? null,
            address?.state ?? null,
            address?.pincode ?? null,
            paymentMethod ?? "cod",
            "pending",
            orderTotal,
          ]
        );

        const orderRow = orderRows[0];
        if (!orderRow) throw new RouteError("Order creation failed", 500);
        createdOrders.push(orderRow);

        const { rows: spRows } = await client.query<{ sellerId: string }>(
          `SELECT id AS "sellerId" FROM seller_profiles WHERE user_id = $1`,
          [productRow.vendorId]
        );
        if (spRows.length > 0) {
          const commissionAmount = Math.round(itemTotal * (COMMISSION_PERCENT / 100) * 100) / 100;
          const netAmount = orderTotal - commissionAmount;
          await client.query(
            `INSERT INTO seller_orders (id, order_id, seller_id, product_id, quantity, unit_price, total_price, commission_percent, commission_amount, net_amount, status)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')`,
            [orderRow.id, spRows[0].sellerId, productRow.id, item.quantity, productRow.price, itemTotal, COMMISSION_PERCENT, commissionAmount, netAmount]
          );
        }
      }

      if (fromCart && fromCartCart) {
        await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [fromCartCart.id]);
      }

      if (appliedCoupon) {
        await client.query(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [appliedCoupon.id]);
        await client.query(
          `INSERT INTO coupon_usage (id, coupon_id, user_id, order_id, used_count, last_used_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, 1, now())
           ON CONFLICT (coupon_id, user_id) DO UPDATE SET
             used_count = coupon_usage.used_count + 1,
             order_id = $3,
             last_used_at = now()`,
          [appliedCoupon.id, user.userId, createdOrders[0].id]
        );
      }

      if (appliedPromotion) {
        await client.query(`UPDATE promotions SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [appliedPromotion.id]);
        await client.query(
          `INSERT INTO promotion_usage (id, promotion_id, user_id, order_id)
           VALUES (gen_random_uuid()::text, $1, $2, $3)
           ON CONFLICT (promotion_id, user_id) DO UPDATE SET
             used_count = promotion_usage.used_count + 1,
             order_id = $3,
             last_used_at = now()`,
          [appliedPromotion.id, user.userId, createdOrders[0].id]
        );
      }

      // ---- Coin handling (moved here: after grandTotal/couponDiscountTotal/createdOrders are final) ----
      let coinsApplied = 0;
      let coinDiscountApplied = 0;

      if (coinsUsed && coinsUsed > 0) {
        const orderTotalAfterCoupon = grandTotal - couponDiscountTotal;

        // Re-validate against the real wallet balance server-side — never trust the client's number
        const walletRes = await client.query<{ id: string; balance: number; status: string }>(
          `SELECT id, balance, status FROM wallets WHERE user_id = $1 FOR UPDATE`,
          [user.userId]
        );
        const wallet = walletRes.rows[0];

        if (wallet && wallet.status === "active" && wallet.balance > 0) {
          coinsApplied = Math.min(coinsUsed, wallet.balance, orderTotalAfterCoupon);

          if (coinsApplied > 0) {
            const debited = await client.query<{ balance: number }>(
              `UPDATE wallets SET balance = balance - $1, lifetime_spent = lifetime_spent + $1, updated_at = now()
               WHERE id = $2 AND balance >= $1
               RETURNING balance`,
              [coinsApplied, wallet.id]
            );

            if (debited.rows.length === 0) {
              throw new RouteError("Insufficient SuperCoins balance", 409);
            }

            coinDiscountApplied = coinsApplied;

            await client.query(
              `INSERT INTO wallet_transactions
                (wallet_id, user_id, type, amount, balance_before, balance_after, source, reference_type, reference_id, description)
               VALUES ($1, $2, 'spend', $3, $4, $5, 'order_payment', 'order', $6, $7)`,
              [
                wallet.id,
                user.userId,
                coinsApplied,
                wallet.balance,
                debited.rows[0].balance,
                createdOrders[0].id,
                `Redeemed ${coinsApplied} SuperCoins on order`,
              ]
            );

            // Apply the discount to the order(s) actually created above
            await client.query(
              `UPDATE orders SET coins_used = $2, coin_discount = $2, total_amount = GREATEST(0, total_amount - $2), updated_at = now()
               WHERE id = $1`,
              [createdOrders[0].id, coinsApplied]
            );
          }
        }
      }

      return { createdOrders, totalAmount: grandTotal - couponDiscountTotal - coinDiscountApplied };
    });

    if (paymentMethod === "razorpay") {
      const rzpOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: createdOrders[0].id.toString().slice(0, 40),
      });

      for (const order of createdOrders) {
        await query(`UPDATE orders SET razorpay_order_id = $2, updated_at = now() WHERE id = $1`, [order.id, rzpOrder.id]);
      }

      return NextResponse.json({
        success: true,
        orderId: createdOrders[0].id.toString(), // primary backwards compatible ID
        orderIds: createdOrders.map((o: any) => o.id.toString()),
        razorpayOrderId: rzpOrder.id,
        amount: totalAmount * 100,
        orders: createdOrders.map((o: any) => toApiOrder(o)),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed!",
        orderId: createdOrders[0].id.toString(),
        orderIds: createdOrders.map((o: any) => o.id.toString()),
        orders: createdOrders.map((o: any) => toApiOrder(o)),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    const orders = await listOrdersByUserId(user.userId);
    return NextResponse.json({ orders: orders.map(toApiOrder) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}