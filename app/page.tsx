import { fetchPrices } from "@/lib/prices";
import PricingTable from "@/components/PricingTable";

export const revalidate = 3600; // ISR every 1 hour

export default async function PricingPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>AI Model Pricing</h1>
        <p style={{ color: "var(--muted)" }}>
          {models.length} models from OpenRouter · updated hourly
        </p>
      </div>
      <PricingTable models={models} />
    </div>
  );
}
