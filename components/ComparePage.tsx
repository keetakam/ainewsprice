"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import type { ModelPrice } from "@/lib/prices";
import ModelCard from "./ModelCard";
import ComparePanel from "./ComparePanel";
import { useCompareIds } from "./useCompareIds";

const PricingChart3D = lazy(() => import("./PricingChart3D"));

const PROVIDERS_ALL = "All";

export default function ComparePage({ models }: { models: ModelPrice[] }) {
  const { ids, add, remove, clear } = useCompareIds();
  const [pickerProvider, setPickerProvider] = useState(PROVIDERS_ALL);
  const [pickerModelId, setPickerModelId] = useState("");
  const [pickerPriceFilter, setPickerPriceFilter] = useState<"all" | "free" | "paid">("all");

  const compareModels = useMemo(
    () => ids.map(id => models.find(m => m.id === id)!).filter(Boolean),
    [ids, models]
  );

  const pickerProviders = useMemo(() => {
    const filtered = models.filter(m => {
      if (pickerPriceFilter === "free") return m.promptPrice === 0 && m.completionPrice === 0;
      if (pickerPriceFilter === "paid") return m.promptPrice !== 0 || m.completionPrice !== 0;
      return true;
    });
    const set = new Set(filtered.map(m => m.provider));
    return [PROVIDERS_ALL, ...Array.from(set).sort()];
  }, [models, pickerPriceFilter]);

  const pickerModels = useMemo(() =>
    models.filter(m => {
      if (pickerProvider !== PROVIDERS_ALL && m.provider !== pickerProvider) return false;
      if (pickerPriceFilter === "free" && (m.promptPrice !== 0 || m.completionPrice !== 0)) return false;
      if (pickerPriceFilter === "paid" && m.promptPrice === 0 && m.completionPrice === 0) return false;
      return true;
    }),
    [models, pickerProvider, pickerPriceFilter]
  );

  function addFromPicker() {
    if (!pickerModelId || ids.includes(pickerModelId) || ids.length >= 5) return;
    add(pickerModelId);
    setPickerModelId("");
  }

  const selectStyle: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 7,
    border: "1px solid var(--border)",
    background: "var(--surface)", color: "var(--text)",
    fontSize: 12, cursor: "pointer",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Link href="/" style={{
          fontSize: 12, color: "var(--muted)", padding: "6px 12px",
          borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
          textDecoration: "none",
        }}>
          ← Models
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Compare Models</h1>
        {ids.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{ids.length}/5</span>
        )}
      </div>

      {/* Picker */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24,
        padding: "12px 14px", borderRadius: 10,
        border: "1px solid var(--border)", background: "var(--surface)",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>
          + Add to Compare:
        </span>

        <select
          value={pickerPriceFilter}
          onChange={e => {
            setPickerPriceFilter(e.target.value as "all" | "free" | "paid");
            setPickerProvider(PROVIDERS_ALL);
            setPickerModelId("");
          }}
          style={selectStyle}
        >
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select
          value={pickerProvider}
          onChange={e => { setPickerProvider(e.target.value); setPickerModelId(""); }}
          style={selectStyle}
        >
          {pickerProviders.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={pickerModelId}
          onChange={e => setPickerModelId(e.target.value)}
          style={{ ...selectStyle, flex: "1 1 220px" }}
        >
          <option value="">-- Select model --</option>
          {pickerModels.map(m => (
            <option key={m.id} value={m.id} disabled={ids.includes(m.id)}>
              {m.name}{ids.includes(m.id) ? " (added)" : ""}
            </option>
          ))}
        </select>

        <button
          onClick={addFromPicker}
          disabled={!pickerModelId || ids.includes(pickerModelId) || ids.length >= 5}
          style={{
            padding: "6px 16px", borderRadius: 7,
            border: "1px solid var(--accent)",
            background: !pickerModelId || ids.includes(pickerModelId) || ids.length >= 5
              ? "transparent" : "var(--accent)",
            color: !pickerModelId || ids.includes(pickerModelId) || ids.length >= 5
              ? "var(--muted)" : "#fff",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Add
        </button>

        {ids.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{ids.length}/5 selected</span>
        )}
      </div>

      {compareModels.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "60px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No models selected</p>
          <p style={{ fontSize: 13 }}>Add models using the picker above, or go back to the models list.</p>
        </div>
      )}

      {compareModels.length > 0 && (
        <>
          {/* Chart */}
          <Suspense fallback={<p style={{ fontSize: 12, color: "var(--muted)", padding: "20px 0" }}>Loading chart...</p>}>
            <PricingChart3D models={compareModels} />
          </Suspense>

          {/* Model cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12, marginTop: 20,
          }}>
            {compareModels.map(m => (
              <ModelCard
                key={m.id}
                model={m}
                onAdd={() => remove(m.id)}
                isAdded={false}
                removeMode={true}
              />
            ))}
          </div>

          {/* Inline comparison table */}
          <ComparePanel
            models={compareModels}
            onRemove={remove}
            onClear={clear}
            inline={true}
          />
        </>
      )}

      <div style={{ height: 60 }} />
    </div>
  );
}
