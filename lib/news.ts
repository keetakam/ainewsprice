import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
  imageUrl?: string;
}

const RSS_FEEDS = [
  { url: "https://feeds.feedburner.com/oreilly/radar", source: "O'Reilly Radar" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat AI" },
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch AI" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge AI" },
];

const parser = new Parser({
  customFields: {
    item: [["media:content", "mediaContent"], ["enclosure", "enclosure"]],
  },
});

type RSSItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  mediaContent?: { $?: { url?: string } };
  enclosure?: { url?: string };
};

function extractImage(item: RSSItem): string | undefined {
  return (
    item.mediaContent?.$?.url ??
    item.enclosure?.url
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url);
      return (feed.items as RSSItem[]).slice(0, 10).map((item) => ({
        title: item.title ?? "No title",
        link: item.link ?? "#",
        pubDate: item.pubDate ?? new Date().toISOString(),
        summary: stripHtml(item.contentSnippet ?? item.content ?? "").slice(0, 200),
        source,
        imageUrl: extractImage(item),
      }));
    })
  );

  const items: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
  }

  return items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}
