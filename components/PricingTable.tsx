"use client";

import { useState, useMemo } from "react";
import type { ModelPrice } from "@/lib/prices";
import ModelCard from "./ModelCard";

type SortKey = "promptPrice" | "completionPrice" | "contextLength" | "name";

const PROVIDERS_ALL = "All";

export default function PricingTable({ models }: { models: ModelPrice[] }) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(PROVIDERS_ALL);
  const [sortKey, setSortKey] = useState<SortKey>("promptPrice");
  const [sortAsc, setSortAsc] = useState(true);
  const [freeOnly, setFreeOnly] = useState(false);

  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models]);

  const filtered = useMemo(() => {
    return models
      .filter((m) => {
        if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
            !m.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (provider !== PROVIDERS_ALL && m.provider !== provider) return false;
        if (freeOnly && m.promptPrice !== 0) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
  }, [models, search, provider, sortKey, sortAsc, freeOnly]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid",
    borderColor: active ? "var(--accent)" : "var(--border)",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--muted)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
          }}
        />

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {providers.map((p) => <option key={p}>{p}</option>)}
        </select>

        <button style={btnStyle(freeOnly)} onClick={() => setFreeOnly((v) => !v)}>
          Free only
        </button>
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

      {/* Count */}
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
        {filtered.length} models
      </p>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
      }}>
        {filtered.map((m) => <ModelCard key={m.id} model={m} />)}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No models found.</p>
      )}
    </div>
  );
}
