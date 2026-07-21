"use client";

import { useState, useEffect, useRef } from "react";

interface PartnerOffer {
  id: string;
  brand: string;
  category: string;
  description: string;
  coinsRequired: number;
  discountValue: string;
  iconUrl: string | null;
  tag: string | null;
}

interface Redemption {
  id: string;
  offerId: string;
  couponCode: string;
  coinsSpent: number;
  status: string;
  brand: string;
  category: string;
  description: string;
  createdAt: string;
  usedAt: string | null;
}

interface Transaction {
  id: string;
  label: string;
  coins: number;
  date: string;
  type: "credit" | "debit";
}

const FAQS = [
  { q: "How many SuperCoins do I earn per purchase?",
    a: "B2World Plus Silver members earn 1% (up to 25 coins) and Gold members earn 2% (up to 25 coins) on every transaction." },
  { q: "Do SuperCoins expire?",
    a: "Yes. SuperCoins expire 3 months from the date they are credited to your account." },
  { q: "Can I transfer SuperCoins to another account?",
    a: "No. SuperCoins are non-transferable and are tied to your B2World account only." },
  { q: "Where can I redeem SuperCoins?",
    a: "You can redeem them on B2World purchases, at 300+ partner platforms like Ola, OYO, and 1mg, and for OTT & music subscriptions." },
];

