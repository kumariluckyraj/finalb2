"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import SellerBadge from "@/components/SellerBadge";
import OtherSellers from "@/components/OtherSellers";
import LanguagePicker from "@/components/LanguagePicker";
import { readStringArray, toggleStringArrayItem } from "@/lib/clientStorage";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZE_CATEGORIES = ["fashion", "sports"];

const PRODUCT_STRINGS = {
  loadingProduct: "Loading product...",
  productNotFound: "Product not found",
  home: "Home",
  orderSuccessMsg: "Order placed successfully! Your order is on its way.",
  clickToZoom: "Click image to zoom",
  buyNow: "BUY NOW",
  addToCart: "ADD TO CART",
  check: "Check",
  ratingsCount: "Ratings",
  reviewsCount: "Reviews",
  ratingsAndReviews: "Ratings & Reviews",
  noReviews: "No reviews yet. Be the first to review after purchase!",
  verifiedPurchase: "Verified Purchase",
  offLabel: "off",
  youSave: "You save ₹",
  bankOfferPrefix:
    "Bank Offer: 10% off on HDFC Bank Cards | No Cost EMI from ₹",
  bankOfferSuffix: "/mo",
  selectSize: "Select Size",
  aboutItem: "About this item",
  deliveryLabel: "Delivery",
  enterPincode: "Enter delivery pincode",
  freeDeliveryMsg:
    "Free delivery on orders above ₹499 - Usually ships in 2-3 days",
  deliveryAvailablePrefix: "Delivery available to ",
  deliveryAvailableSuffix: " in 3-5 days",
  invalidPincode: "Invalid pincode",
  quantityLabel: "Quantity:",
  totalLabel: "Total:",
  productHighlights: "Product Highlights",
  hlBrand: "Brand",
  hlMaterial: "Material",
  hlWeight: "Weight",
  hlSize: "Size",
  hlDimensions: "Dimensions",
  hlFlavor: "Flavor / Variant",
  hlAuthor: "Author",
  verifyPhone: "Verify Phone Number",
  mobileNumber: "Mobile Number",
  enterMobile: "Enter 10-digit mobile number",
  sendOtp: "SEND OTP",
  otpSentTo: "OTP sent to ",
  enterOtp: "Enter OTP",
  enter6DigitOtp: "Enter 6-digit OTP",
  verifyAndContinue: "VERIFY & CONTINUE",
  changeNumber: "← Change number",
  addedToCartAlert: "Added to cart!",
  invalidOtpAlert: "Invalid OTP, try again.",
  checkPincodeHint: "Check your pincode to enable purchase",
 lowStockHint: "Only {n} left in stock",
  superCoinsTitle: "SuperCoins on this purchase",
  earnValidFor: "Coins earned are valid for",
  daysLabel: "days",
  maxRedeemLabel: "You can pay up to",
  ofThisOrder: "of this order using SuperCoins",
  yourCoinsLabel: "Your SuperCoins balance:",
  usableHereLabel: "Usable on this order:",
};

