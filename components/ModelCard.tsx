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

function modalityLabel(m: string): { label: string; icon: string } {
  if (m.includes("image->text") || m.includes("+image->")) return { label: "Vision", icon: "👁" };
  if (m.includes("->image") || m.includes("->text+image")) return { label: "Image Gen", icon: "🖼" };
  if (m.includes("audio")) return { label: "Audio", icon: "🔊" };
  return { label: "Text", icon: "T" };
}

function intelligenceRank(score: number): { label: string; bg: string; color: string } {
  if (score >= 50) return { label: "A+", bg: "#4c1d95", color: "#c4b5fd" };
  if (score >= 35) return { label: "A",  bg: "#1e3a5f", color: "#93c5fd" };
  if (score >= 20) return { label: "B",  bg: "#1c3a2a", color: "#6ee7b7" };
  return             { label: "C",  bg: "#2d2010", color: "#fcd34d" };
}

interface ModelCardProps {
  model: ModelPrice;
  onAdd?: () => void;
  isAdded?: boolean;
  removeMode?: boolean;
  onClick?: () => void;
}

export default function ModelCard({ model, onAdd, isAdded, removeMode, onClick }: ModelCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.15s",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = isAdded ? "var(--accent)" : "var(--border)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
            {model.name}
            {model.intelligenceIndex != null && (() => {
              const rank = intelligenceRank(model.intelligenceIndex);
              return (
                <span title={`Intelligence: ${model.intelligenceIndex}`} style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 20,
                  background: rank.bg, color: rank.color, fontWeight: 700,
                }}>
                  {rank.label}
                </span>
              );
            })()}
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
            <p style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {model.provider}
            </p>
            {(() => {
              const { label, icon } = modalityLabel(model.modality);
              return (
                <span title={model.modality} style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 20,
                  background: "var(--surface2)", color: "var(--muted)", fontWeight: 500,
                }}>
                  {icon} {label}
                </span>
              );
            })()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {model.promptPrice === 0 && model.completionPrice === 0 && (
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: "#14532d", color: "#4ade80",
              fontWeight: 700, whiteSpace: "nowrap",
            }}>
              FREE
            </span>
          )}
        </div>
      </div>


      {onAdd && (
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
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
          onMouseEnter={e => {
            if (isAdded && !removeMode) {
              (e.currentTarget as HTMLButtonElement).textContent = "− Remove";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid #ef4444";
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }
          }}
          onMouseLeave={e => {
            if (isAdded && !removeMode) {
              (e.currentTarget as HTMLButtonElement).textContent = "✓ Added";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }
          }}
        >
          {removeMode ? "− Remove" : isAdded ? "✓ Added" : "+ Add to Compare"}
        </button>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>INPUT / 1M</p>
          <p style={{ fontWeight: 600, color: model.promptPrice === 0 ? "var(--green)" : "var(--text)" }}>
            {fmt(model.promptPrice)}
          </p>
        </div>
        <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
        <div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>OUTPUT / 1M</p>
          <p style={{ fontWeight: 600, color: model.completionPrice === 0 ? "var(--green)" : "var(--text)" }}>
            {fmt(model.completionPrice)}
          </p>
        </div>
        <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
        <div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>TOTAL / 1M</p>
          <p style={{ fontWeight: 700, color: model.totalPrice === 0 ? "var(--green)" : "var(--accent)" }}>
            {fmt(model.totalPrice)}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          {model.createdAt && (() => {
            const d = new Date(model.createdAt * 1000);
            const now = new Date();
            const isNew = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            return (
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 20,
                background: isNew ? "#7c2d12" : "var(--surface2)",
                color: isNew ? "#fb923c" : "var(--muted)",
                fontWeight: isNew ? 700 : 400, whiteSpace: "nowrap",
              }}>
                {isNew ? "NEW" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
