export interface ModelPerf {
  tokensPerSec: number | null;
  timeToFirstToken: number | null;
  intelligenceIndex: number | null;
}

type PerfMap = Map<string, ModelPerf>;

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function fetchPerformance(): Promise<PerfMap> {
  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!key) return new Map();

  try {
    const res = await fetch("https://artificialanalysis.ai/api/v2/data/llms/models", {
      headers: { "x-api-key": key },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Map();

    const json = await res.json();
    const models: any[] = json.data ?? [];

    const map: PerfMap = new Map();

    for (const m of models) {
      const perf: ModelPerf = {
        tokensPerSec: m.median_output_tokens_per_second ?? null,
        timeToFirstToken: m.median_time_to_first_token_seconds ?? null,
        intelligenceIndex: m.evaluations?.artificial_analysis_intelligence_index ?? null,
      };

      // Key 1: creator_slug/model_slug  e.g. "openai/gpt-4o"
      if (m.model_creator?.slug && m.slug) {
        map.set(`${m.model_creator.slug}/${m.slug}`, perf);
      }

      // Key 2: normalized name  e.g. "gpt4o"
      if (m.name) {
        map.set(normalize(m.name), perf);
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

// Creator aliases: OpenRouter → AA
const CREATOR_ALIASES: Record<string, string[]> = {
  "meta-llama": ["meta"],
  "ibm-granite": ["ibm"],
};

export function lookupPerf(orId: string, orName: string, perfMap: PerfMap): ModelPerf | null {
  const slashIdx = orId.indexOf("/");
  if (slashIdx !== -1) {
    const creator = orId.slice(0, slashIdx);
    const rawSlug = orId.slice(slashIdx + 1).replace(/:/g, "-").replace(/\./g, "-");

    // Try all creator aliases
    const creators = [creator, ...(CREATOR_ALIASES[creator] ?? [])];
    for (const c of creators) {
      const hit = perfMap.get(`${c}/${rawSlug}`);
      if (hit) return hit;
    }
  }

  // Try normalized name — strip provider prefix "Anthropic: ..."
  const nameWithoutProvider = orName.includes(": ") ? orName.split(": ").slice(1).join(": ") : orName;
  const hit2 = perfMap.get(normalize(nameWithoutProvider));
  if (hit2) return hit2;

  return null;
}
