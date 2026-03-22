import { fetchPerformance, lookupPerf } from "@/lib/performance";

export const dynamic = "force-dynamic";

export async function GET() {
  const map = await fetchPerformance();

  const testIds = [
    { id: "openai/o3", name: "OpenAI: o3" },
    { id: "anthropic/claude-opus-4.6", name: "Anthropic: Claude Opus 4.6" },
    { id: "google/gemini-2.5-pro", name: "Google: Gemini 2.5 Pro" },
    { id: "meta-llama/llama-4-maverick", name: "Meta: Llama 4 Maverick" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta: Llama 3.3 70B Instruct" },
    { id: "meta-llama/llama-4-scout", name: "Meta: Llama 4 Scout" },
  ];

  const results = testIds.map(({ id, name }) => ({
    id,
    perf: lookupPerf(id, name, map),
  }));

  return Response.json({ mapSize: map.size, results });
}
