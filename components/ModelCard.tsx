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

interface ModelCardProps {
  model: ModelPrice;
  onAdd?: () => void;
  isAdded?: boolean;
  removeMode?: boolean;
}

export default function ModelCard({ model, onAdd, isAdded, removeMode }: ModelCardProps) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "border-color 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = isAdded ? "var(--accent)" : "var(--border)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", lineHeight: 1.3 }}>
            {model.name}
          </p>
          <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {model.provider}
          </p>
        </div>
        <span style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 20,
          background: "var(--surface2)",
          color: "var(--muted)",
          whiteSpace: "nowrap",
        }}>
          {fmtCtx(model.contextLength)} ctx
        </span>
      </div>

      {model.description && (
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {model.description}
        </p>
      )}

      {onAdd && (
        <button
          onClick={onAdd}
          disabled={isAdded && !removeMode}
          style={{
            alignSelf: "flex-start",
            padding: "3px 10px",
            borderRadius: 6,
            border: `1px solid ${removeMode ? "#ef4444" : isAdded ? "var(--accent)" : "var(--border)"}`,
            background: removeMode ? "transparent" : isAdded ? "var(--accent)" : "transparent",
            color: removeMode ? "#ef4444" : isAdded ? "#fff" : "var(--muted)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {removeMode ? "− Remove" : isAdded ? "Added" : "+ Add to Compare"}
        </button>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>INPUT / 1M</p>
          <p style={{ fontWeight: 600, color: model.promptPrice === 0 ? "var(--green)" : "var(--text)" }}>
            {fmt(model.promptPrice)}
          </p>
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>OUTPUT / 1M</p>
          <p style={{ fontWeight: 600, color: model.completionPrice === 0 ? "var(--green)" : "var(--text)" }}>
            {fmt(model.completionPrice)}
          </p>
        </div>
      </div>
    </div>
  );
}
