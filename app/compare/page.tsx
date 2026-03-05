import { fetchPrices } from "@/lib/prices";
import ComparePage from "@/components/ComparePage";

export const revalidate = 3600;

export default async function ComparePricePage() {
  let models = [];
  try {
    models = await fetchPrices();
  } catch (err) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>Failed to load pricing data.</p>
        <p style={{ fontSize: 13 }}>{String(err)}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--muted)" }}>From OpenRouter · updated hourly</p>
      </div>
      <ComparePage models={models} />
    </div>
  );
}
