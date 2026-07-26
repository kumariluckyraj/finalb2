"use client";
import { useEffect, useState } from "react";

type CoverageType = "PAN" | "STATE" | "DISTRICT" | "PINCODE";
type Area = { id: string; areaType: Exclude<CoverageType, "PAN">; value: string };
type Product = {
  id: string;
  name: string;
  sellingPrice: number;
  mrp: number;
  shipsFrom?: string;
  coverageType: CoverageType;
  areas: Area[];
};

const TYPE_LABEL: Record<CoverageType, string> = {
  PAN: "Pan-India",
  STATE: "State-wise",
  DISTRICT: "District-wise",
  PINCODE: "Pincode-wise",
};
const AREA_PLACEHOLDER: Record<Exclude<CoverageType, "PAN">, string> = {
  STATE: "e.g. West Bengal",
  DISTRICT: "e.g. Kolkata",
  PINCODE: "6-digit",
};

export default function PincodeCoveragePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newValue, setNewValue] = useState<Record<string, string>>({});
  const [locatingId, setLocatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/seller/pincodes")
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setStats(d.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changeCoverageType = async (productId: string, coverageType: CoverageType) => {
    await fetch("/api/seller/pincodes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, coverageType }),
    });
    load();
  };

  const addArea = async (productId: string, areaType: Exclude<CoverageType, "PAN">) => {
    const value = newValue[productId]?.trim();
    if (!value) return;
    if (areaType === "PINCODE" && !/^\d{6}$/.test(value)) return;

    const res = await fetch("/api/seller/pincodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, areaType, value }),
    });
    if (res.ok) {
      setNewValue((prev) => ({ ...prev, [productId]: "" }));
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add");
    }
  };

  const removeArea = async (productId: string, areaType: Exclude<CoverageType, "PAN">, value: string) => {
    await fetch("/api/seller/pincodes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, areaType, value }),
    });
    load();
  };

  // Auto-fetch vendor's current location and fill the input for the active coverage type
  const useMyLocation = (productId: string, areaType: Exclude<CoverageType, "PAN">) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser");
      return;
    }
    setLocatingId(productId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/geo/reverse?lat=${latitude}&lng=${longitude}`);
          const loc = await res.json();
          const fieldValue =
            areaType === "PINCODE" ? loc.pincode : areaType === "DISTRICT" ? loc.district : loc.state;
          if (fieldValue) {
            setNewValue((prev) => ({ ...prev, [productId]: fieldValue }));
          } else {
            alert("Could not detect that field from your location");
          }
        } catch {
          alert("Failed to fetch location");
        } finally {
          setLocatingId(null);
        }
      },
      () => {
        alert("Location permission denied");
        setLocatingId(null);
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coverage Settings</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-blue-700">
            <p className="text-sm opacity-80 mb-1">Active Products</p>
            <p className="text-2xl font-bold">{stats.totalActive}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-green-700">
            <p className="text-sm opacity-80 mb-1">With Coverage</p>
            <p className="text-2xl font-bold">{stats.withCoverage}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-purple-700">
            <p className="text-sm opacity-80 mb-1">Total Area Entries</p>
            <p className="text-2xl font-bold">{stats.totalAreaEntries}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">Product</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Price</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Coverage Mode</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Areas</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isAreaBased = p.coverageType !== "PAN";
              return (
                <tr key={p.id} className="border-b last:border-0 align-top hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    ₹{p.sellingPrice?.toLocaleString("en-IN")}
                    {p.mrp > p.sellingPrice && (
                      <span className="text-gray-400 line-through ml-1 text-xs">
                        ₹{p.mrp?.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.coverageType}
                      onChange={(e) => changeCoverageType(p.id, e.target.value as CoverageType)}
                      className="border border-gray-200 rounded-lg text-xs px-2 py-1"
                    >
                      {(["PAN", "STATE", "DISTRICT", "PINCODE"] as CoverageType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {!isAreaBased ? (
                      <span className="text-xs text-gray-400">Ships everywhere in India</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="text-brand-blue hover:underline text-xs font-medium"
                        >
                          {p.areas.length} {p.coverageType.toLowerCase()}(s) {expanded[p.id] ? "▲" : "▼"}
                        </button>
                        {expanded[p.id] && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.areas.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                              >
                                {a.value}
                                <button
                                  onClick={() => removeArea(p.id, a.areaType, a.value)}
                                  className="text-red-500 hover:text-red-700 ml-0.5"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                            {p.areas.length === 0 && (
                              <span className="text-xs text-gray-400">No areas added</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAreaBased && (
                      <div className="flex gap-1 items-center">
                        <input
                          value={newValue[p.id] || ""}
                          onChange={(e) => setNewValue((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder={AREA_PLACEHOLDER[p.coverageType as Exclude<CoverageType, "PAN">]}
                          maxLength={p.coverageType === "PINCODE" ? 6 : 40}
                          className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <button
                          onClick={() => addArea(p.id, p.coverageType as Exclude<CoverageType, "PAN">)}
                          className="px-2 py-1 bg-brand-blue text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => useMyLocation(p.id, p.coverageType as Exclude<CoverageType, "PAN">)}
                          disabled={locatingId === p.id}
                          title="Use my current location"
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50"
                        >
                          {locatingId === p.id ? "…" : "📍"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No active products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}