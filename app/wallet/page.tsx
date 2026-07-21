"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window { Razorpay: any; }
}

const PRESET_AMOUNTS = [100, 250, 500, 1000];

const b2w = {
  teal: "#1a211e", green: "#1a211e", red: "#ef4444",
  navy: "#1a211e", body: "#606562", muted: "#606562",
  border: "#e0e0e0", bg: "#f8f9f8", white: "#ffffff",
  cardShadow: "none", lightteal: "#1a211e",
};

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.balance ?? 0);
        setTransactions(d.transactions ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTopup = async (amount: number) => {
    setError(null);
    if (!Number.isInteger(amount) || amount < 10) {
      setError("Enter a valid amount (minimum ₹10)");
      return;
    }
    setProcessing(true);
    try {
      const initRes = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Failed to start top-up");

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount * 100,
          currency: "INR",
          order_id: initData.razorpayOrderId,
          name: "SuperCoins Wallet",
          description: `Purchase ${amount} SuperCoins`,
          handler: async (response: any) => {
            const verifyRes = await fetch("/api/wallet/topup/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(verifyData.error || "Payment verification failed");
            } else {
              setBalance(verifyData.balance);
              load();
            }
            setProcessing(false);
          },
          modal: { ondismiss: () => setProcessing(false) },
        });
        rzp.open();
      };
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setProcessing(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: b2w.white, borderRadius: 8, border: `1px solid ${b2w.border}`,
  };
  const sectionHeaderStyle: React.CSSProperties = {
    margin: 0, fontSize: 16, fontWeight: 700, color: b2w.navy,
  };
  const presetBtnStyle: React.CSSProperties = {
    padding: "10px 18px", border: `1px solid ${b2w.border}`, borderRadius: 4,
    fontSize: 13, fontWeight: 700, background: b2w.white, color: b2w.navy,
    cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5,
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, border: `1px solid ${b2w.border}`, borderRadius: 4,
    padding: "10px 12px", fontSize: 14, color: b2w.navy, background: b2w.white,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: b2w.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: b2w.navy, margin: "0 0 24px" }}>
          SuperCoins Wallet
        </h1>

        {/* Balance card */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: b2w.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Current Balance
          </p>
          {loading ? (
            <div style={{ height: 36, width: 140, background: b2w.bg, borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
          ) : (
            <p style={{ margin: 0, fontSize: 34, fontWeight: 700, color: b2w.navy }}>
              {balance?.toLocaleString("en-IN")}{" "}
              <span style={{ fontSize: 16, fontWeight: 500, color: b2w.muted }}>SuperCoins</span>
            </p>
          )}
          <p style={{ margin: "6px 0 0", fontSize: 12, color: b2w.muted }}>1 SuperCoin = ₹1</p>
        </div>

        {/* Buy coins */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${b2w.border}` }}>
            <h2 style={sectionHeaderStyle}>Buy SuperCoins</h2>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {error && (
              <p style={{ margin: "0 0 14px", fontSize: 13, color: b2w.red }}>{error}</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => handleTopup(a)}
                  disabled={processing}
                  style={{ ...presetBtnStyle, opacity: processing ? 0.5 : 1, cursor: processing ? "not-allowed" : "pointer" }}
                >
                  ₹{a}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Custom amount"
                style={inputStyle}
              />
              <button
                onClick={() => handleTopup(parseInt(customAmount, 10))}
                disabled={processing || !customAmount}
                style={{
                  background: "#1a211e", color: "#fff", border: "none",
                  padding: "10px 24px", borderRadius: 4, fontWeight: 700, cursor: (processing || !customAmount) ? "not-allowed" : "pointer",
                  fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5,
                  opacity: (processing || !customAmount) ? 0.5 : 1, whiteSpace: "nowrap",
                }}
              >
                {processing ? "Processing..." : "Buy"}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div style={cardStyle}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${b2w.border}` }}>
            <h2 style={sectionHeaderStyle}>Transaction History</h2>
          </div>
          <div style={{ padding: transactions.length === 0 ? "20px 24px" : "0 24px" }}>
            {transactions.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: b2w.muted }}>No transactions yet</p>
            ) : (
              transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 0",
                    borderBottom: idx === transactions.length - 1 ? "none" : `1px solid ${b2w.border}`,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: b2w.navy, textTransform: "capitalize" }}>
                      {tx.description || tx.source?.replace(/_/g, " ")}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: b2w.muted }}>
                      {new Date(tx.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: tx.type === "earn" ? "#059669" : b2w.red }}>
                    {tx.type === "earn" ? "+" : "-"}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}