const CoinSVG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="15" fill="#f6a623" stroke="#e09000" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="11" fill="#f0c040" />
    <text x="16" y="20.5" textAnchor="middle" fontSize="9" fontWeight="800"
      fontFamily="Arial, sans-serif" fill="#a05c00" letterSpacing="0.5">SC</text>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26a541" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6161" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2874f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function AnimatedCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const t0 = useRef<number | null>(null);
  useEffect(() => {
    t0.current = null;
    const step = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{count.toLocaleString("en-IN")}</>;
}

export default function SuperCoinPage() {
  const [activeTab, setActiveTab] = useState<"offers" | "redemptions" | "history">("offers");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [pendingCoins, setPendingCoins] = useState(0);
  const [memberTier, setMemberTier] = useState<string>("Silver");
  const [earnRate, setEarnRate] = useState(1);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [offersError, setOffersError] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemResult, setRedeemResult] = useState<{ couponCode: string; coinsSpent: number } | null>(null);
  const [redeemError, setRedeemError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [walletRes, txRes, offersRes, redemptionsRes] = await Promise.all([
          fetch("/api/coins/wallet"),
          fetch("/api/coins/transactions?limit=50"),
          fetch("/api/coins/partner-offers"),
          fetch("/api/coins/partner-offers/my-redemptions"),
        ]);
        const walletData = await walletRes.json();
        const txData = await txRes.json();
        const offersData = await offersRes.json();
        const redemptionsData = await redemptionsRes.json();

        if (walletData.wallet) {
          setBalance(walletData.wallet.balance ?? 0);
          setPendingCoins(walletData.wallet.pendingCoins ?? 0);
          setLifetimeEarned(walletData.wallet.lifetimeEarned ?? 0);
          setLifetimeSpent(walletData.wallet.lifetimeSpent ?? 0);
        }
        if (walletData.currentTier) {
          setMemberTier(walletData.currentTier.name ?? "Silver");
          setEarnRate(walletData.currentTier.earnRate ?? 1);
        }
        if (txData.transactions) {
          setTransactions(txData.transactions.map((tx: any) => ({
            id: tx.id,
            label: tx.description ?? tx.type,
            coins: Math.abs(tx.amount),
            date: new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            type: (tx.amount >= 0 ? "credit" : "debit") as "credit" | "debit",
          })));
        }
        if (offersData.offers) {
          setOffers(offersData.offers);
          if (offersData.offers.length === 0) setOffersError(true);
        } else {
          setOffersError(true);
        }
        if (redemptionsData.redemptions) {
          setRedemptions(redemptionsData.redemptions);
        }
      } catch (e) {
        console.error("Failed to load supercoins data", e);
        setOffersError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRedeem = async (offerId: string) => {
    setRedeeming(offerId);
    setRedeemError("");
    setRedeemResult(null);
    try {
      const res = await fetch(`/api/coins/partner-offers/${offerId}/redeem`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRedeemError(data.error ?? "Failed to redeem");
        return;
      }
      setRedeemResult({ couponCode: data.couponCode, coinsSpent: data.coinsSpent });
      setBalance(prev => prev - data.coinsSpent);
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, coinsRequired: o.coinsRequired } : o));
      const newRedemption: Redemption = {
        id: "", offerId, couponCode: data.couponCode, coinsSpent: data.coinsSpent,
        status: "active", brand: offers.find(o => o.id === offerId)?.brand ?? "",
        category: offers.find(o => o.id === offerId)?.category ?? "",
        description: offers.find(o => o.id === offerId)?.description ?? "",
        createdAt: new Date().toISOString(), usedAt: null,
      };
      setRedemptions(prev => [newRedemption, ...prev]);
    } catch {
      setRedeemError("Server error");
    } finally {
      setRedeeming(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        .sc-page { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; background: #f1f3f6; min-height: 100vh; color: #212121; }
        .sc-breadcrumb { font-size: 12px; color: #878787; padding: 10px 0 6px; }
        .sc-breadcrumb a { color: #2874f0; text-decoration: none; }
        .sc-breadcrumb a:hover { text-decoration: underline; }
        .sc-wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px 48px; }
        .sc-grid { display: grid; grid-template-columns: 260px 1fr; gap: 16px; align-items: start; }
        .sc-card { background: #fff; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .sc-balance-hero { padding: 24px 20px; border-bottom: 1px solid #f0f0f0; }
        .sc-balance-label { font-size: 11px; color: #878787; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
        .sc-balance-num { font-size: 48px; font-weight: 700; line-height: 1; color: #212121; letter-spacing: -1px; display: flex; align-items: center; gap: 10px; }
        .sc-balance-sc { font-size: 15px; color: #878787; font-weight: 400; margin-top: 6px; }
        .sc-tier-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 2px; font-size: 12px; font-weight: 700; margin-top: 14px; }
        .sc-tier-gold { background: #fff8e1; color: #c5820a; border: 1px solid #f6c840; }
        .sc-tier-silver { background: #f5f5f5; color: #616161; border: 1px solid #bdbdbd; }
        .sc-stat-row { display: flex; flex-direction: column; gap: 0; }
        .sc-stat-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; }
        .sc-stat-item:last-child { border-bottom: none; }
        .sc-stat-lbl { font-size: 13px; color: #616161; }
        .sc-stat-val { font-size: 13px; font-weight: 600; }
        .sc-tabs { display: flex; border-bottom: 1px solid #f0f0f0; }
        .sc-tab { padding: 14px 20px; font-size: 14px; font-weight: 500; color: #878787; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .sc-tab:hover { color: #212121; }
        .sc-tab.active { color: #2874f0; border-bottom-color: #2874f0; font-weight: 700; }
        .sc-section-hd { font-size: 13px; font-weight: 700; color: #212121; text-transform: uppercase; letter-spacing: 0.5px; padding: 16px 20px 0; }
        .sc-offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0; border-top: 1px solid #f0f0f0; }
        .sc-offer-card { padding: 16px; border-right: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; position: relative; transition: box-shadow 0.15s; }
        .sc-offer-card:hover { box-shadow: inset 0 0 0 1px #2874f0; z-index: 1; }
        .sc-offer-brand { font-size: 15px; font-weight: 700; color: #212121; margin-bottom: 4px; }
        .sc-offer-cat { font-size: 11px; color: #878787; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .sc-offer-desc { font-size: 12px; color: #616161; margin-bottom: 14px; line-height: 1.5; }
        .sc-offer-footer { display: flex; align-items: center; justify-content: space-between; }
        .sc-offer-coins { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 700; color: #212121; }
        .sc-offer-tag { position: absolute; top: 12px; right: 12px; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
        .sc-tag-hot { background: #ff6161; color: #fff; }
        .sc-tag-new { background: #26a541; color: #fff; }
        .sc-tag-popular { background: #2874f0; color: #fff; }
        .sc-btn-redeem { font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 2px; border: none; cursor: pointer; transition: all 0.15s; }
        .sc-btn-redeem.can { background: #2874f0; color: #fff; }
        .sc-btn-redeem.can:hover { background: #1a5fd6; }
        .sc-btn-redeem.cant { background: #f0f0f0; color: #9e9e9e; cursor: not-allowed; }
        .sc-btn-redeem.loading { background: #93c5fd; color: #fff; cursor: wait; }
        .sc-tx-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; }
        .sc-tx-row:last-child { border-bottom: none; }
        .sc-tx-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; }
        .sc-tx-credit-bg { background: #e8f5e9; }
        .sc-tx-debit-bg { background: #fce4e4; }
        .sc-tx-lbl { font-size: 13px; font-weight: 500; color: #212121; }
        .sc-tx-date { font-size: 12px; color: #878787; margin-top: 2px; }
        .sc-tx-amt { font-size: 14px; font-weight: 700; }
        .sc-credit { color: #26a541; }
        .sc-debit { color: #ff6161; }
        .sc-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .sc-modal { background: #fff; border-radius: 8px; padding: 32px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .sc-coupon-code { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2874f0; background: #e8f0fe; padding: 12px 20px; border-radius: 6px; margin: 16px 0; font-family: monospace; }
        .sc-notice { background: #fff8e1; border-left: 3px solid #f6c840; padding: 10px 14px; font-size: 12px; color: #795500; margin: 0 20px 16px; border-radius: 0 2px 2px 0; }
        .sc-empty { padding: 40px; text-align: center; color: #878787; font-size: 14px; }
        .sc-faq-item { border-bottom: 1px solid #f0f0f0; }
        .sc-faq-q { width: 100%; background: none; border: none; padding: 16px 20px; text-align: left; font-size: 14px; font-weight: 500; color: #212121; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .sc-faq-q:hover { background: #fafafa; }
        .sc-faq-a { padding: 0 20px 16px; font-size: 13px; color: #616161; line-height: 1.6; }
        @media (max-width: 768px) {
          .sc-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sc-page">
        <div className="sc-wrap">
          <div className="sc-breadcrumb">
            <a href="/">Home</a> &rsaquo; <span>SuperCoin Zone</span>
          </div>

          <div className="sc-grid">
            <aside>
              <div className="sc-card" style={{ marginBottom: "16px" }}>
                <div className="sc-balance-hero">
                  <div className="sc-balance-label">SuperCoin Balance</div>
                  <div className="sc-balance-num">
                    <CoinSVG size={38} />
                    {loading ? <span style={{ fontSize: 24, color: "#878787" }}>...</span> : <AnimatedCounter target={balance} />}
                  </div>
                  <div className="sc-balance-sc">SuperCoins available</div>
                  <div className={`sc-tier-badge ${memberTier === "Gold" ? "sc-tier-gold" : "sc-tier-silver"}`}>
                    {memberTier === "Gold" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#c5820a"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#9e9e9e"><circle cx="12" cy="12" r="10"/></svg>
                    )}
                    {memberTier} Member
                  </div>
                </div>

                {!loading && pendingCoins > 0 && (
                  <div className="sc-notice" style={{ marginTop: "16px" }}>
                    {pendingCoins} SC pending — confirm your orders to add them to your balance.
                  </div>
                )}

                {!loading && balance > 0 && (
                  <div className="sc-notice" style={{ marginTop: "8px" }}>
                    Use your SuperCoins at checkout or redeem them for partner offers!
                  </div>
                )}

                <div className="sc-stat-row">
                  {[
                    { label: "Earned (lifetime)", value: loading ? "..." : `${lifetimeEarned} SC`, cls: "sc-credit" },
                    { label: "Redeemed (lifetime)", value: loading ? "..." : `${lifetimeSpent} SC`, cls: "sc-debit" },
                    { label: "Pending", value: loading ? "..." : `${pendingCoins} SC`, cls: "" },
                    { label: "Earn rate", value: loading ? "..." : `${earnRate}% per order`, cls: "" },
                  ].map(s => (
                    <div className="sc-stat-item" key={s.label}>
                      <span className="sc-stat-lbl">{s.label}</span>
                      <span className={`sc-stat-val ${s.cls}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="sc-card">
                <div className="sc-tabs">
                  {(["offers", "redemptions", "history"] as const).map(tab => (
                    <button key={tab} className={`sc-tab ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}>
                      {tab === "offers" ? "Redeem Offers" : tab === "redemptions" ? "My Redemptions" : "Coin History"}
                    </button>
                  ))}
                </div>

                {activeTab === "offers" && (
                  offersError ? (
                    <div className="sc-empty">Could not load offers. Please try again later.</div>
                  ) : loading ? (
                    <div className="sc-empty">Loading offers...</div>
                  ) : offers.length === 0 ? (
                    <div className="sc-empty">No offers available right now. Check back later!</div>
                  ) : (
                    <div className="sc-offers-grid">
                      {offers.map(offer => {
                        const can = balance >= offer.coinsRequired;
                        const isRedeeming = redeeming === offer.id;
                        return (
                          <div key={offer.id} className="sc-offer-card" style={{ opacity: !can && !isRedeeming ? 0.55 : 1 }}>
                            {offer.tag && (
                              <span className={`sc-offer-tag sc-tag-${offer.tag.toLowerCase()}`}>
                                {offer.tag}
                              </span>
                            )}
                            <div className="sc-offer-cat">{offer.category}</div>
                            <div className="sc-offer-brand">{offer.brand}</div>
                            <div className="sc-offer-desc">{offer.description}</div>
                            <div className="sc-offer-footer">
                              <div className="sc-offer-coins">
                                <CoinSVG size={16} />
                                {offer.coinsRequired} SC
                              </div>
                              <button
                                onClick={() => handleRedeem(offer.id)}
                                disabled={!can || isRedeeming}
                                className={`sc-btn-redeem ${isRedeeming ? "loading" : can ? "can" : "cant"}`}
                              >
                                {isRedeeming ? "Redeeming..." : can ? "Redeem" : "Insufficient SC"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {activeTab === "redemptions" && (
                  loading ? (
                    <div className="sc-empty">Loading redemptions...</div>
                  ) : redemptions.length === 0 ? (
                    <div className="sc-empty">No redemptions yet. Redeem an offer to see it here!</div>
                  ) : (
                    <div>
                      {redemptions.map(r => (
                        <div key={r.id || r.couponCode} className="sc-tx-row">
                          <div>
                            <div className="sc-tx-lbl">{r.brand} — {r.description}</div>
                            <div className="sc-tx-date">
                              {r.status === "active" ? "Active" : r.status} &middot; {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <code style={{ fontSize: 13, fontWeight: 700, color: "#2874f0", letterSpacing: 1, background: "#e8f0fe", padding: "4px 8px", borderRadius: 4 }}>{r.couponCode}</code>
                            {r.status === "active" && (
                              <button onClick={() => copyCode(r.couponCode)}
                                style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                <CopyIcon /> {copied ? "Copied!" : "Copy"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {activeTab === "history" && (
                  loading ? (
                    <div className="sc-empty">Loading transactions...</div>
                  ) : transactions.length === 0 ? (
                    <div className="sc-empty">No transactions yet</div>
                  ) : (
                    <div>
                      {transactions.map(tx => (
                        <div className="sc-tx-row" key={tx.id}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div className={`sc-tx-icon ${tx.type === "credit" ? "sc-tx-credit-bg" : "sc-tx-debit-bg"}`}>
                              {tx.type === "credit" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                            </div>
                            <div>
                              <div className="sc-tx-lbl">{tx.label}</div>
                              <div className="sc-tx-date">{tx.date}</div>
                            </div>
                          </div>
                          <div className={`sc-tx-amt ${tx.type === "credit" ? "sc-credit" : "sc-debit"}`}>
                            {tx.type === "credit" ? "+" : "−"}{tx.coins} SC
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="sc-card">
                <div className="sc-section-hd" style={{ paddingBottom: "0" }}>Frequently Asked Questions</div>
                <div style={{ marginTop: "8px" }}>
                  {FAQS.map((faq, i) => (
                    <div className="sc-faq-item" key={i}>
                      <button className="sc-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        {faq.q}
                        <ChevronIcon open={openFaq === i} />
                      </button>
                      {openFaq === i && <div className="sc-faq-a">{faq.a}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {redeemResult && (
        <div className="sc-modal-overlay" onClick={() => setRedeemResult(null)}>
          <div className="sc-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, background: "#ecfdf5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckIcon />
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Redeemed Successfully!</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#616161" }}>Use this code at the partner's site:</p>
            <div className="sc-coupon-code">{redeemResult.couponCode}</div>
            <p style={{ fontSize: 12, color: "#878787", margin: "8px 0 16px" }}>{redeemResult.coinsSpent} SC were deducted from your balance</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => { copyCode(redeemResult.couponCode); }} style={{ background: "#2874f0", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <CopyIcon /> {copied ? "Copied!" : "Copy Code"}
              </button>
              <button onClick={() => setRedeemResult(null)} style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {redeemError && (
        <div className="sc-modal-overlay" onClick={() => setRedeemError("")}>
          <div className="sc-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#ef4444" }}>Redemption Failed</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#616161" }}>{redeemError}</p>
            <button onClick={() => setRedeemError("")} style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
