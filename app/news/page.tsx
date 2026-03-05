import { fetchNews } from "@/lib/news";
import NewsCard from "@/components/NewsCard";

export const revalidate = 1800; // ISR every 30 minutes

export default async function NewsPage() {
  let items = [];
  try {
    items = await fetchNews();
  } catch (err) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>Failed to load news.</p>
        <p style={{ fontSize: 13 }}>{String(err)}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>AI News</h1>
        <p style={{ color: "var(--muted)" }}>
          {items.length} articles · refreshed every 30 minutes
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, i) => <NewsCard key={i} item={item} />)}
      </div>

      {items.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No news found.</p>
      )}
    </div>
  );
}
