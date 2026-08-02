"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Sparkles, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import LanguagePicker from "@/components/LanguagePicker";
import { CartSmiley, getCartMood } from "@/components/CartSmiley";

// ── Default strings — English so the cart is usable if translation fails ──
const CART_STRINGS = {
  loadingCart: "Loading your cart...",
  myCart: "My Cart",
  itemSingular: "item",
  itemPlural: "items",
  emptyCartTitle: "Your cart is empty",
  emptyCartSub: "Looks like you haven't added anything yet.",
  shopNow: "Shop Gear",
  freeDeliveryMsg: "You've got free delivery on this order!",
  addMoreDelivery1: "Add ₹",
  addMoreDelivery2: " more for free delivery",
  size: "Size:",
  off: "off",
  removing: "Removing...",
  remove: "Remove",
  viewDetails: "View Details",
  placeOrder: "Checkout",
  priceDetails: "Order Summary",
  priceLabel: "Subtotal",
  discountLabel: "Discount",
  deliveryCharges: "Shipping",
  free: "Free",
  totalAmount: "Total",
  saveMsg1: "You'll save ₹",
  saveMsg2: " on this order",
  safeCheckoutMsg: "Secure checkout. Easy returns. Authentic gear.",
  moodEmpty: "Waiting to be filled up!",
  moodContent: "Off to a good start.",
  moodHappy: "Now we're talking!",
  moodEcstatic: "Look at those savings!",
};

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    image: string;
    price: number;
    actualPrice?: number;
    category: string;
    discount?: number;
  };
  quantity: number;
  size?: string;
}

