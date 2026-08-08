"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
import LanguagePicker from "@/components/LanguagePicker";

const INDIAN_STATES = ["Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];

const CHECKOUT_STRINGS = {
  secureCheckout: "Secure Checkout",
  securePayments: "100% Secure Payments",
  deliveryAddress: "Delivery Address",
  payment: "Payment",
  loadingCheckout: "Loading checkout...",
  orderPlaced: "Order Placed!",
  orderSuccess: "Your order has been placed successfully.",
  orderConfirmation: "You'll receive a confirmation shortly.",
  continueShopping: "Continue Shopping",
  stepDeliveryAddress: "Delivery Address",
  stepPayment: "Payment",
  deliveryAddressTitle: "Delivery Address",
  fullName: "Full Name *",
  fullNamePlaceholder: "John Doe",
  phone: "Phone *",
  phonePlaceholder: "10-digit mobile number",
  addressLine1: "Address Line 1 *",
  addressLine1Placeholder: "House no., Building, Street",
  addressLine2: "Address Line 2 (Optional)",
  addressLine2Placeholder: "Locality, Landmark",
  city: "City *",
  cityPlaceholder: "Mumbai",
  state: "State *",
  selectState: "Select State",
  pincode: "Pincode *",
  pincodePlaceholder: "400001",
  continueToPayment: "Continue to Payment →",
  deliveringTo: "Delivering to",
  change: "Change",
  selectPayment: "Select Payment Method",
  payOnline: "Pay Online",
  payOnlineDesc: "Credit/Debit Card, UPI, Net Banking, Wallets",
  cod: "Cash on Delivery",
  codDesc: "Pay with cash when your order arrives",
  qty: "Qty:",
  placingOrder: "Placing Order...",
  placeOrder: "Place Order - ₹",
  safePayments: "Safe and Secure Payments. Easy returns. 100% Authentic products.",
  priceDetails: "Price Details",
  priceItem: "Price",
  item: "item",
  items: "items",
  discount: "Discount",
  deliveryCharges: "Delivery Charges",
  free: "FREE",
  totalAmount: "Total Amount",
  youSave: "You will save ₹",
  youSaveOn: " on this order",
  trustSecure: "Safe & Secure Payments",
  trustReturns: "Easy Returns & Exchanges",
  trustAuthentic: "100% Authentic Products",
  off: "% off",
};

const b2w = {
  teal: "#1a211e", green: "#1a211e", red: "#ef4444",
  navy: "#1a211e", body: "#606562", muted: "#606562",
  border: "#e0e0e0", bg: "#f8f9f8", white: "#ffffff",
  cardShadow: "none", lightteal: "#1a211e",
};

// ─── Nominatim types ──────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// ─── OSM helpers ──────────────────────────────────────────────────────────────

/** Reverse-geocode lat/lng → NominatimResult */
async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Reverse geocode failed");
  return res.json();
}

/** Search suggestions from Nominatim */
async function searchAddress(q: string): Promise<NominatimResult[]> {
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return [];
  return res.json();
}

/** Pincode → city/state via Nominatim */
async function lookupPincode(pin: string): Promise<{ city: string; state: string } | null> {
  if (pin.length !== 6) return null;
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&addressdetails=1&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data: NominatimResult[] = await res.json();
  if (!data.length) return null;
  const a = data[0].address;
  return {
    city: a.city || a.town || a.village || a.county || "",
    state: a.state || "",
  };
}

/** Map Nominatim result → address fields */
function nominatimToAddress(r: NominatimResult) {
  const a = r.address;
  const road = [a.house_number, a.road].filter(Boolean).join(" ");
  const locality = a.suburb || a.neighbourhood || "";
  return {
    line1: road,
    line2: locality,
    city: a.city || a.town || a.village || a.county || "",
    state: matchState(a.state || ""),
    pincode: a.postcode || "",
  };
}

/** Fuzzy-match Nominatim state string to our INDIAN_STATES list */
function matchState(raw: string): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  return INDIAN_STATES.find(s => lower.includes(s.toLowerCase())) || "Other";
}

