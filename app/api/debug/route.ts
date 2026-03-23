export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;

  if (!key) {
    return Response.json({ error: "No API key found in env" });
  }

  try {
    const res = await fetch("https://artificialanalysis.ai/api/v2/data/llms/models", {
      headers: { "x-api-key": key },
      next: { revalidate: 86400 },
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = null; }

    return Response.json({
      keyPresent: true,
      keyPrefix: key.slice(0, 8) + "...",
      status: res.status,
      ok: res.ok,
      firstModel: json?.data?.[0] ?? null,
      totalModels: json?.data?.length ?? 0,
      rawIfError: res.ok ? undefined : text.slice(0, 500),
    });
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
}
