"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import type { ModelPrice } from "@/lib/prices";
import ModelCard from "./ModelCard";
import ComparePanel from "./ComparePanel";

const PricingChart3D = lazy(() => import("./PricingChart3D"));

type SortKey = "promptPrice" | "completionPrice" | "contextLength" | "name";

const PROVIDERS_ALL = "All";

export default function PricingTable({ models }: { models: ModelPrice[] }) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(PROVIDERS_ALL);
  const [sortKey, setSortKey] = useState<SortKey>("promptPrice");
  const [sortAsc, setSortAsc] = useState(true);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [show3D, setShow3D] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pickerProvider, setPickerProvider] = useState(PROVIDERS_ALL);
  const [pickerModelId, setPickerModelId] = useState("");
  const [pickerPriceFilter, setPickerPriceFilter] = useState<"all" | "free" | "paid">("all");

  const compareModels = useMemo(() => compareIds.map(id => models.find(m => m.id === id)!).filter(Boolean), [compareIds, models]);

  const pickerModels = useMemo(() =>
    models.filter(m => {
      if (pickerProvider !== PROVIDERS_ALL && m.provider !== pickerProvider) return false;
      if (pickerPriceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
      if (pickerPriceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
      return true;
    }),
    [models, pickerProvider, pickerPriceFilter]
  );

  function toggleCompare(id: string) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev);
  }

  function addFromPicker() {
    if (!pickerModelId || compareIds.includes(pickerModelId) || compareIds.length >= 5) return;
    setCompareIds(prev => [...prev, pickerModelId]);
    setPickerModelId("");
  }

  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models]);

  const pickerProviders = useMemo(() => {
    const filtered = models.filter(m => {
      if (pickerPriceFilter === "free") return m.promptPrice === 0 && m.completionPrice === 0;
      if (pickerPriceFilter === "paid") return m.promptPrice !== 0 || m.completionPrice !== 0;
      return true;
    });
    const set = new Set(filtered.map(m => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models, pickerPriceFilter]);

  const filtered = useMemo(() => {
    return models
      .filter((m) => {
        if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
            !m.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (provider !== PROVIDERS_ALL && m.provider !== provider) return false;
        if (priceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
        if (priceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
  }, [models, search, provider, sortKey, sortAsc, priceFilter]);

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

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as "all" | "free" | "paid")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <option value="all">All models</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </select>
        <button style={btnStyle(show3D)} onClick={() => setShow3D((v) => !v)}>
          Chart
        </button>
      </div>

      {/* Quick Compare Picker */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20,
        padding: "12px 14px", borderRadius: 10,
        border: "1px solid var(--border)", background: "var(--surface)",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>
          + Add to Compare:
        </span>

        {/* Price filter */}
        <select
          value={pickerPriceFilter}
          onChange={e => { setPickerPriceFilter(e.target.value as "all" | "free" | "paid"); setPickerProvider(PROVIDERS_ALL); setPickerModelId(""); }}
          style={{
            padding: "6px 10px", borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        {/* Provider / Family */}
        <select
          value={pickerProvider}
          onChange={e => { setPickerProvider(e.target.value); setPickerModelId(""); }}
          style={{
            padding: "6px 10px", borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          {pickerProviders.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Model name */}
        <select
          value={pickerModelId}
          onChange={e => setPickerModelId(e.target.value)}
          style={{
            flex: "1 1 220px", padding: "6px 10px", borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--text)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          <option value="">-- Select model --</option>
          {pickerModels.map(m => (
            <option key={m.id} value={m.id} disabled={compareIds.includes(m.id)}>
              {m.name}{compareIds.includes(m.id) ? " (added)" : ""}
            </option>
          ))}
        </select>

        <button
          onClick={addFromPicker}
          disabled={!pickerModelId || compareIds.includes(pickerModelId) || compareIds.length >= 5}
          style={{
            padding: "6px 16px", borderRadius: 7,
            border: "1px solid var(--accent)",
            background: !pickerModelId || compareIds.includes(pickerModelId) || compareIds.length >= 5
              ? "transparent" : "var(--accent)",
            color: !pickerModelId || compareIds.includes(pickerModelId) || compareIds.length >= 5
              ? "var(--muted)" : "#fff",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Add
        </button>

        {compareIds.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {compareIds.length}/5 selected
          </span>
        )}
      </div>

      {show3D && (
        <>
          <Suspense fallback={<p style={{ fontSize: 12, color: "var(--muted)", padding: "20px 0" }}>Loading chart...</p>}>
            <PricingChart3D models={compareModels} />
          </Suspense>

          {compareModels.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
              marginTop: 8,
            }}>
              {compareModels.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  onAdd={() => toggleCompare(m.id)}
                  isAdded={false}
                  removeMode={true}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!show3D && <>
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
        {filtered.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            onAdd={() => toggleCompare(m.id)}
            isAdded={compareIds.includes(m.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No models found.</p>
      )}
      </>}

      {/* Spacer so content isn't hidden behind sticky compare panel */}
      <div style={{ height: compareModels.length > 0 ? 160 : 44 }} />

      <ComparePanel
        models={compareModels}
        onRemove={(id) => setCompareIds(prev => prev.filter(x => x !== id))}
        onClear={() => setCompareIds([])}
      />
    </div>
  );
}