// ─── LocationButton ───────────────────────────────────────────────────────────
function LocationButton({ onLocated, onError }: {
  onLocated: (r: NominatimResult) => void;
  onError: (msg: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const detect = () => {
    if (!navigator.geolocation) { onError("Geolocation not supported by your browser."); return; }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setStatus("done");
          onLocated(result);
          setTimeout(() => setStatus("idle"), 2000);
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          setStatus("error");
          onError("Could not fetch address. Please enter manually.");
        }
      },
      () => {
        setStatus("error");
        onError("Location permission denied. Please enter address manually.");
      },
      { timeout: 10000 }
    );
  };

  const label = status === "loading" ? "Detecting…" : status === "done" ? "Location filled!" : status === "error" ? "Try again" : "Use my location";
  const bg = status === "done" ? b2w.green : status === "error" ? b2w.red : b2w.teal;

  return (
    <button
      type="button"
      onClick={detect}
      disabled={status === "loading"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: bg, color: "#fff", border: "none",
        padding: "10px 18px", borderRadius: 4, cursor: status === "loading" ? "not-allowed" : "pointer",
        fontSize: 13, fontWeight: 700, transition: "background 0.2s",
        opacity: status === "loading" ? 0.8 : 1,
      }}
    >
      {status === "loading" && (
        <span style={{
          width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)",
          borderTopColor: "#fff", borderRadius: "50%",
          animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0,
        }} />
      )}
      {label}
    </button>
  );
}

