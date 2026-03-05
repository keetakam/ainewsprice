"use client";

import type { NewsItem } from "@/lib/news";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>{item.source}</span>
          <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{timeAgo(item.pubDate)}</span>
        </div>
        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4, marginBottom: 6, color: "var(--text)" }}>
          {item.title}
        </p>
        {item.summary && (
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {item.summary}
          </p>
        )}
      </div>
    </a>
  );
}
