export interface ModelPrice {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  promptPrice: number;   // USD per 1M tokens
  completionPrice: number; // USD per 1M tokens
  provider: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export async function fetchPrices(): Promise<ModelPrice[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);

  const json = await res.json();
  const models: OpenRouterModel[] = json.data ?? [];

  return models
    .filter((m) => m.pricing?.prompt && m.pricing?.completion)
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      contextLength: m.context_length ?? 0,
      promptPrice: parseFloat(m.pricing.prompt) * 1_000_000,
      completionPrice: parseFloat(m.pricing.completion) * 1_000_000,
      provider: m.id.split("/")[0] ?? "unknown",
    }))
    .sort((a, b) => a.promptPrice - b.promptPrice);
}
