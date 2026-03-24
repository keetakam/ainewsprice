"use client";

import type { ModelPrice } from "@/lib/prices";

function fmt(n: number) {
  if (n === 0) return "Free";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}
function fmtCtx(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtDate(ts: number | null) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function fmtModality(m: string) {
  return m.replace("->", " → ");
}

interface Props {
  model: ModelPrice;
  isAdded: boolean;
  onAdd: () => void;
  onClose: () => void;
}

export default function ModelDetailModal({ model, isAdded, onAdd, onClose }: Props) {
  const isFree = model.promptPrice === 0 && model.completionPrice === 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 28,
          maxWidth: 520,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              {model.name}
            </h2>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
              <p style={{ fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {model.provider}
              </p>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "var(--surface2)", color: "var(--muted)", fontWeight: 600,
              }}>{fmtModality(model.modality)}</span>
            </div>
            {fmtDate(model.createdAt) && (
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                Released {fmtDate(model.createdAt)}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {isFree && (
              <span style={{
                fontSize: 11, padding: "2px 10px", borderRadius: 20,
                background: "#14532d", color: "#4ade80", fontWeight: 700,
              }}>FREE</span>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--muted)", fontSize: 22, lineHeight: 1, padding: "0 4px",
              }}
            >×</button>
          </div>
        </div>

        {/* Description */}
        {model.description && (
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            {model.description
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
              .replace(/\*\*([^*]+)\*\*/g, "$1")}
          </p>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "INPUT / 1M", value: fmt(model.promptPrice), green: model.promptPrice === 0, hint: undefined },
            { label: "OUTPUT / 1M", value: fmt(model.completionPrice), green: model.completionPrice === 0, hint: undefined },
            ...(model.tokensPerSec != null && model.tokensPerSec > 0 ? [{ label: "OUTPUT TOKENS / SEC", value: `${Math.round(model.tokensPerSec)} t/s`, green: false, hint: "Higher is better" }] : []),
            { label: "CONTEXT", value: fmtCtx(model.contextLength), green: false, hint: undefined },
          ].map(({ label, value, green, hint }: { label: string; value: string; green: boolean; hint?: string }) => (
            <div key={label} style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{label}</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: green ? "var(--green)" : "var(--text)" }}>{value}</p>
              {hint && <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{hint}</p>}
            </div>
          ))}
          {model.timeToFirstToken != null && (
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>TTFT</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{model.timeToFirstToken.toFixed(2)}s</p>
            </div>
          )}
          {model.intelligenceIndex != null && (
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>INTELLIGENCE</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{model.intelligenceIndex}</p>
            </div>
          )}
        </div>

        {/* Model ID */}
        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 20, fontFamily: "monospace", wordBreak: "break-all" }}>
          {model.id}
        </p>

        {/* Add to compare */}
        <button
          onClick={onAdd}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: "1px solid var(--accent)",
            background: isAdded ? "transparent" : "var(--accent)",
            color: isAdded ? "var(--accent)" : "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {isAdded ? "✓ Added to Compare" : "+ Add to Compare"}
        </button>
      </div>
    </div>
  );
}
