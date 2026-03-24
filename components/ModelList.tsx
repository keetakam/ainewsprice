"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ModelPrice } from "@/lib/prices";
import ModelCard from "./ModelCard";
import ModelDetailModal from "./ModelDetailModal";
import { useCompareIds } from "./useCompareIds";

type SortKey = "promptPrice" | "completionPrice" | "contextLength" | "name" | "tokensPerSec" | "intelligenceIndex" | "createdAt";

const PROVIDERS_ALL = "All";

export default function ModelList({ models }: { models: ModelPrice[] }) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(PROVIDERS_ALL);
  const [sorts, setSorts] = useState<{ key: SortKey; asc: boolean }[]>([{ key: "promptPrice", asc: true }]);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [modalityFilter, setModalityFilter] = useState<"all" | "text" | "vision" | "audio">("all");
  const [newOnly, setNewOnly] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPrice | null>(null);
  const { ids, add, remove } = useCompareIds();

  const providers = useMemo(() => {
    const filtered = models.filter(m => {
      if (priceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
      if (priceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
      if (modalityFilter === "text" && m.modality !== "text->text") return false;
      if (modalityFilter === "vision" && !m.modality.includes("image")) return false;
      if (modalityFilter === "audio" && !m.modality.includes("audio")) return false;
      return true;
    });
    const set = new Set(filtered.map(m => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models, priceFilter, modalityFilter]);

  const filtered = useMemo(() => {
    return models
      .filter(m => {
        if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
            !m.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (provider !== PROVIDERS_ALL && m.provider !== provider) return false;
        if (priceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
        if (priceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
        if (modalityFilter === "text" && m.modality !== "text->text") return false;
        if (modalityFilter === "vision" && !m.modality.includes("image")) return false;
        if (modalityFilter === "audio" && !m.modality.includes("audio")) return false;
        if (newOnly) {
          const now = new Date();
          const d = m.createdAt ? new Date(m.createdAt * 1000) : null;
          if (!d || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
        return true;
      })
      .sort((a, b) => {
        for (const { key, asc } of sorts) {
          const av = a[key], bv = b[key];
          // null always goes to end regardless of direction
          if (av == null && bv == null) continue;
          if (av == null) return 1;
          if (bv == null) return -1;
          let cmp = 0;
          if (typeof av === "string") cmp = av.localeCompare(bv as string);
          else cmp = (av as number) - (bv as number);
          if (cmp !== 0) return asc ? cmp : -cmp;
        }
        return 0;
      });
  }, [models, search, provider, sorts, priceFilter, modalityFilter, newOnly]);

  function toggleSort(key: SortKey) {
    setSorts(prev => {
      const idx = prev.findIndex(s => s.key === key);
      if (idx !== -1) {
        // already active — toggle direction or remove if clicked again same direction
        const s = prev[idx];
        const defaultAsc = key !== "intelligenceIndex" && key !== "createdAt";
        if (s.asc === defaultAsc) {
          // flip direction
          return prev.map((s, i) => i === idx ? { ...s, asc: !s.asc } : s);
        } else {
          // remove
          return prev.filter((_, i) => i !== idx);
        }
      }
      // add new sort as primary (front)
      return [{ key, asc: key !== "intelligenceIndex" && key !== "createdAt" }, ...prev];
    });
  }

  const btnStyle = (key: SortKey): React.CSSProperties => {
    const idx = sorts.findIndex(s => s.key === key);
    const active = idx !== -1;
    return {
      padding: "6px 12px", borderRadius: 8,
      border: "1px solid", borderColor: active ? "var(--accent)" : "var(--border)",
      background: active ? "var(--accent)" : "transparent",
      color: active ? "#fff" : "var(--muted)",
      fontSize: 12, fontWeight: 500, cursor: "pointer",
    };
  };

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
        <select
          value={modalityFilter}
          onChange={e => setModalityFilter(e.target.value as "all" | "text" | "vision" | "audio")}
          style={{
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          <option value="all">All types</option>
          <option value="text">Text</option>
          <option value="vision">Vision</option>
          <option value="audio">Audio</option>
        </select>

        <button
          onClick={() => setNewOnly(v => !v)}
          style={{
            padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${newOnly ? "#7c2d12" : "var(--border)"}`,
            background: newOnly ? "#7c2d12" : "transparent",
            color: newOnly ? "#fb923c" : "var(--muted)",
            fontSize: 12, fontWeight: newOnly ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          NEW
        </button>

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
        {([["promptPrice", "Input price"], ["completionPrice", "Output price"], ["contextLength", "Context"], ["tokensPerSec", "Speed"], ["name", "Name"], ["intelligenceIndex", "Intelligence"], ["createdAt", "Release date"]] as [SortKey, string][]).map(([key, label]) => {
          const s = sorts.find(s => s.key === key);
          const idx = sorts.findIndex(s => s.key === key);
          return (
            <button key={key} style={btnStyle(key)} onClick={() => toggleSort(key)}>
              {label} {s ? (s.asc ? "↑" : "↓") : ""}{sorts.length > 1 && s ? ` ${idx + 1}` : ""}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{filtered.length}</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>models</span>
      </div>

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
