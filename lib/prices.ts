import { fetchPerformance, lookupPerf } from "./performance";
import type { ModelPerf } from "./performance";

export interface ModelPrice {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  promptPrice: number;      // USD per 1M tokens
  completionPrice: number;  // USD per 1M tokens
  provider: string;
  modality: string;
  createdAt: number | null; // Unix timestamp
  tokensPerSec: number | null;
  timeToFirstToken: number | null;
  intelligenceIndex: number | null;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  created?: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    modality?: string;
  };
}

export async function fetchPrices(): Promise<ModelPrice[]> {
  const [res, perfMap] = await Promise.all([
    fetch("https://openrouter.ai/api/v1/models", { next: { revalidate: 3600 } }),
    fetchPerformance(),
  ]);

  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);

  const json = await res.json();
  const models: OpenRouterModel[] = json.data ?? [];

  return models
    .filter((m) => {
      if (!m.pricing?.prompt || !m.pricing?.completion) return false;
      const p = parseFloat(m.pricing.prompt);
      const c = parseFloat(m.pricing.completion);
      return p >= 0 && c >= 0;
    })
    .map((m) => {
      const perf = lookupPerf(m.id, m.name, perfMap);
      return {
        id: m.id,
        name: m.name,
        description: m.description ?? "",
        contextLength: m.context_length ?? 0,
        promptPrice: parseFloat(m.pricing.prompt) * 1_000_000,
        completionPrice: parseFloat(m.pricing.completion) * 1_000_000,
        provider: m.id.split("/")[0] ?? "unknown",
        modality: m.architecture?.modality ?? "text->text",
        createdAt: m.created ?? null,
        tokensPerSec: perf?.tokensPerSec ?? null,
        timeToFirstToken: perf?.timeToFirstToken ?? null,
        intelligenceIndex: perf?.intelligenceIndex ?? null,
      };
    })
    .sort((a, b) => a.promptPrice - b.promptPrice);
}
