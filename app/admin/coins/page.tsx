"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  totalActiveUsers: number; totalBalance: number; totalLifetimeEarned: number; totalLifetimeSpent: number;
  totalPendingCoins: number; totalExpiredCoins: number; avgUserBalance: number; topTier: string;
  tierDistribution: Record<string, number>;
}

interface WalletEntry { id: string; balance: number; pendingCoins: number; status: string; createdAt: string; user: { id: string; name: string; email: string }; }
interface Campaign { id: string; name: string; description: string; status: string; startsAt: string; endsAt: string | null; earningMultiplier: number | null; rewardAmount: number | null; }
interface CoinRule { id: string; action: string; coinAmount: number; source: string; active: boolean; maxDaily: number | null; maxPerUser: number | null; conditions: Record<string, unknown>; }

export default function AdminCoinsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "wallets" | "campaigns" | "rules" | "product-limits">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rules, setRules] = useState<CoinRule[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryPercent, setCategoryPercent] = useState("");

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coins/analytics");
      if (!res.ok) { if (res.status === 401) router.push("/login"); return; }
      const d = await res.json();
      setAnalytics(d.analytics);
    } catch { /* ignore */ }
  }, [router]);

  const fetchWallets = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/coins/wallets?page=${page}&limit=20`);
      if (!res.ok) return;
      const d = await res.json();
      setWallets(d.wallets ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coins/campaigns");
      if (!res.ok) return;
      const d = await res.json();
      setCampaigns(d.campaigns ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coins/rules");
      if (!res.ok) return;
      const d = await res.json();
      setRules(d.rules ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchProducts = useCallback(async (page = 1, category = "") => {
    try {
      const res = await fetch(`/api/admin/coins/product-limits/list?page=${page}&limit=20${category ? `&category=${category}` : ""}`);
      if (!res.ok) return;
      const d = await res.json();
      setProducts(d.products ?? []);
      setProductPage(d.page ?? 1);
      setProductTotalPages(d.totalPages ?? 1);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAnalytics(), fetchWallets(), fetchCampaigns(), fetchRules()]);
    setLoading(false);
  }, [fetchAnalytics, fetchWallets, fetchCampaigns, fetchRules]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === "product-limits") {
      fetchProducts(1, categoryInput);
    }
  }, [tab, categoryInput, fetchProducts]);

  const toggleCampaignStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    await fetch(`/api/admin/coins/campaigns`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchCampaigns();
  };

  const toggleRuleStatus = async (id: string, current: boolean) => {
    await fetch(`/api/admin/coins/rules`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !current }),
    });
    fetchRules();
  };

  const toggleWalletStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "frozen" : "active";
    await fetch(`/api/admin/coins/wallets`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId: id, status: newStatus }),
    });
    fetchWallets();
  };

  const handleBulkUpdate = async () => {
    if (!categoryInput || !categoryPercent) return;
    const percent = parseInt(categoryPercent, 10);
    if (isNaN(percent) || percent < 0 || percent > 100) return alert("Invalid percentage");

    const res = await fetch("/api/admin/coins/product-limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: categoryInput, percent })
    });
    if (res.ok) {
      alert("Category updated successfully");
      fetchProducts(productPage, categoryInput);
    } else {
      alert("Failed to update category");
    }
  };

  const handleProductUpdate = async (productId: string, percentStr: string) => {
    const percent = parseInt(percentStr, 10);
    if (isNaN(percent) || percent < 0 || percent > 100) return alert("Invalid percentage");

    const res = await fetch("/api/admin/coins/product-limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, percent })
    });
    if (res.ok) {
      fetchProducts(productPage, categoryInput);
    } else {
      alert("Failed to update product");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-soft-canvas flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Coins</h1>
        <p className="text-sm text-b2w-muted mt-0.5">Wallets, campaigns, and earning rules</p>
      </div>
      <div className="max-w-6xl mx-auto">

        <div className="flex gap-2 mb-4 flex-wrap">
          {(["overview", "wallets", "campaigns", "rules", "product-limits"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border border-hairline transition ${
                tab === t ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-slate hover:border-brand-blue"
              }`}>
              {t === "overview" ? "Overview" : t === "wallets" ? "Wallets" : t === "campaigns" ? "Campaigns" : t === "rules" ? "Earning Rules" : "Product Limits"}
            </button>
          ))}
        </div>

        {tab === "overview" && analytics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Active Users", value: analytics.totalActiveUsers ?? 0 },
                { label: "Total Balance", value: `Rs. ${(analytics.totalBalance ?? 0).toLocaleString("en-IN")}` },
                { label: "Lifetime Earned", value: (analytics.totalLifetimeEarned ?? 0).toLocaleString("en-IN") },
                { label: "Lifetime Spent", value: (analytics.totalLifetimeSpent ?? 0).toLocaleString("en-IN") },
                { label: "Pending Coins", value: (analytics.totalPendingCoins ?? 0).toLocaleString("en-IN") },
                { label: "Expired Coins", value: (analytics.totalExpiredCoins ?? 0).toLocaleString("en-IN") },
                { label: "Avg Balance", value: `Rs. ${(analytics.avgUserBalance ?? 0).toFixed(1)}` },
                { label: "Top Tier", value: analytics.topTier ?? "N/A" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-hairline rounded-lg p-3">
                  <p className="text-xs text-slate uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold text-ink-black mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            {analytics.tierDistribution && (
              <div className="bg-white border border-hairline rounded-lg p-4 mb-4">
                <h2 className="text-sm font-bold text-ink-black mb-3">Tier Distribution</h2>
                <div className="space-y-2">
                  {Object.entries(analytics.tierDistribution).map(([tier, count]) => (
                    <div key={tier} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink-black w-24">{tier}</span>
                      <div className="flex-1 bg-soft-canvas rounded-full h-2.5 overflow-hidden">
                        <div className="bg-brand-blue h-full rounded-full" style={{ width: `${Math.min(100, (Number(count) / Math.max(1, analytics.totalActiveUsers)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate w-12 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "wallets" && (
          <div className="bg-white border border-hairline rounded-lg p-4">
            <h2 className="text-sm font-bold text-ink-black mb-3">User Wallets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-xs text-slate uppercase tracking-wider">
                    <th className="pb-2 pr-2">User</th>
                    <th className="pb-2 pr-2">Email</th>
                    <th className="pb-2 pr-2 text-right">Balance</th>
                    <th className="pb-2 pr-2 text-right">Pending</th>
                    <th className="pb-2 pr-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map(w => (
                    <tr key={w.id} className="border-b border-hairline">
                      <td className="py-2 pr-2 font-medium text-ink-black">{w.user?.name ?? "N/A"}</td>
                      <td className="py-2 pr-2 text-slate">{w.user?.email ?? ""}</td>
                      <td className="py-2 pr-2 text-right font-bold">{w.balance}</td>
                      <td className="py-2 pr-2 text-right text-slate">{w.pendingCoins}</td>
                      <td className="py-2 pr-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${w.status === "active" ? "bg-green/10 text-green" : "bg-red-100 text-red-500"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <button onClick={() => toggleWalletStatus(w.id, w.status)}
                          className="text-xs text-brand-blue hover:underline bg-transparent border-none cursor-pointer">
                          {w.status === "active" ? "Freeze" : "Unfreeze"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wallets.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate text-sm">No wallets found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "campaigns" && (
          <div className="bg-white border border-hairline rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ink-black">Active Campaigns</h2>
              <button onClick={() => { /* open create modal */ }}
                className="bg-brand-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer">
                + New Campaign
              </button>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-center text-slate text-sm py-8">No campaigns yet.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 border border-hairline rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-black">{c.name}</p>
                      <p className="text-xs text-slate">{c.description}</p>
                      <p className="text-xs text-slate mt-0.5">{new Date(c.startsAt).toLocaleDateString("en-IN")}{c.endsAt ? ` - ${new Date(c.endsAt).toLocaleDateString("en-IN")}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === "active" ? "bg-green/10 text-green" : "bg-soft-canvas text-slate"}`}>{c.status}</span>
                      <button onClick={() => toggleCampaignStatus(c.id, c.status)}
                        className="text-xs text-brand-blue hover:underline bg-transparent border-none cursor-pointer">
                        {c.status === "active" ? "Pause" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "rules" && (
          <div className="bg-white border border-hairline rounded-lg p-4">
            <h2 className="text-sm font-bold text-ink-black mb-3">Earning Rules</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-slate uppercase tracking-wider">
                  <th className="pb-2 pr-2">Action</th>
                  <th className="pb-2 pr-2">Coins</th>
                  <th className="pb-2 pr-2">Source</th>
                  <th className="pb-2 pr-2">Max/Day</th>
                  <th className="pb-2 pr-2">Max/User</th>
                  <th className="pb-2 pr-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-b border-hairline">
                    <td className="py-2 pr-2 font-medium text-ink-black capitalize">{r.action.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-2 font-bold">{r.coinAmount}</td>
                    <td className="py-2 pr-2 text-slate">{r.source}</td>
                    <td className="py-2 pr-2 text-slate">{r.maxDaily ?? "-"}</td>
                    <td className="py-2 pr-2 text-slate">{r.maxPerUser ?? "-"}</td>
                    <td className="py-2 pr-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${r.active ? "bg-green/10 text-green" : "bg-soft-canvas text-slate"}`}>
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2">
                      <button onClick={() => toggleRuleStatus(r.id, r.active)}
                        className="text-xs text-brand-blue hover:underline bg-transparent border-none cursor-pointer">
                        {r.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate text-sm">No rules configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "product-limits" && (
          <div className="space-y-4">
            <div className="bg-white border border-hairline rounded-lg p-4">
              <h2 className="text-sm font-bold text-ink-black mb-3">Bulk Update by Category</h2>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate mb-1">Category Name</label>
                  <select value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full border border-hairline rounded px-3 py-1.5 text-sm outline-none focus:border-brand-blue bg-white">
                    <option value="">All Categories</option>
                    {["fashion", "electronics", "mobile", "beauty", "food", "furniture", "sports", "books"].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate mb-1">Max Redemption %</label>
                  <input type="number" min="0" max="100" value={categoryPercent} onChange={e => setCategoryPercent(e.target.value)} placeholder="10" className="w-full border border-hairline rounded px-3 py-1.5 text-sm outline-none focus:border-brand-blue" />
                </div>
                <button onClick={handleBulkUpdate} className="bg-b2w-red text-white text-sm font-bold px-4 py-1.5 rounded outline-none border-none cursor-pointer hover:bg-red-700">Apply to Category</button>
              </div>
            </div>

            <div className="bg-white border border-hairline rounded-lg p-4">
              <h2 className="text-sm font-bold text-ink-black mb-3">Individual Product Limits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left text-xs text-slate uppercase tracking-wider">
                      <th className="pb-2 pr-2">Product Name</th>
                      <th className="pb-2 pr-2">Category</th>
                      <th className="pb-2 pr-2">Max %</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-hairline">
                        <td className="py-2 pr-2 font-medium text-ink-black truncate max-w-[200px]">{p.name}</td>
                        <td className="py-2 pr-2 text-slate">{p.category}</td>
                        <td className="py-2 pr-2">
                          <input type="number" min="0" max="100" defaultValue={p.maxCoinRedemptionPercent} className="border border-hairline rounded px-2 py-1 text-sm outline-none focus:border-brand-blue w-16" onBlur={e => { if (e.target.value !== String(p.maxCoinRedemptionPercent)) handleProductUpdate(p.id, e.target.value); }} />
                        </td>
                        <td className="py-2">
                          <span className="text-xs text-slate italic">Auto-saves on unfocus</span>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-slate text-sm">No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {productTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm border-t border-hairline pt-4">
                  <button onClick={() => fetchProducts(productPage - 1, categoryInput)} disabled={productPage === 1} className="px-3 py-1 border border-hairline rounded text-slate disabled:opacity-50">Previous</button>
                  <span className="text-slate">Page {productPage} of {productTotalPages}</span>
                  <button onClick={() => fetchProducts(productPage + 1, categoryInput)} disabled={productPage === productTotalPages} className="px-3 py-1 border border-hairline rounded text-slate disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