export default function CartPage() {
  const router = useRouter();
  const { t, isTranslating } = useTranslation("cart", CART_STRINGS);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchCart = () => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (itemId: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, quantity: newQty } : i))
    );
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: newQty }),
    });
    window.dispatchEvent(new CustomEvent("cart-updated"));
  };

  const removeItem = async (itemId: string) => {
    setRemoving(itemId);
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i._id !== itemId));
    setRemoving(null);
    window.dispatchEvent(new CustomEvent("cart-updated"));
  };

  const handlePlaceOrder = () => {
    router.push(`/checkout?fromCart=true`);
  };

  // ── Totals ──────────────────────────────────────────────
  const subtotal = items.reduce(
    (sum, i) => sum + (i.productId?.price ?? 0) * i.quantity,
    0
  );
  const totalActual = items.reduce(
    (sum, i) =>
      sum + ((i.productId?.actualPrice ?? i.productId?.price ?? 0) * i.quantity),
    0
  );
  const totalDiscount = totalActual - subtotal;
  const delivery = subtotal > 499 ? 0 : 40;
  const grandTotal = subtotal + delivery;

  // ── Cart mood ─────────────────────────────────────────────
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const mood = getCartMood(totalUnits, totalDiscount);
  const moodMessage = {
    empty: t("moodEmpty"),
    content: t("moodContent"),
    happy: t("moodHappy"),
    ecstatic: t("moodEcstatic"),
  }[mood];

  // ── Loading state ────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9f8]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#e0e0e0] border-t-[#1a211e] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#606562] font-medium text-[13px] uppercase tracking-[0.05em]">{t("loadingCart")}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#f8f9f8] text-[#1a211e] font-sans ${isTranslating ? "opacity-85" : "opacity-100"} transition-opacity duration-200 pb-24`}>

      <div className="max-w-[1200px] mx-auto pt-10 px-5 md:pt-16">

        <div className="flex flex-col items-center mb-8 md:mb-12">
          <CartSmiley mood={mood} size={64} className="mb-3" />
          <h1 className="display-serif text-[40px] md:text-[56px] m-0 text-center text-[#1a211e]">
            {t("myCart")}
          </h1>
          {items.length > 0 && (
            <p className="text-[13px] text-[#606562] mt-2 uppercase tracking-[0.05em] font-medium">
              {moodMessage}
            </p>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="max-w-[480px] mx-auto text-center py-16 px-6 bg-white border border-[#e0e0e0]">
            <h2 className="text-[24px] font-normal text-[#1a211e] m-0 mb-2 font-serif">{t("emptyCartTitle")}</h2>
            <p className="text-[14px] text-[#606562] m-0 mb-8">{t("emptyCartSub")}</p>
            <button onClick={() => router.push("/")} className="bg-[#1a211e] hover:bg-[#363537] text-white border-none px-8 py-3.5 rounded text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer transition-colors w-full">
              {t("shopNow")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

            {/* LEFT — Cart Items */}
            <div className="flex flex-col">

              {/* Delivery notice */}
              <div className="bg-[#eef1f0] px-5 py-4 text-[13px] font-bold tracking-[0.05em] uppercase text-[#1a211e] flex items-center gap-3 mb-6">
                <Truck className="w-4 h-4 shrink-0" />
                {delivery === 0
                  ? t("freeDeliveryMsg")
                  : `${t("addMoreDelivery1")}${(499 - subtotal).toLocaleString("en-IN")}${t("addMoreDelivery2")}`}
              </div>

              {/* Item List */}
              <div className="bg-white border-y border-[#e0e0e0]">
                {items.map((item, idx) => {
                  const p = item.productId;
                  if (!p) return null;
                  const discountPct = p.actualPrice
                    ? Math.round(((p.actualPrice - p.price) / p.actualPrice) * 100)
                    : p.discount ?? 0;
                  const isRemoving = removing === item._id;

                  return (
                    <div key={item._id} className={`p-5 md:p-6 flex flex-col sm:flex-row gap-5 md:gap-8 ${idx > 0 ? "border-t border-[#e0e0e0]" : ""} ${isRemoving ? "opacity-40" : "opacity-100"} transition-opacity`}>

                      {/* Product image */}
                      <div
                        onClick={() => router.push(`/product/${p._id}`)}
                        className="w-[120px] h-[120px] shrink-0 bg-[#eef1f0] cursor-pointer group relative overflow-hidden"
                      >
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#606562] text-xs">No image</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h3
                              onClick={() => router.push(`/product/${p._id}`)}
                              className="text-[16px] font-normal text-[#1a211e] m-0 cursor-pointer hover:underline underline-offset-4"
                            >
                              {p.name}
                            </h3>
                            <div className="text-right shrink-0">
                              <div className="text-[16px] font-normal text-[#1a211e]">
                                ₹{(p.price * item.quantity)?.toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>

                          <div className="text-[13px] text-[#606562] mb-3 font-normal">
                            {p.category} {item.size ? ` • Size: ${item.size}` : ""}
                          </div>

                          {/* Price row per unit */}
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-[14px] text-[#1a211e]">
                              ₹{p.price?.toLocaleString("en-IN")}
                            </span>
                            {p.actualPrice && (
                              <span className="text-[13px] text-[#cccfcd] line-through">
                                ₹{p.actualPrice?.toLocaleString("en-IN")}
                              </span>
                            )}
                            {discountPct > 0 && (
                              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#1a211e] bg-[#eef1f0] px-2 py-0.5 ml-1">
                                {discountPct}% {t("off")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-6 mt-auto">
                          {/* Qty */}
                          <div className="flex items-center border border-[#cccfcd] h-9">
                            <button
                              onClick={() => updateQty(item._id, -1, item.quantity)}
                              disabled={item.quantity <= 1}
                              className="w-9 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-[#1a211e] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#eef1f0] transition-colors"
                            >−</button>
                            <span className="w-10 text-center text-[13px] font-medium text-[#1a211e]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item._id, 1, item.quantity)}
                              className="w-9 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-[#1a211e] hover:bg-[#eef1f0] transition-colors"
                            >+</button>
                          </div>

                          {/* Remove */}
                          <button onClick={() => removeItem(item._id)} disabled={isRemoving} className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#606562] hover:text-[#1a211e] bg-transparent border-none cursor-pointer p-0 underline-offset-4 hover:underline">
                            {isRemoving ? t("removing") : t("remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 flex justify-between items-center px-2">
                <button onClick={() => router.push("/")} className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#606562] hover:text-[#1a211e] bg-transparent border-none cursor-pointer p-0 flex items-center gap-2">
                  ← {t("shopNow") || "Continue Shopping"}
                </button>
              </div>
            </div>

            {/* RIGHT — Price Summary */}
            <div className="bg-[#1a211e] text-white p-6 md:p-8 lg:sticky lg:top-[100px]">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/70 m-0 mb-6 pb-4 border-b border-white/10">
                {t("priceDetails")}
              </h2>

              <div className="flex flex-col gap-4 text-[14px]">
                <div className="flex justify-between text-white/90">
                  <span>{t("priceLabel")} ({items.length} {items.length !== 1 ? t("itemPlural") : t("itemSingular")})</span>
                  <span>₹{totalActual.toLocaleString("en-IN")}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-white/90">
                    <span>{t("discountLabel")}</span>
                    <span>− ₹{totalDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-white/90">
                  <span>{t("deliveryCharges")}</span>
                  {delivery === 0 ? (
                    <span>
                      <span className="line-through text-white/40 mr-2">₹40</span>
                      <span className="font-bold">{t("free")}</span>
                    </span>
                  ) : (
                    <span>₹{delivery}</span>
                  )}
                </div>

                <div className="border-t border-white/10 mt-2 pt-4 flex justify-between text-[18px] font-normal">
                  <span>{t("totalAmount")}</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="mt-4 bg-white/5 border border-white/10 text-white text-[12px] font-bold tracking-[0.02em] p-3 text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("saveMsg1")}{totalDiscount.toLocaleString("en-IN")}{t("saveMsg2")}
                  </div>
                )}
              </div>

              <button onClick={handlePlaceOrder} className="w-full mt-8 bg-white hover:bg-[#eef1f0] text-[#1a211e] border-none px-6 py-4 rounded-sm text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer transition-colors shadow-none">
                {t("placeOrder")}
              </button>

              {/* Safe checkout badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/50 uppercase tracking-[0.05em]">
                <ShieldCheck className="w-4 h-4" /> {t("safeCheckoutMsg")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}