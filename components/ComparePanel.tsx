"use client";

import React, { useState } from "react";
import type { ModelPrice } from "@/lib/prices";

function fmt(n: number) {
  if (n === 0) return "Free";
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(3)}`;
}
function fmtCtx(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const ROWS: { label: string; key: keyof ModelPrice; fmtFn: (v: ModelPrice) => string }[] = [
  { label: "Provider",     key: "provider",        fmtFn: m => m.provider },
  { label: "Input / 1M",  key: "promptPrice",     fmtFn: m => fmt(m.promptPrice) },
  { label: "Output / 1M", key: "completionPrice",  fmtFn: m => fmt(m.completionPrice) },
  { label: "Context",      key: "contextLength",   fmtFn: m => fmtCtx(m.contextLength) },
];

function bestIdx(models: ModelPrice[], key: "promptPrice" | "completionPrice" | "contextLength"): number {
  if (models.length === 0) return -1;
  let best = 0;
  for (let i = 1; i < models.length; i++) {
    const cur = models[i][key] as number;
    const b = models[best][key] as number;
    if (key === "contextLength" ? cur > b : cur < b) best = i;
  }
  return best;
}

interface Props {
  models: ModelPrice[];
  onRemove: (id: string) => void;
  onClear: () => void;
  inline?: boolean;
}

export default function ComparePanel({ models, onRemove, onClear, inline }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (models.length === 0) return (
    <div style={{
      ...(inline ? {} : { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }),
      background: "var(--surface, #0f0f17)",
      borderTop: "1px solid var(--border)",
      padding: "10px 20px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>
        Compare — เลือก model แล้วกด
      </span>
      <span style={{
        fontSize: 12, fontWeight: 600,
        padding: "2px 10px", borderRadius: 6,
        border: "1px solid var(--border)", color: "var(--muted)",
      }}>
        + Add to Compare
      </span>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>
        เพื่อเปรียบเทียบ (สูงสุด 5 models)
      </span>
    </div>
  );

  const bestPrompt = bestIdx(models.filter(m => m.promptPrice > 0), "promptPrice");
  const bestCompletion = bestIdx(models.filter(m => m.completionPrice > 0), "completionPrice");
  const bestCtx = bestIdx(models, "contextLength");

  // map back to original index
  const isPaid = (m: ModelPrice) => m.promptPrice > 0;
  const bestPromptId = isPaid(models[0]) || models.some(isPaid)
    ? models.filter(isPaid)[bestPrompt]?.id ?? ""
    : "";
  const bestCompId = models.filter(m => m.completionPrice > 0)[bestCompletion]?.id ?? "";
  const bestCtxId  = models[bestCtx]?.id ?? "";

  const highlight = (m: ModelPrice, key: keyof ModelPrice): React.CSSProperties => {
    if (key === "promptPrice"     && m.id === bestPromptId) return { color: "#10b981", fontWeight: 700 };
    if (key === "completionPrice" && m.id === bestCompId)   return { color: "#10b981", fontWeight: 700 };
    if (key === "contextLength"   && m.id === bestCtxId)    return { color: "#6366f1", fontWeight: 700 };
    return {};
  };

  return (
    <div style={{
      ...(inline ? { borderRadius: 12, marginTop: 24 } : { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }),
      background: "var(--surface, #0f0f17)",
      borderTop: "1px solid var(--border)",
      boxShadow: inline ? "none" : "0 -4px 24px rgba(0,0,0,0.4)",
      padding: "14px 20px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: collapsed ? 0 : 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Compare ({models.length}/5)</span>

        {/* Model name chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {models.map(m => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "2px 8px 2px 10px", borderRadius: 20,
              background: "var(--surface2, #1e1e2e)",
              border: "1px solid var(--border)", fontSize: 11,
            }}>
              <span style={{ color: "var(--text)" }}>
                {m.name.length > 20 ? m.name.slice(0, 18) + "…" : m.name}
              </span>
              <button
                onClick={() => onRemove(m.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--muted)", fontSize: 12, lineHeight: 1, padding: "0 0 0 2px",
                }}
              >×</button>
            </div>
          ))}
        </div>

        <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
          Green = cheapest · Purple = most context
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          style={{
            padding: "4px 12px", borderRadius: 6,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", fontSize: 11, cursor: "pointer",
          }}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
        <button
          onClick={onClear}
          style={{
            padding: "4px 12px", borderRadius: 6,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", fontSize: 11, cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      {/* Table */}
      {!collapsed && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", color: "var(--muted)", fontWeight: 500, padding: "0 12px 6px 0", width: 100 }}>
              </th>
              {models.map(m => (
                <th key={m.id} style={{ padding: "0 8px 6px", minWidth: 140, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text)" }}>
                      {m.name.length > 22 ? m.name.slice(0, 20) + "…" : m.name}
                    </span>
                    <button
                      onClick={() => onRemove(m.id)}
                      style={{
                        padding: "1px 8px", borderRadius: 5,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--muted)", fontSize: 10, cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "6px 12px 6px 0", color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>
                  {row.label}
                </td>
                {models.map(m => (
                  <td key={m.id} style={{ padding: "6px 8px", textAlign: "center", ...highlight(m, row.key) }}>
                    {row.fmtFn(m)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