const CATEGORY_HIGHLIGHTS: Record<string, { labelKey: string; key: string }[]> =
  {
    fashion: [
      { labelKey: "hlBrand", key: "brand" },
      { labelKey: "hlMaterial", key: "material" },
      { labelKey: "hlWeight", key: "weight" },
      { labelKey: "hlSize", key: "size" },
    ],
    mobile: [
      { labelKey: "hlBrand", key: "brand" },
      { labelKey: "hlDimensions", key: "dimensions" },
      { labelKey: "hlWeight", key: "weight" },
    ],
    electronics: [
      { labelKey: "hlBrand", key: "brand" },
      { labelKey: "hlDimensions", key: "dimensions" },
      { labelKey: "hlWeight", key: "weight" },
    ],
    beauty: [
      { labelKey: "hlBrand", key: "brand" },
    ],
    furniture: [
      { labelKey: "hlMaterial", key: "material" },
      { labelKey: "hlDimensions", key: "dimensions" },
      { labelKey: "hlWeight", key: "weight" },
    ],
    sports: [
      { labelKey: "hlBrand", key: "brand" },
      { labelKey: "hlSize", key: "size" },
      { labelKey: "hlWeight", key: "weight" },
      { labelKey: "hlMaterial", key: "material" },
    ],
    food: [
      { labelKey: "hlFlavor", key: "flavor" },
      { labelKey: "hlWeight", key: "weight" },
    ],
    books: [
      { labelKey: "hlAuthor", key: "author" },
      { labelKey: "hlWeight", key: "weight" },
    ],
  };

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const { language, translate } = useLanguage();
const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);

  const [imgOpen, setImgOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Delivery / pincode gating state ───────────────────────────────────────
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [checkedPincode, setCheckedPincode] = useState("");
  const [checkingDelivery, setCheckingDelivery] = useState(false);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImagesUploading, setReviewImagesUploading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<{rating?: number; hasMedia?: boolean; sort?: string}>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // ── All translated strings live here (static UI + dynamic DB content) ─────
  const [trans, setTrans] = useState<Record<string, string>>(PRODUCT_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);

  // Ref so the translate effect can detect mid-flight language changes
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Keep a stable ref to translate() — context now returns a stable function
  // ([] deps) but we use a ref as belt-and-suspenders
  const translateRef = useRef(translate);
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string; isDefault: boolean; itemCount: number }[]>([]);
  const [productFolderIds, setProductFolderIds] = useState<string[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // Fetch which wishlist folders (if any) already contain this product.
  // This is the single source of truth for `isWishlisted` — no other effect
  // should independently overwrite it.
  useEffect(() => {
    if (!params.id) return;
    fetch("/api/me").then(r => {
      if (!r.ok) { setIsWishlisted(false); return; }
      return r.json();
    }).then(async (d) => {
      if (!d?.user) return;
      const res = await fetch(`/api/wishlist/product/${params.id}/folders`);
      const data = await res.json();
      setProductFolderIds(data.folderIds || []);
      setIsWishlisted((data.folderIds || []).length > 0);
    });
  }, [params.id]);

 

  useEffect(() => {
    if (!user) return;
    fetch("/api/wishlist/folders").then(r => r.json()).then(d => setFolders(d.folders || []));
  }, [user]);

  useEffect(() => {
    if (!product?._id) return;
    fetch(`/api/coupons/available?productId=${product._id}`)
      .then(r => r.json())
      .then(d => setAvailableCoupons(d.coupons || []))
      .catch(() => {});
  }, [product?._id]);

  // ── Data fetches ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/products/detail/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setSellerProfile(d.product?.sellerProfile ?? null);
        setStore(d.product?.store ?? null);
        setLoading(false);
        if (d.product) {
          try {
            const recent = JSON.parse(localStorage.getItem("recent_products") || "[]");
            const filtered = recent.filter((p: any) => p._id !== d.product._id);
            const newRecent = [{
              _id: d.product._id,
              name: d.product.name,
              price: d.product.price,
              actualPrice: d.product.actualPrice,
              image: d.product.image,
              discount: d.product.discount || 0
            }, ...filtered].slice(0, 10);
            localStorage.setItem("recent_products", JSON.stringify(newRecent));
            setRecentProducts(filtered); // Do not include current product in "recently viewed" section on this very page
          } catch(e) { console.error("Failed to update recent_products", e); }
          
          fetch(`/api/products?category=${d.product.category}&limit=5`)
            .then(res => res.json())
            .then(rd => {
              setRelatedProducts((rd.products || []).filter((p: any) => p._id !== d.product._id).slice(0, 4));
            });
        }
      });
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    setIsCompared(readStringArray("b2world_compare").includes(String(params.id)));
  }, [params.id]);

  const fetchReviews = useCallback(() => {
    if (!params.id) return;
    const p = new URLSearchParams();
    if (reviewFilter.rating) p.set("rating", String(reviewFilter.rating));
    if (reviewFilter.hasMedia) p.set("hasMedia", "true");
    if (reviewFilter.sort) p.set("sort", reviewFilter.sort);
    fetch(`/api/reviews/${params.id}?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAvgRating(d.avg || 0);
      });
  }, [params.id, reviewFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    fetch("/api/me")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then(d => {
        if (d.user) setUser(d.user);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) { setWalletBalance(null); return; }
    fetch("/api/wallet")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setWalletBalance(d.balance); })
      .catch(() => {});
  }, [user]);

  // ── THE SINGLE UNIFIED TRANSLATE EFFECT ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const calledForLang = language;

    if (calledForLang === "en") {
      setTrans(PRODUCT_STRINGS);
      return;
    }

    if (!product) return;

    setIsTranslating(true);

    const payload: Record<string, string> = {
      ...PRODUCT_STRINGS,
      name: product.name || "",
      desc: product.description || "",
      category: product.category || "",
    };

    const highlightFields =
      CATEGORY_HIGHLIGHTS[product.category?.toLowerCase()] ?? [];
    highlightFields.forEach(({ key }) => {
      if (product[key]) payload[`hl_${key}`] = product[key];
    });

    reviews.forEach((r, i) => {
      if (r.comment) payload[`review_${i}`] = r.comment;
    });

    const namespace = `product_${params.id}_r${reviews.length}`;

    translateRef
      .current(payload, namespace)
      .then((result) => {
        if (!mounted || languageRef.current !== calledForLang) return;
        setTrans({ ...PRODUCT_STRINGS, ...result });
      })
      .catch(() => {
        if (mounted) setTrans(PRODUCT_STRINGS);
      })
      .finally(() => {
        if (mounted) setIsTranslating(false);
      });

    return () => {
      mounted = false;
    };
  }, [language, product, reviews, params.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const t = (key: keyof typeof PRODUCT_STRINGS): string =>
    trans[key] ?? PRODUCT_STRINGS[key];

  const dt = (key: string, fallback: string): string => trans[key] || fallback;

  const stockValue = typeof product?.stock === "number" ? product.stock : null;
  const inStock = stockValue === null ? true : stockValue > 0;
  const maxQty = stockValue === null ? Infinity : Math.max(stockValue, 0);
  const requiresSize = SIZE_CATEGORIES.includes(
    (product?.category ?? "").toLowerCase(),
  );
  const variantLabel = requiresSize
    ? selectedSize || "Select a size"
    : product?.size || product?.brand || "Standard";

  // Clamp quantity whenever the stock ceiling changes (e.g. product data loads/refreshes)
  useEffect(() => {
    setQuantity((q) => {
      const ceiling = Number.isFinite(maxQty) ? Math.max(maxQty, 1) : q;
      return Math.min(Math.max(1, q), ceiling);
    });
  }, [maxQty]);

  // Invalidate a prior delivery check if the user edits the pincode field afterward
  useEffect(() => {
    if (pincode !== checkedPincode) {
      setDeliveryAvailable(null);
    }
  }, [pincode, checkedPincode]);

  // Purchase is only allowed once: product is in stock, quantity is within stock,
  // AND the seller has confirmed serviceability for the checked pincode.
  const canPurchase =
    inStock &&
    quantity >= 1 &&
    quantity <= (Number.isFinite(maxQty) ? maxQty : Infinity) &&
    deliveryAvailable === true;

  // Opens the "Save to List" picker (or sends a signed-out user to log in first).
  // This is what the heart button on the gallery calls.
  const toggleWishlist = () => {
    if (!product?._id) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setShowListPicker(true);
  };

  const toggleWishlistFolder = async (folderId: string) => {
    if (!product?._id) return;
    const isIn = productFolderIds.includes(folderId);
    try {
      if (isIn) {
        await fetch(`/api/wishlist/${product._id}?folderId=${folderId}`, { method: "DELETE" });
        setProductFolderIds(prev => {
          const next = prev.filter(id => id !== folderId);
          setIsWishlisted(next.length > 0);
          return next;
        });
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id, folderId }),
        });
        setProductFolderIds(prev => {
          const next = [...prev, folderId];
          setIsWishlisted(true);
          return next;
        });
      }
      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch {}
  };

  const createListAndAdd = async () => {
    if (!newListName.trim() || !product?._id) return;
    setCreatingList(true);
    try {
      const res = await fetch("/api/wishlist/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      const { folder } = await res.json();
      setFolders(prev => [...prev, folder]);
      setNewListName("");
      await toggleWishlistFolder(folder.id);
    } finally {
      setCreatingList(false);
    }
  };

  const toggleCompare = () => {
    if (!product?._id) return;
    const next = toggleStringArrayItem(
      "b2world_compare",
      String(product._id),
      4,
    );
    setIsCompared(next.includes(String(product._id)));
  };

  const allProductImages = product?.media?.length > 0 ? product.media.map((m: any) => m.url) : (product?.image ? [product.image] : []);

  const checkDelivery = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryMsg(t("invalidPincode"));
      setDeliveryAvailable(null);
      return;
    }
    setCheckingDelivery(true);
    try {
      const res = await fetch(`/api/products/delivery/${product._id}?pincode=${pincode}`);
      const data = await res.json();
      setDeliveryAvailable(!!data.available);
      setCheckedPincode(pincode);
      setDeliveryMsg(
        data.available
          ? `${t("deliveryAvailablePrefix")}${pincode}${t("deliveryAvailableSuffix")}`
          : `Delivery not available to ${pincode}`
      );
    } catch {
      setDeliveryAvailable(null);
      setDeliveryMsg("Could not check delivery. Try again.");
    } finally {
      setCheckingDelivery(false);
    }
  };

  const addToCart = async (size?: string) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          quantity,
          size: size || undefined,
          pincode: checkedPincode || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Cart add failed (${res.status})`);
      }
      setToast(t("addedToCartAlert"));
      window.dispatchEvent(new CustomEvent("cart-updated"));
      setTimeout(() => setToast(null), 3000);
      return true;
    } catch (err: any) {
      setToast(err?.message || "Failed to add to cart");
      setTimeout(() => setToast(null), 3000);
      return false;
    }
  };

  const goToCheckout = () => {
    const p = new URLSearchParams({
      productId: product._id,
      quantity: quantity.toString(),
    });
    if (hasSizeSelector && selectedSize) p.set("size", selectedSize);
    if (checkedPincode) p.set("pincode", checkedPincode);
    router.push(`/checkout?${p.toString()}`);
  };

  const uploadReviewImages = async (files: FileList) => {
    setReviewImagesUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "reviews");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json();
        if (d.url) urls.push(d.url);
      } catch {}
    }
    setReviewImages(prev => [...prev, ...urls]);
    setReviewImagesUploading(false);
  };

  const submitReview = async () => {
    if (!user) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/reviews/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingInput, comment: commentInput, images: reviewImages })
      });
      if (res.ok) {
        const d = await res.json();
        setReviews([d.review, ...reviews]);
        setCommentInput("");
        setReviewImages([]);
        setToast("Review submitted successfully");
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast("Failed to submit review");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast("Failed to submit review");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#e0e0e0] border-t-[#1a211e] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#606562] font-medium">{t("loadingProduct")}</p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="text-center p-16 text-[#1a211e]">
        <p className="text-[20px] font-semibold">{t("productNotFound")}</p>
      </div>
    );

 const discountPercent = product.actualPrice
    ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100)
    : product.discount;

  // Vendor-controlled coin settings, with platform-wide fallbacks if the vendor hasn't set them.
  const coinValidityDays = product.coinValidityDays ?? 90;
  const maxCoinRedemptionPercent = product.maxCoinRedemptionPercent ?? 20;
  const maxCoinsForOrder = Math.floor((product.price * quantity * maxCoinRedemptionPercent) / 100);
  const usableCoins = walletBalance !== null ? Math.min(walletBalance, maxCoinsForOrder) : null;
  const hasSizeSelector = requiresSize;
  const highlightFields = CATEGORY_HIGHLIGHTS[product.category?.toLowerCase()] ?? [];
  const highlightRows = highlightFields
    .map(({ labelKey, key }) => ({
      label: t(labelKey as keyof typeof PRODUCT_STRINGS),
      value: dt(`hl_${key}`, product[key]),
      rawValue: product[key],
    }))
    .filter(({ rawValue }) => rawValue);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-white text-[#1a211e] ${isTranslating ? 'opacity-85' : 'opacity-100'} transition-opacity duration-200`}>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[1000] bg-[#1a211e] text-white px-6 py-3 rounded-[4px] text-[14px] font-bold tracking-[0.057em] uppercase shadow-lg flex items-center gap-2 animate-[fadeIn_0.25s_ease]">
          {toast}
          <button onClick={() => setToast(null)} className="bg-transparent border-none text-[#cccfcd] cursor-pointer text-[16px] pl-2 hover:text-white">✕</button>
        </div>
      )}

      {orderSuccess && (
        <div className="bg-[#1a211e] text-white px-6 py-3 font-bold text-center text-[15px] uppercase tracking-[0.057em]">
          {t("orderSuccessMsg")}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-5 py-4 text-[12px] font-bold uppercase tracking-[0.057em] text-[#606562] border-b border-[#e0e0e0]">
        <span onClick={() => router.push("/")} className="cursor-pointer hover:text-[#1a211e] transition-colors">{t("home")}</span>
        <span className="mx-2 text-[#cccfcd]">/</span>
        <span onClick={() => router.push(`/products/${product.category}`)} className="cursor-pointer hover:text-[#1a211e] transition-colors">{dt("category", product.category)}</span>
        <span className="mx-2 text-[#cccfcd]">/</span>
        <span className="text-[#1a211e]">{dt("name", product.name)}</span>
      </div>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr] gap-0 md:gap-12 lg:gap-20">
        
        {/* LEFT: Image Gallery */}
        <div className="bg-[#eef1f0] md:bg-transparent">
          <div className="sticky top-[80px] p-0 md:p-6 lg:p-10">
            <div 
              onClick={() => setImgOpen(true)}
              className="w-full aspect-square bg-[#eef1f0] md:rounded-[8px] flex items-center justify-center cursor-zoom-in overflow-hidden relative group"
            >
              <Image 
                src={allProductImages[selectedImageIndex] || product.image} 
                alt={product.name} 
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "contain", padding: "2rem" }}
                className="group-hover:scale-105 transition-transform duration-500"
              />
              {/* Badges / Floating Actions */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercent > 0 && (
                  <span className="bg-[#1a211e] text-white text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.057em]">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1a211e] hover:bg-[#eef1f0] transition-colors border border-[#e0e0e0]">
                  {isWishlisted ? "♥" : "♡"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleCompare(); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1a211e] text-[12px] font-bold hover:bg-[#eef1f0] transition-colors border border-[#e0e0e0]">
                  VS
                </button>
              </div>
            </div>

            {/* Thumbnail strip */}
            {allProductImages.length > 1 && (
              <div className="flex gap-4 mt-6 overflow-x-auto px-4 md:px-0 scrollbar-hide pb-2">
                {allProductImages.map((img: string, i: number) => (
                  <div key={i} onClick={() => setSelectedImageIndex(i)} className={`w-20 h-20 shrink-0 rounded-[4px] bg-[#eef1f0] overflow-hidden p-2 cursor-pointer border ${i === selectedImageIndex ? 'border-[#1a211e]' : 'border-transparent hover:border-[#cccfcd]'}`}>
                    <div className="relative w-full h-full">
                      <Image src={img} fill sizes="80px" style={{ objectFit: "contain" }} alt="thumbnail" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Product Details */}
        <div className="px-5 py-8 md:py-16">
          <div className="mb-8">
            <h1 className="text-[32px] md:text-[40px] font-serif leading-[1.1] text-[#1a211e] mb-4 tracking-[-0.01em]">
              {dt("name", product.name)}
            </h1>
            <div className="flex items-center gap-4 mb-6 text-[14px]">
              <div className="flex items-center gap-1 font-bold text-[#1a211e]">
                <span>{avgRating > 0 ? avgRating.toFixed(1) : "4.0"}</span>
                <span className="text-[12px]">★</span>
              </div>
              <div className="w-px h-4 bg-[#e0e0e0]" />
              <span className="text-[#606562]">
                {reviews.length > 0 ? `${reviews.length} ${t("ratingsCount")}` : `128 ${t("ratingsCount")}`}
              </span>
            </div>
            
            <div className="flex items-baseline gap-4 flex-wrap mb-2">
              <span className="text-[24px] font-semibold text-[#1a211e]">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {product.actualPrice && (
                <span className="text-[16px] text-[#606562] line-through">
                  ₹{product.actualPrice?.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <p className="text-[14px] text-[#606562] font-medium">
                {t("youSave")} ₹{(product.actualPrice - product.price)?.toLocaleString("en-IN")}
              </p>
            )}

            {availableCoupons.length > 0 && (
              <div className="mb-8 border-t border-[#e0e0e0] pt-6">
                 <span className="block text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] mb-3">
                {t("superCoinsTitle")}
              </span>
              <p className="text-[13px] text-[#606562] mb-1">
                {t("maxRedeemLabel")} <strong className="text-[#1a211e]">{maxCoinRedemptionPercent}%</strong> (₹{maxCoinsForOrder.toLocaleString("en-IN")}) {t("ofThisOrder")}
              </p>
              <p className="text-[13px] text-[#606562] mb-1">
                {t("earnValidFor")} <strong className="text-[#1a211e]">{coinValidityDays}</strong> {t("daysLabel")}
              </p>
              {walletBalance !== null && (
                <p className="text-[13px] text-[#606562]">
                  {t("yourCoinsLabel")} <strong className="text-[#1a211e]">{walletBalance}</strong>
                  {" · "}
                  {t("usableHereLabel")} <strong className="text-[#1a211e]">{usableCoins}</strong>
                </p>
              )}
                <span className="block text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] mb-3">
                  Available Offers
                </span>
                <div className="flex flex-col gap-2">
                  {availableCoupons.map((c) => (
                    <div key={c.id} className="flex items-start gap-2 text-[13px] text-[#1a211e]">
                      <span className="font-bold">{c.code}</span>
                      <span className="text-[#606562]">
                        — {c.discountType === "percentage" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                        {c.bankCodes?.length ? ` on ${c.bankCodes.join("/")} cards` : ""}
                        {c.productId ? " (this product)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.057em]">
              <span className={inStock ? "text-[#1a211e]" : "text-[#cc2e39]"}>
                {stockValue === null ? "Available" : inStock ? "In Stock" : "Out of Stock"}
              </span>
              <span className="text-[#cccfcd]">•</span>
              <span className="text-[#606562]">Variant: {variantLabel}</span>
            </div>
          </div>

          {/* Size Selector */}
          {hasSizeSelector && (
            <div className="mb-10 border-t border-[#e0e0e0] pt-8">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e]">{t("selectSize")}</span>
                <span className="text-[14px] text-[#606562] underline cursor-pointer hover:text-[#1a211e]">Size Guide</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-6 py-3 text-[14px] font-bold uppercase tracking-[0.057em] rounded-[4px] border transition-colors ${
                      selectedSize === s 
                        ? 'bg-[#1a211e] text-white border-[#1a211e]' 
                        : 'bg-transparent text-[#1a211e] border-[#cccfcd] hover:border-[#1a211e]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showListPicker && (
            <div onClick={() => setShowListPicker(false)} className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[8px] p-8 w-full max-w-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] font-bold uppercase tracking-[0.057em] text-[#1a211e]">Save to List</h3>
                  <button onClick={() => setShowListPicker(false)} className="text-[#606562] hover:text-[#1a211e] text-[24px]">✕</button>
                </div>

                <div className="flex flex-col gap-2 mb-6 max-h-[280px] overflow-y-auto">
                  {folders.map(f => {
                    const checked = productFolderIds.includes(f.id);
                    return (
                      <label key={f.id} className="flex items-center justify-between gap-3 px-3 py-2.5 border border-[#e0e0e0] rounded-[4px] cursor-pointer hover:border-[#1a211e] transition-colors">
                        <span className="flex items-center gap-2 text-[14px] text-[#1a211e]">
                          {f.name}
                          <span className="text-[12px] text-[#606562]">({f.itemCount})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWishlistFolder(f.id)}
                          className="w-4 h-4 accent-[#1a211e] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name"
                    className="flex-1 h-[44px] px-3 border border-[#cccfcd] rounded-[4px] text-[14px] outline-none focus:border-[#1a211e]"
                  />
                  <button
                    onClick={createListAndAdd}
                    disabled={!newListName.trim() || creatingList}
                    className="h-[44px] px-4 bg-[#1a211e] text-white text-[13px] font-bold uppercase tracking-[0.05em] rounded-[4px] disabled:opacity-50"
                  >
                    {creatingList ? "..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="mb-12 border-t border-[#e0e0e0] pt-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#cccfcd] rounded-[4px] h-[48px] w-[140px]">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-full flex items-center justify-center text-[#1a211e] hover:bg-[#eef1f0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-bold text-[#1a211e]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(Number.isFinite(maxQty) ? maxQty : q + 1, q + 1))}
                    disabled={Number.isFinite(maxQty) && quantity >= maxQty}
                    className="w-12 h-full flex items-center justify-center text-[#1a211e] hover:bg-[#eef1f0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="text-[14px] text-[#606562]">
                  {t("totalLabel")} <strong className="text-[#1a211e] ml-1">₹{(product.price * quantity)?.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {stockValue !== null && stockValue > 0 && quantity >= stockValue && (
                <p className="text-[12px] text-[#cc2e39]">
                  Only {stockValue} unit(s) left in stock
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() =>
                    hasSizeSelector && !selectedSize
                      ? setShowSizeModal(true)
                      : addToCart(hasSizeSelector ? selectedSize : undefined)
                  }
                  disabled={!canPurchase}
                  className={`flex-1 h-[56px] flex items-center justify-center text-[16px] font-bold uppercase tracking-[0.057em] rounded-[4px] border border-[#1a211e] ${!canPurchase ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f8f9f9] cursor-pointer'} bg-transparent text-[#1a211e] transition-colors`}
                >
                  {t("addToCart")}
                </button>
                <button
                  onClick={() => goToCheckout()}
                  disabled={!canPurchase || (hasSizeSelector && !selectedSize)}
                  className={`flex-1 h-[56px] flex items-center justify-center text-[16px] font-bold uppercase tracking-[0.057em] rounded-[4px] ${(!canPurchase || (hasSizeSelector && !selectedSize)) ? 'opacity-50 cursor-not-allowed bg-[#606562]' : 'hover:bg-[#000000] cursor-pointer bg-[#1a211e]'} text-white transition-colors`}
                >
                  {inStock ? t("buyNow") : "Out of stock"}
                </button>
              </div>

              {inStock && deliveryAvailable === null && (
                <p className="text-[12px] text-[#606562]">{t("checkPincodeHint")}</p>
              )}
              {inStock && deliveryAvailable === false && (
                <p className="text-[12px] text-[#cc2e39]">Not deliverable to this pincode — try another.</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="mb-10">
            <span className="block text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] mb-4">{t("deliveryLabel")}</span>
            <div className="flex gap-2 mb-2">
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("enterPincode")}
                maxLength={6}
                className="flex-1 max-w-[240px] h-[48px] px-4 bg-transparent border border-[#cccfcd] rounded-[4px] text-[16px] outline-none focus:border-[#1a211e] transition-colors placeholder:text-[#606562]"
              />
              <button
                onClick={checkDelivery}
                disabled={checkingDelivery}
                className="h-[48px] px-6 border border-[#cccfcd] rounded-[4px] text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] hover:bg-[#eef1f0] transition-colors disabled:opacity-50"
              >
                {checkingDelivery ? "..." : t("check")}
              </button>
            </div>
            <p className="text-[14px] text-[#606562] mt-2">
              {deliveryMsg || t("freeDeliveryMsg")}
            </p>
          </div>

          {/* Highlights */}
          {highlightRows.length > 0 && (
            <div className="mb-12 border-t border-[#e0e0e0] pt-8">
              <span className="block text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] mb-6">{t("productHighlights")}</span>
              <div className="grid grid-cols-1 gap-y-4">
                {highlightRows.map(({ label, value }) => (
                  <div key={label} className="flex border-b border-[#e0e0e0] pb-4">
                    <span className="w-1/3 text-[14px] text-[#606562]">{label}</span>
                    <span className="w-2/3 text-[14px] text-[#1a211e] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-12 border-t border-[#e0e0e0] pt-8">
            <span className="block text-[14px] font-bold uppercase tracking-[0.057em] text-[#1a211e] mb-6">{t("aboutItem")}</span>
            <p className="text-[16px] text-[#1a211e] leading-[1.6] whitespace-pre-wrap">
              {dt("desc", product.description)}
            </p>
          </div>
          
          {/* Seller badge */}
          {sellerProfile && (
            <div className="mb-12 border-t border-[#e0e0e0] pt-8">
              <SellerBadge sellerProfile={sellerProfile} shipsFrom={product?.shipsFrom} />
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section (Full Bleed Light/Dark alternation) */}
      <div className="bg-[#1a211e] text-white py-20 px-5 mt-10">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-6">
            <div className="flex-1">
              <h2 className="text-[32px] md:text-[48px] font-serif mb-4">{t("ratingsAndReviews")}</h2>

              {/* Filter / Sort Controls */}
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                {[0, 1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setReviewFilter(prev => ({ ...prev, rating: prev.rating === r ? undefined : r || undefined }))}
                    className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-[0.05em] transition-colors cursor-pointer ${
                      (reviewFilter.rating ?? 0) === r
                        ? 'bg-white text-[#1a211e]'
                        : 'bg-white/10 text-[#cccfcd] hover:bg-white/20'
                    }`}
                  >
                    {r === 0 ? 'All' : `${r} ★`}
                  </button>
                ))}
                <button
                  onClick={() => setReviewFilter(prev => ({ ...prev, hasMedia: !prev.hasMedia }))}
                  className={`px-3 py-1.5 rounded-[4px] font-bold uppercase tracking-[0.05em] transition-colors cursor-pointer ${
                    reviewFilter.hasMedia
                      ? 'bg-white text-[#1a211e]'
                      : 'bg-white/10 text-[#cccfcd] hover:bg-white/20'
                  }`}
                >
                  With Media
                </button>
                <select
                  value={reviewFilter.sort ?? "recent"}
                  onChange={e => setReviewFilter(prev => ({ ...prev, sort: e.target.value || undefined }))}
                  className="px-3 py-1.5 rounded-[4px] text-[12px] font-bold uppercase tracking-[0.05em] bg-white/10 text-[#cccfcd] border-none outline-none cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
            </div>
            
            {user ? (
              <div className="bg-white/10 p-6 rounded-[8px] flex-1 max-w-[400px]">
                <h3 className="text-[16px] font-bold uppercase tracking-[0.057em] mb-4 text-white">Write a Review</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRatingInput(star)}
                      className={`text-[24px] bg-transparent border-none cursor-pointer ${ratingInput >= star ? 'text-white' : 'text-[#606562]'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full h-[80px] bg-transparent border border-[#606562] rounded-[4px] p-3 text-[14px] text-white outline-none focus:border-white transition-colors mb-3 resize-none"
                />

                {/* Image upload for reviews */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] border border-[#606562] text-[#cccfcd] rounded-[4px] cursor-pointer hover:border-white hover:text-white transition-colors">
                    {reviewImagesUploading ? "Uploading..." : "Add Photos"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && uploadReviewImages(e.target.files)} />
                  </label>
                  {reviewImages.map((url, i) => (
                    <div key={url} className="relative w-10 h-10 rounded-[4px] overflow-hidden bg-white/10">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setReviewImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-[#cc2e39] text-white text-[10px] rounded-full flex items-center justify-center border-none cursor-pointer"
                      >×</button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={submitReview}
                  disabled={isSubmittingReview || !commentInput.trim()}
                  className="w-full h-[40px] bg-white text-[#1a211e] font-bold uppercase tracking-[0.057em] text-[12px] rounded-[4px] disabled:opacity-50 cursor-pointer border-none"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <div className="bg-white/10 p-6 rounded-[8px] flex-1 max-w-[400px] flex items-center justify-center flex-col text-center">
                <p className="text-[14px] text-[#cccfcd] mb-4">Log in to share your thoughts and rate this product.</p>
                <button 
                  onClick={() => router.push("/login")}
                  className="px-6 py-2 border border-white text-white font-bold uppercase tracking-[0.057em] text-[12px] rounded-[4px] hover:bg-white hover:text-[#1a211e] transition-colors cursor-pointer bg-transparent"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
          
          {reviews.length === 0 ? (
            <p className="text-[16px] text-[#cccfcd]">{t("noReviews")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
              {reviews.map((r, i) => (
                <div key={r._id || i} className="border-t border-[#363537] pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-white text-[#1a211e] text-[12px] font-bold px-2 py-1 rounded-[4px]">{r.rating} ★</span>
                    <strong className="text-[16px]">{r.userName}</strong>
                    {r.verified && (
                      <span className="text-[11px] border border-[#606562] text-[#cccfcd] px-2 py-1 rounded-[4px] uppercase tracking-[0.05em]">{t("verifiedPurchase")}</span>
                    )}
                  </div>

                  {/* Review images */}
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {r.images.map((img: string) => (
                        <div key={img} className="w-20 h-20 shrink-0 rounded-[4px] overflow-hidden bg-white/10">
                          <img src={img} alt="" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(img, '_blank')} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review video */}
                  {r.video && (
                    <div className="mb-3">
                      <video src={r.video} controls className="w-full max-h-40 rounded-[4px]" />
                    </div>
                  )}

                  <p className="text-[16px] text-[#eef1f0] leading-[1.6]">
                    {r.comment || dt(`review_${i}`, r.comment)}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-[11px] text-[#606562]">
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.helpfulCount > 0 && <span>{r.helpfulCount} found helpful</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <OtherSellers productId={params.id as string} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="py-20 px-5 max-w-[1440px] mx-auto border-b border-[#e0e0e0]">
          <h2 className="text-[32px] font-serif text-[#1a211e] mb-10">Explore Related</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div key={p._id} onClick={() => router.push(`/product/${p._id}`)} className="group cursor-pointer">
                <div className="relative aspect-[4/5] bg-[#eef1f0] rounded-[8px] overflow-hidden mb-4 p-6 flex items-center justify-center">
                  {p.image && <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "contain", padding: "1.5rem" }} className="group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <h3 className="text-[16px] text-[#1a211e] font-medium mb-1 truncate">{p.name}</h3>
                <span className="text-[16px] text-[#606562]">₹{p.price?.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <div className="py-20 px-5 max-w-[1440px] mx-auto">
          <h2 className="text-[32px] font-serif text-[#1a211e] mb-10">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentProducts.map((p) => (
              <div key={p._id} onClick={() => router.push(`/product/${p._id}`)} className="group cursor-pointer">
                <div className="relative aspect-[4/5] bg-[#eef1f0] rounded-[8px] overflow-hidden mb-4 p-6 flex items-center justify-center">
                  {p.image && <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "contain", padding: "1.5rem" }} className="group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <h3 className="text-[16px] text-[#1a211e] font-medium mb-1 truncate">{p.name}</h3>
                <span className="text-[16px] text-[#606562]">₹{p.price?.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e0e0e0] p-4 flex gap-3 z-[100]">
        <button
          onClick={() =>
            hasSizeSelector && !selectedSize
              ? setShowSizeModal(true)
              : addToCart(hasSizeSelector ? selectedSize : undefined)
          }
          disabled={!canPurchase}
          className="flex-1 h-[48px] bg-transparent border border-[#1a211e] text-[#1a211e] text-[14px] font-bold uppercase tracking-[0.057em] rounded-[4px] disabled:opacity-50"
        >
          {t("addToCart")}
        </button>
        <button
          onClick={() => goToCheckout()}
          disabled={!canPurchase || (hasSizeSelector && !selectedSize)}
          className="flex-1 h-[48px] bg-[#1a211e] text-white text-[14px] font-bold uppercase tracking-[0.057em] rounded-[4px] disabled:opacity-50"
        >
          {inStock ? t("buyNow") : "Out of stock"}
        </button>
      </div>

      {/* Image zoom */}
      {imgOpen && (
        <div onClick={() => setImgOpen(false)} className="fixed inset-0 bg-[#0c0c0c] z-[1000] flex items-center justify-center cursor-zoom-out p-10">
          <div className="relative w-full h-full max-w-6xl">
            <Image src={product.image} alt={product.name} fill sizes="100vw" style={{ objectFit: "contain" }} />
          </div>
          <button onClick={() => setImgOpen(false)} className="absolute top-6 right-6 text-white text-[24px] font-bold z-10">✕</button>
        </div>
      )}

      {/* Size modal */}
      {showSizeModal && hasSizeSelector && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] p-8 w-full max-w-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold uppercase tracking-[0.057em] text-[#1a211e]">{t("selectSize")}</h3>
              <button onClick={() => setShowSizeModal(false)} className="text-[#606562] hover:text-[#1a211e] text-[24px]">✕</button>
            </div>
            <div className="flex flex-wrap gap-3 mb-8">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-6 py-3 text-[14px] font-bold uppercase tracking-[0.057em] rounded-[4px] border transition-colors ${
                    selectedSize === s ? 'bg-[#1a211e] text-white border-[#1a211e]' : 'bg-transparent text-[#1a211e] border-[#cccfcd] hover:border-[#1a211e]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              disabled={!selectedSize || !canPurchase}
              onClick={async () => {
                const ok = await addToCart(selectedSize);
                if (ok) setShowSizeModal(false);
              }}
              className={`w-full h-[56px] flex items-center justify-center text-[16px] font-bold uppercase tracking-[0.057em] rounded-[4px] ${(selectedSize && canPurchase) ? 'bg-[#1a211e] hover:bg-[#000000] cursor-pointer' : 'bg-[#606562] opacity-50 cursor-not-allowed'} text-white transition-colors`}
            >
              {t("addToCart")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}