// ─── AddressAutocomplete ──────────────────────────────────────────────────────
function AddressAutocomplete({ value, onChange, onSelect, placeholder, style }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: NominatimResult) => void;
  placeholder: string;
  style: React.CSSProperties;
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(v);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 400);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={style}
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 400,
          background: "#fff", border: `1px solid ${b2w.border}`,
          borderTop: "none", borderRadius: "0 0 4px 4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto",
        }}>
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              onMouseDown={() => { onSelect(s); setOpen(false); setSuggestions([]); }}
              style={{
                padding: "10px 14px", fontSize: 13, color: b2w.navy,
                cursor: "pointer", borderBottom: `1px solid ${b2w.border}`,
                display: "flex", alignItems: "flex-start", gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0fdfa")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <span style={{ color: b2w.teal, flexShrink: 0, marginTop: 1 }}></span>
              <span style={{ lineHeight: 1.4 }}>{s.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CheckoutContent ─────────────────────────────────────────────────────────────
function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const productId = params.get("productId");
  const quantity = Number(params.get("quantity") || 1);
  const phone = params.get("phone");
  const size = params.get("size") || "";
  const fromCart = params.get("fromCart") === "true";

  const { language, translate } = useLanguage();

  const [product, setProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"address" | "payment">("address");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
 const [maxRedeemable, setMaxRedeemable] = useState(0);
  const [maxRedemptionPercent, setMaxRedemptionPercent] = useState<number | null>(null);
  const [coinRedeemAmount, setCoinRedeemAmount] = useState(0);
  const [coinRedeemEnabled, setCoinRedeemEnabled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const [address, setAddress] = useState({
    fullName: "", phone: phone || "", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false
  });

  // ── Translation state ──────────────────────────────────────────────────────
  const [trans, setTrans] = useState<Record<string, string>>(CHECKOUT_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);
  const translateRef = useRef(translate);
  useEffect(() => { translateRef.current = translate; }, [translate]);


  useEffect(() => {
  if (!productId) return;
  fetch(`/api/coupons/available?productId=${productId}`)
    .then(r => r.json())
    .then(d => setAvailableCoupons(d.coupons || []))
    .catch(() => {});
}, [productId]);


  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fromCart) {
      fetch("/api/cart").then(r => r.json()).then(d => {
        setCartItems(d.items || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else if (productId) {
      fetch(`/api/products/detail/${productId}`).then(r => r.json()).then(d => {
        setProduct(d.product);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [productId, fromCart]);

  useEffect(() => {
    fetch("/api/addresses").then(r => r.json()).then(d => {
      setAddresses(d.addresses || []);
      if (d.addresses?.length > 0) {
        const defaultAddr = d.addresses.find((a: any) => a.is_default) || d.addresses[0];
        setSelectedAddressId(defaultAddr.id);
        setAddress({
          fullName: defaultAddr.full_name,
          phone: defaultAddr.phone,
          line1: defaultAddr.address_line1,
          line2: defaultAddr.address_line2 || "",
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
          is_default: defaultAddr.is_default
        });
      } else {
        setIsAddingNewAddress(true);
      }
    }).catch(() => setIsAddingNewAddress(true));
  }, []);

  // ── Translation effect ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const calledForLang = language;
    if (calledForLang === "en") { setTrans(CHECKOUT_STRINGS); return; }
    if (!product) return;
    setIsTranslating(true);
    const payload: Record<string, string> = { ...CHECKOUT_STRINGS, productName: product.name || "" };
    translateRef.current(payload, `checkout_${productId}`)
      .then((result) => { if (!mounted || languageRef.current !== calledForLang) return; setTrans({ ...CHECKOUT_STRINGS, ...result }); })
      .catch(() => { if (mounted) setTrans(CHECKOUT_STRINGS); })
      .finally(() => { if (mounted) setIsTranslating(false); });
    return () => { mounted = false; };
  }, [language, product, productId]);

  const t = (key: keyof typeof CHECKOUT_STRINGS): string => trans[key] ?? CHECKOUT_STRINGS[key];
  const dt = (key: string, fallback: string): string => trans[key] || fallback;

  // ── OSM: GPS auto-fill ─────────────────────────────────────────────────────
  const handleLocated = useCallback((result: NominatimResult) => {
    const filled = nominatimToAddress(result);
    setAddress(prev => ({ ...prev, ...filled }));
    setLocationError(null);
  }, []);

  // ── OSM: Autocomplete select ───────────────────────────────────────────────
  const handleAutocompleteSelect = useCallback((result: NominatimResult) => {
    const filled = nominatimToAddress(result);
    setAddress(prev => ({ ...prev, line1: filled.line1, line2: filled.line2, city: filled.city, state: filled.state, pincode: filled.pincode }));
  }, []);

  // ── OSM: Pincode lookup ────────────────────────────────────────────────────
  const handlePincodeChange = useCallback(async (pin: string) => {
    setAddress(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const result = await lookupPincode(pin);
        if (result) setAddress(prev => ({ ...prev, city: result.city || prev.city, state: result.state || prev.state }));
      } finally {
        setPincodeLoading(false);
      }
    }
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const subtotal = fromCart
    ? cartItems.reduce((sum, item) => sum + ((item.productId?.price ?? 0) * item.quantity), 0)
    : (product ? product.price * quantity : 0);
  const totalActual = fromCart
    ? cartItems.reduce((sum, item) => sum + ((item.productId?.actualPrice ?? item.productId?.price ?? 0) * item.quantity), 0)
    : (product ? (product.actualPrice || product.price) * quantity : 0);

  const storeSettings = product?.store ?? null;
  const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 499;
  const deliveryCharge = storeSettings?.deliveryCharge ?? 40;
  const deliveryFee = subtotal >= freeShippingThreshold ? 0 : deliveryCharge;
  const discount = totalActual - subtotal;
  const coinDiscount = coinRedeemEnabled ? Math.min(coinRedeemAmount, subtotal + deliveryFee) : 0;

  // Bank-restricted coupons are only ever honored post-payment, once Razorpay
  // confirms the actual bank/wallet used. Until then, the discount is "pending"
  // and must NOT be subtracted from what's actually charged.
  const isBankRestrictedPending = (appliedCoupon?.bankCodes?.length ?? 0) > 0;
  const total = Math.max(0, subtotal + deliveryFee - coinDiscount - (isBankRestrictedPending ? 0 : couponDiscount));
  const totalItemsCount = fromCart ? cartItems.reduce((s, i) => s + i.quantity, 0) : quantity;

 // ── Coin data fetch ────────────────────────────────────────────────────────
  // Passes per-product context so the backend can apply each vendor's own
  // coin-validity / max-redemption-percent settings instead of a flat global cap.
  useEffect(() => {
    if (subtotal <= 0) return;

    const qp = new URLSearchParams({ amount: String(subtotal) });

    if (fromCart && cartItems.length > 0) {
      const items = cartItems.map((item: any) => ({
        productId: item.productId?._id ?? item.productId,
        subtotal: (item.productId?.price ?? 0) * item.quantity,
      }));
      qp.set("items", JSON.stringify(items));
    } else if (productId) {
      qp.set("productId", productId);
    }

    fetch(`/api/coins/redeem?${qp.toString()}`)
      .then(r => r.json())
      .then(d => {
        setCoinBalance(d.walletBalance ?? 0);
        setMaxRedeemable(d.maxRedeemable ?? 0);
        setMaxRedemptionPercent(d.maxRedemptionPercent ?? null);
      })
      .catch(() => { });
  }, [subtotal, fromCart, cartItems, productId]);

  useEffect(() => {
    if (storeSettings?.codEnabled === false && paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [storeSettings, paymentMethod]);

  // Bank-restricted coupons can't survive a switch to COD — there's no bank to verify.
  useEffect(() => {
    if (paymentMethod === "cod" && (appliedCoupon?.bankCodes?.length ?? 0) > 0) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponCode("");
      setCouponError("This coupon isn't valid for Cash on Delivery — pay online with the required bank to use it.");
    }
  }, [paymentMethod, appliedCoupon]);

  // ── Coupon apply (manual entry + "Available Coupons" quick-apply) ──────────
  const applyCoupon = async (code: string) => {
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const url = `/api/coupons?code=${encodeURIComponent(code)}&cartTotal=${subtotal}` +
        (productId ? `&productId=${productId}` : "") +
        (selectedBankCode ? `&bankCode=${selectedBankCode}` : "");
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error); return; }

      // Bank-restricted coupons can never apply on COD — no bank info exists to verify against
      if ((data.coupon.bankCodes?.length ?? 0) > 0 && paymentMethod === "cod") {
        setCouponError("This coupon requires online payment via a specific bank.");
        return;
      }

      setAppliedCoupon(data.coupon);
      setCouponDiscount(data.discountAmount);
      setCouponCode(data.coupon.code);
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

 const placeOrder = async () => {
  setPlacing(true);
  const coinsUsed = coinRedeemEnabled ? coinRedeemAmount : 0;
  try {
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, address, paymentMethod, size, fromCart, coinsUsed, couponId: appliedCoupon?.id ?? null }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPlacing(false);
      alert(data?.error || "Failed to place order. Please try again.");
      return;
    }

    if (paymentMethod === "razorpay" && data.razorpayOrderId) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        setPlacing(false);
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: data.amount,
          currency: "INR", order_id: data.razorpayOrderId, name: "Your Store",
          description: "Order Payment", prefill: { contact: phone },
          handler: async (response: any) => {
            const verifyRes = await fetch("/api/orders/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              alert("Payment verification failed. If money was deducted, it will be refunded automatically.");
              return;
            }
            setOrderDone(true);
          },
        });
        rzp.open();
      };
    } else if (paymentMethod === "cod") {
      setOrderDone(true);
    } else {
      // razorpay expected but no razorpayOrderId came back — treat as failure, not success
      setPlacing(false);
      alert("Could not start payment. Please try again.");
    }
  } catch (err) {
    console.error("placeOrder failed:", err);
    setPlacing(false);
    alert("Something went wrong placing your order. Please try again.");
  }
};

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", border: `1px solid ${b2w.border}`, borderRadius: 4,
    padding: "10px 12px", fontSize: 14, color: b2w.navy, background: b2w.white,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: b2w.muted, display: "block",
    marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4,
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: b2w.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${b2w.border}`, borderTopColor: b2w.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: b2w.body, fontWeight: 500, margin: 0 }}>{t("loadingCheckout")}</p>
      </div>
    </div>
  );

  if (!product && (!fromCart || cartItems.length === 0)) return (
    <div style={{ minHeight: "100vh", padding: 40, textAlign: "center", background: b2w.bg }}>
      <h2 style={{ color: b2w.navy, marginTop: 100 }}>No items to checkout</h2>
      <button onClick={() => router.push("/")} style={{ marginTop: 20, background: b2w.teal, color: "#fff", padding: "10px 20px", border: "none", borderRadius: 4, cursor: "pointer" }}>
        {t("continueShopping")}
      </button>
    </div>
  );

  if (orderDone) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: b2w.bg }}>
      <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: "48px 56px", textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, background: "#ecfdf5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>OK</div>
        <h2 style={{ color: b2w.green, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>{t("orderPlaced")}</h2>
        <p style={{ color: b2w.body, fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>{t("orderSuccess")}<br />{t("orderConfirmation")}</p>
        <button onClick={() => router.push("/")} style={{ background: "#1a211e", color: "#fff", padding: "13px 32px", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, boxShadow: "none" }}>
          {t("continueShopping")}
        </button>
      </div>
    </div>
  );

  const addressFilled = !!(address.line1 || address.city || address.pincode);

  return (
    <div style={{ minHeight: "100vh", background: b2w.bg, color: b2w.navy, opacity: isTranslating ? 0.85 : 1, transition: "opacity 0.2s" }}>
      <style>{`
        .checkout-layout {
          max-width: 1060px;
          margin: 16px auto;
          padding: 0 16px;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
          align-items: start;
        }
        .address-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .address-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }
          .address-grid, .address-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Nav (Removed to unify with global Navbar) */}

      {/* Stepper */}
      <div style={{ background: b2w.white, borderBottom: `1px solid ${b2w.border}`, padding: "14px 0" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center" }}>
          {(["address", "payment"] as const).map((s, i) => {
            const active = step === s;
            const done = s === "address" && step === "payment";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? b2w.green : active ? b2w.teal : b2w.border, color: (active || done) ? b2w.white : b2w.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {done ? "Done" : i + 1}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? b2w.teal : done ? b2w.green : b2w.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {s === "address" ? t("stepDeliveryAddress") : t("stepPayment")}
                  </span>
                </div>
                {i === 0 && <div style={{ width: 48, height: 2, background: step === "payment" ? b2w.teal : b2w.border, margin: "0 14px", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <div className="checkout-layout">

        {/* LEFT */}
        <div>
          {step === "address" && (
            <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}` }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${b2w.border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: b2w.navy }}>{t("deliveryAddressTitle")}</h2>
              </div>

              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {!isAddingNewAddress && addresses.length > 0 ? (
                  <div>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, color: b2w.navy }}>Select a delivery address</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {addresses.map((addr) => (
                        <div key={addr.id} onClick={() => {
                          setSelectedAddressId(addr.id);
                          setAddress({
                            fullName: addr.full_name, phone: addr.phone, line1: addr.address_line1,
                            line2: addr.address_line2 || "", city: addr.city, state: addr.state, pincode: addr.pincode, is_default: addr.is_default
                          });
                        }} style={{ display: "flex", gap: 12, border: `1px solid ${selectedAddressId === addr.id ? b2w.teal : b2w.border}`, background: selectedAddressId === addr.id ? b2w.lightteal : b2w.white, padding: "16px", borderRadius: 4, cursor: "pointer" }}>
                          <input type="radio" checked={selectedAddressId === addr.id} readOnly style={{ marginTop: 4 }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: b2w.navy }}>{addr.full_name} <span style={{ fontWeight: 400, color: b2w.muted }}>{addr.phone}</span></p>
                            <p style={{ margin: "4px 0 0", fontSize: 13, color: b2w.body }}>{addr.address_line1}, {addr.address_line2 ? addr.address_line2 + ", " : ""}{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></p>
                            {selectedAddressId === addr.id && (
                              <button onClick={() => setStep("payment")} style={{ marginTop: 16, background: "#1a211e", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, boxShadow: "none" }}>
                                Deliver Here
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setIsAddingNewAddress(true)} style={{ marginTop: 20, background: "none", color: b2w.teal, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                      + Add a new address
                    </button>
                  </div>
                ) : (
                  <>
                    {addresses.length > 0 && (
                      <button onClick={() => setIsAddingNewAddress(false)} style={{ background: "none", border: "none", color: b2w.teal, fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", marginBottom: -10 }}>
                        ← Back to saved addresses
                      </button>
                    )}
                    {/* ── GPS + autocomplete banner ── */}
                    <div style={{ background: "#ccfbf1", border: `1px solid #b3d4fc`, borderRadius: 6, padding: "14px 16px" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: b2w.teal }}>
                        Auto-fill your address
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <LocationButton onLocated={handleLocated} onError={setLocationError} />
                        <span style={{ fontSize: 12, color: b2w.muted }}>or search below</span>
                      </div>

                      {locationError && (
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: b2w.red, animation: "fadeIn 0.2s ease" }}>
                          {locationError}
                        </p>
                      )}

                      {/* Address search autocomplete */}
                      <div style={{ marginTop: 12 }}>
                        <AddressAutocomplete
                          value={address.line1}
                          onChange={(v) => setAddress(prev => ({ ...prev, line1: v }))}
                          onSelect={handleAutocompleteSelect}
                          placeholder="Search: e.g. MG Road, Bengaluru…"
                          style={{ ...inputStyle, background: "#fff", border: `1px solid ${b2w.teal}` }}
                        />
                        <p style={{ margin: "5px 0 0", fontSize: 11, color: b2w.muted }}>
                          Powered by OpenStreetMap - You can edit all fields below
                        </p>
                      </div>

                      {addressFilled && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#ecfdf5", borderRadius: 4, fontSize: 12, color: b2w.green, animation: "fadeIn 0.2s ease" }}>
                          Address auto-filled - please review and edit if needed
                        </div>
                      )}
                    </div>

                    {/* ── Name & Phone ── */}
                    <div className="address-grid">
                      <div>
                        <label style={labelStyle}>{t("fullName")}</label>
                        <input value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} placeholder={t("fullNamePlaceholder")} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>{t("phone")}</label>
                        <input value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} placeholder={t("phonePlaceholder")} style={inputStyle} />
                      </div>
                    </div>

                    {/* ── Address line 1 (editable; also the autocomplete target) ── */}
                    <div>
                      <label style={labelStyle}>{t("addressLine1")}</label>
                      <input
                        value={address.line1}
                        onChange={e => setAddress({ ...address, line1: e.target.value })}
                        placeholder={t("addressLine1Placeholder")}
                        style={inputStyle}
                      />
                    </div>

                    {/* ── Address line 2 ── */}
                    <div>
                      <label style={labelStyle}>{t("addressLine2")}</label>
                      <input value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} placeholder={t("addressLine2Placeholder")} style={inputStyle} />
                    </div>

                    {/* ── City, State, Pincode ── */}
                    <div className="address-grid-3">
                      <div>
                        <label style={labelStyle}>{t("city")}</label>
                        <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder={t("cityPlaceholder")} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>{t("state")}</label>
                        <select value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                          <option value="">{t("selectState")}</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>
                          {t("pincode")}
                          {pincodeLoading && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: b2w.teal, fontWeight: 400 }}>Fetching…</span>
                          )}
                        </label>
                        <input
                          value={address.pincode}
                          onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder={t("pincodePlaceholder")}
                          style={{ ...inputStyle, borderColor: pincodeLoading ? b2w.teal : b2w.border }}
                          maxLength={6}
                        />
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: b2w.muted }}>
                          City & state auto-fill on 6-digit pincode
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/addresses", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              full_name: address.fullName,
                              phone: address.phone,
                              address_line1: address.line1,
                              address_line2: address.line2,
                              city: address.city,
                              state: address.state,
                              pincode: address.pincode,
                              is_default: true
                            })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setAddresses([data.address, ...addresses.map(a => ({ ...a, is_default: false }))]);
                            setSelectedAddressId(data.address.id);
                            setIsAddingNewAddress(false);
                            setStep("payment");
                          }
                        }}
                        disabled={!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode}
                        style={{
                          background: "#1a211e", color: "#fff", border: "none",
                          padding: "14px 32px", borderRadius: 4, fontWeight: 700, cursor: "pointer",
                          fontSize: 13, textTransform: "uppercase", letterSpacing: 1, boxShadow: "none",
                          opacity: (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) ? 0.5 : 1,
                        }}>
                        Save and Deliver Here
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === "payment" && (
            <div>
              {/* Address summary */}
              <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: "14px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: b2w.teal, textTransform: "uppercase", letterSpacing: 0.5 }}>{t("deliveringTo")}</span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: b2w.navy, fontWeight: 500 }}>
                    {address.fullName} | {address.line1}, {address.city}, {address.state} - {address.pincode}
                  </p>
                  {storeSettings?.deliveryPromiseDays && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: b2w.muted }}>
                      Estimated delivery in {storeSettings.deliveryPromiseDays} days
                    </p>
                  )}
                </div>
                <button onClick={() => setStep("address")} style={{ background: "none", border: `1px solid ${b2w.teal}`, color: b2w.teal, padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {t("change")}
                </button>
              </div>

              {/* Payment options */}
              <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}` }}>
                <div style={{ padding: "16px 24px", borderBottom: `1px solid ${b2w.border}` }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: b2w.navy }}>{t("selectPayment")}</h2>
                </div>
                <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                 {[
                    { id: "razorpay", label: t("payOnline"), desc: t("payOnlineDesc"), icon: "" },
                    ...(storeSettings?.codEnabled !== false
                      ? [{ id: "cod", label: t("cod"), desc: t("codDesc"), icon: "" }]
                      : []),
                  ].map(opt => (
                    <div key={opt.id} onClick={() => setPaymentMethod(opt.id as any)}
                      style={{ border: `2px solid ${paymentMethod === opt.id ? b2w.teal : b2w.border}`, borderRadius: 4, padding: "14px 18px", cursor: "pointer", background: paymentMethod === opt.id ? b2w.lightteal : b2w.white, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `2px solid ${paymentMethod === opt.id ? b2w.teal : b2w.border}`, background: paymentMethod === opt.id ? b2w.teal : b2w.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {paymentMethod === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: b2w.white }} />}
                      </div>
                      <div style={{ fontSize: 20 }}>{opt.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: b2w.navy }}>{opt.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: b2w.muted }}>{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank offer selector (only relevant for online payment) */}
                {paymentMethod === "razorpay" && (
                  <div style={{ margin: "0 24px 20px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: b2w.navy }}>Paying with a specific bank card?</p>
                    <select
                      value={selectedBankCode}
                      onChange={e => setSelectedBankCode(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${b2w.border}`, borderRadius: 6, fontSize: 14 }}
                    >
                      <option value="">No bank offer</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="IDFC">IDFC First Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="Airtel Payments Bank">Airtel Payments Bank</option>
                    </select>
                  </div>
                )}

                {/* Product mini summary */}
                {fromCart ? (
                  <div style={{ margin: "0 24px 20px", padding: "14px 16px", background: "#fafafa", borderRadius: 12, border: `1px solid ${b2w.border}` }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: 14, color: b2w.navy }}>{cartItems.length} items in cart</p>
                    {cartItems.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: idx === cartItems.length - 1 ? 0 : 10 }}>
                        {item.productId?.image && <img src={item.productId.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain", border: `1px solid ${b2w.border}`, background: b2w.white }} />}
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: b2w.navy }}>{item.productId?.name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: b2w.muted }}>{t("qty")} {item.quantity} {item.size ? `| Variant: ${item.size}` : ""}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: b2w.navy }}>₹{((item.productId?.price ?? 0) * item.quantity).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  product && (
                    <div style={{ margin: "0 24px 20px", padding: "14px 16px", background: "#fafafa", borderRadius: 12, border: `1px solid ${b2w.border}`, display: "flex", gap: 14, alignItems: "center" }}>
                      {product.image && <img src={product.image} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "contain", border: `1px solid ${b2w.border}`, background: b2w.white }} />}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: b2w.navy }}>{dt("productName", product.name)}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 13, color: b2w.muted }}>{t("qty")} {quantity}</p>
                        {size && <p style={{ margin: "3px 0 0", fontSize: 13, color: b2w.muted }}>Variant: {size}</p>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: b2w.navy }}>₹{(product.price * quantity).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  )
                )}

                <div style={{ padding: "0 24px 24px" }}>
                  <button onClick={placeOrder} disabled={placing} style={{ width: "100%", background: "#1a211e", color: "#fff", border: "none", padding: "15px 24px", borderRadius: 4, fontWeight: 700, cursor: placing ? "not-allowed" : "pointer", fontSize: 16, boxShadow: "none", opacity: placing ? 0.7 : 1, letterSpacing: 0.3 }}>
                    {placing ? t("placingOrder") : `${t("placeOrder")}${total.toLocaleString("en-IN")}`}
                  </button>
                  <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 12, color: b2w.muted }}>{t("safePayments")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Price details */}
        <div style={{ position: "sticky", top: 72 }}>
          {fromCart ? (
            <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: 16, marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: b2w.navy }}>{cartItems.length} Items</p>
              <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                {cartItems.map((item: any, idx: number) =>
                  item.productId?.image ? <img key={idx} src={item.productId.image} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: `1px solid ${b2w.border}`, flexShrink: 0 }} title={item.productId?.name} /> : null
                )}
              </div>
            </div>
          ) : (
            product && (
              <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: 16, marginBottom: 12, display: "flex", gap: 14 }}>
                {product.image && <img src={product.image} alt="" style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 8, border: `1px solid ${b2w.border}` }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: b2w.navy, fontWeight: 500, lineHeight: 1.4 }}>{dt("productName", product.name)}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: b2w.muted }}>{t("qty")} {quantity}</p>
                  {size && <p style={{ margin: "4px 0 0", fontSize: 12, color: b2w.muted }}>Variant: {size}</p>}
                  {product.actualPrice && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: b2w.navy }}>₹{product.price.toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: 12, color: b2w.muted, textDecoration: "line-through" }}>₹{product.actualPrice.toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: b2w.green }}>{Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100)}{t("off")}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {coinBalance > 0 && (
            <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: coinRedeemEnabled ? 12 : 0 }}>
              <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: b2w.navy }}>Super Coins</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: b2w.muted }}>{coinBalance} coins available (1 coin = Re. 1)</p>
                  {maxRedemptionPercent !== null && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: b2w.muted }}>
                      Up to {maxRedemptionPercent}% of this order can be paid with coins
                    </p>
                  )}
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, cursor: "pointer" }}>
                  <input type="checkbox" checked={coinRedeemEnabled} onChange={() => { setCoinRedeemEnabled(!coinRedeemEnabled); setCoinRedeemAmount(0); }} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: "absolute", inset: 0, background: coinRedeemEnabled ? b2w.teal : "#ccc", borderRadius: 11, transition: "0.2s" }}>
                    <span style={{ position: "absolute", height: 18, width: 18, left: coinRedeemEnabled ? 20 : 2, bottom: 2, background: "#fff", borderRadius: "50%", transition: "0.2s" }} />
                  </span>
                </label>
              </div>
              {coinRedeemEnabled && (
                <div>
                  <input type="range" min={0} max={Math.min(coinBalance, maxRedeemable, subtotal + deliveryFee)} value={coinRedeemAmount}
                    onChange={e => setCoinRedeemAmount(Number(e.target.value))}
                    style={{ width: "100%", accentColor: b2w.teal }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: b2w.muted }}>
                    <span>Re. 0</span>
                    <span style={{ fontWeight: 700, color: b2w.teal }}>-Re. {coinRedeemAmount}</span>
                    <span>Re. {Math.min(coinBalance, maxRedeemable, subtotal + deliveryFee)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Available coupons (quick-apply) */}
          {availableCoupons.length > 0 && !appliedCoupon && (
            <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: 16, marginBottom: 12 }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: b2w.navy }}>Available Coupons</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {availableCoupons.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${b2w.border}`, borderRadius: 6, padding: "10px 12px" }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>{c.code}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: b2w.muted }}>
                        {c.discountType === "percentage" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                        {c.bankCodes?.length ? ` · ${c.bankCodes.join("/")} cards only` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => applyCoupon(c.code)}
                      disabled={applyingCoupon}
                      style={{ padding: "6px 14px", background: b2w.teal, color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon code */}
          <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, padding: 16, marginBottom: 12 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: b2w.navy }}>Have a coupon?</p>
            {appliedCoupon ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ecfdf5", padding: "10px 14px", borderRadius: 6, border: "1px solid #a7f3d0" }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#065f46" }}>{appliedCoupon.code}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#065f46" }}>
                    {appliedCoupon.title} - ₹{couponDiscount} off
                    {isBankRestrictedPending && ` (refunded after payment via ${appliedCoupon.bankCodes.join("/")})`}
                  </p>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponDiscount(0); setCouponCode(""); }}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Enter coupon code"
                  style={{ flex: 1, padding: "10px 12px", border: `1px solid ${couponError ? "#ef4444" : b2w.border}`, borderRadius: 6, fontSize: 14, outline: "none", textTransform: "uppercase" }}
                />
                <button
                  disabled={!couponCode || applyingCoupon}
                  onClick={() => applyCoupon(couponCode)}
                  style={{ padding: "10px 18px", background: "#1a211e", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: couponCode && !applyingCoupon ? "pointer" : "not-allowed", opacity: couponCode && !applyingCoupon ? 1 : 0.5 }}>
                  Apply
                </button>
              </div>
            )}
            {couponError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{couponError}</p>}
          </div>

          <div style={{ background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${b2w.border}` }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: b2w.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("priceDetails")}</h3>
            </div>
            <div style={{ padding: "4px 20px" }}>
              {[
                { label: `${t("priceItem")} (${totalItemsCount} ${totalItemsCount > 1 ? t("items") : t("item")})`, value: `₹${subtotal.toLocaleString("en-IN")}`, color: b2w.navy },
                { label: t("discount"), value: discount > 0 ? `-₹${discount.toLocaleString("en-IN")}` : "-", color: discount > 0 ? b2w.green : b2w.muted },
                ...(coinDiscount > 0 ? [{ label: "Coin Discount", value: `-₹${coinDiscount}`, color: b2w.teal }] : []),
                ...(couponDiscount > 0 ? [{
                  label: isBankRestrictedPending
                    ? `Coupon (${appliedCoupon?.code ?? ""}) — refunded if paid via ${appliedCoupon.bankCodes.join("/")}`
                    : `Coupon (${appliedCoupon?.code ?? ""})`,
                  value: isBankRestrictedPending ? `-₹${couponDiscount} (pending)` : `-₹${couponDiscount}`,
                  color: isBankRestrictedPending ? b2w.muted : "#1a211e",
                }] : []),
                { label: t("deliveryCharges"), value: deliveryFee === 0 ? t("free") : `₹${deliveryFee}`, color: deliveryFee === 0 ? b2w.green : b2w.navy },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${b2w.border}` }}>
                  <span style={{ fontSize: 14, color: b2w.body }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: b2w.navy }}>{t("totalAmount")}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: b2w.navy }}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            {discount > 0 && (
              <div style={{ background: "#ecfdf5", padding: "12px 20px", borderTop: `1px solid #a7f3d0` }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: b2w.green, textAlign: "center" }}>
                  {t("youSave")}{discount.toLocaleString("en-IN")}{t("youSaveOn")}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {[t("trustSecure"), t("trustReturns"), t("trustAuthentic")].map(text => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: b2w.muted, background: b2w.white, padding: "8px 14px", borderRadius: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CheckoutPage Wrapper ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", fontSize: 16 }}>Loading checkout securely...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}