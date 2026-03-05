"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ModelPrice } from "@/lib/prices";
import ModelCard from "./ModelCard";
import ModelDetailModal from "./ModelDetailModal";
import { useCompareIds } from "./useCompareIds";

type SortKey = "promptPrice" | "completionPrice" | "contextLength" | "name";

const PROVIDERS_ALL = "All";

export default function ModelList({ models }: { models: ModelPrice[] }) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(PROVIDERS_ALL);
  const [sortKey, setSortKey] = useState<SortKey>("promptPrice");
  const [sortAsc, setSortAsc] = useState(true);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [selectedModel, setSelectedModel] = useState<ModelPrice | null>(null);
  const { ids, add, remove } = useCompareIds();

  const providers = useMemo(() => {
    const filtered = models.filter(m => {
      if (priceFilter === "free") return m.promptPrice === 0 && m.completionPrice === 0;
      if (priceFilter === "paid") return m.promptPrice !== 0 || m.completionPrice !== 0;
      return true;
    });
    const set = new Set(filtered.map(m => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models, priceFilter]);

  const filtered = useMemo(() => {
    return models
      .filter(m => {
        if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
            !m.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (provider !== PROVIDERS_ALL && m.provider !== provider) return false;
        if (priceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
        if (priceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
  }, [models, search, provider, sortKey, sortAsc, priceFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: 8,
    border: "1px solid", borderColor: active ? "var(--accent)" : "var(--border)",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--muted)",
    fontSize: 12, fontWeight: 500, cursor: "pointer",
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px", padding: "8px 12px",
            borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 13, outline: "none",
          }}
        />
        <select
          value={provider}
          onChange={e => setProvider(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 13, cursor: "pointer",
          }}
        >
          {providers.map(p => <option key={p}>{p}</option>)}
        </select>
        <select
          value={priceFilter}
          onChange={e => { setPriceFilter(e.target.value as "all" | "free" | "paid"); setProvider(PROVIDERS_ALL); }}
          style={{
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          <option value="all">All models</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </select>

        <Link
          href="/compare"
          style={{
            padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${ids.length > 0 ? "var(--accent)" : "var(--border)"}`,
            background: ids.length > 0 ? "var(--accent)" : "transparent",
            color: ids.length > 0 ? "#fff" : "var(--muted)",
            fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            display: "inline-flex", alignItems: "center", gap: 4,
            textDecoration: "none",
          }}
        >
          Compare{ids.length > 0 ? ` (${ids.length})` : ""}
        </Link>
      </div>

      {/* Sort buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>Sort:</span>
        {([["promptPrice", "Input price"], ["completionPrice", "Output price"], ["contextLength", "Context"], ["name", "Name"]] as [SortKey, string][]).map(([key, label]) => (
          <button key={key} style={btnStyle(sortKey === key)} onClick={() => toggleSort(key)}>
            {label} {sortKey === key ? (sortAsc ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{filtered.length} models</p>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            onAdd={() => ids.includes(m.id) ? remove(m.id) : add(m.id)}
            isAdded={ids.includes(m.id)}
            onClick={() => setSelectedModel(m)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No models found.</p>
      )}

      <div style={{ height: 60 }} />

      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          isAdded={ids.includes(selectedModel.id)}
          onAdd={() => ids.includes(selectedModel.id) ? remove(selectedModel.id) : add(selectedModel.id)}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}
