import { feedsForCategory, type OutletFeedSpec } from "./major-outlets";
import { parseFeedXml, type ParsedFeedItem } from "./rss-xml";

export type NewsArticleRow = {
  title: string;
  source: string;
  url: string;
  summary: string;
  category: string;
  publishedAt: string;
};

const FETCH_TIMEOUT_MS = 12_000;
const MAX_ITEMS_PER_FEED = 12;
const MAX_FEEDS_PER_REQUEST = 14;
const MAX_ARTICLES_RETURNED = 48;

const USER_AGENT =
  "SeraphimNewsAggregator/1.0 (+https://github.com/seraphim; editorial RSS reader)";

async function fetchFeedXml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "icid"].forEach((k) =>
      u.searchParams.delete(k),
    );
    return u.toString();
  } catch {
    return url;
  }
}

function feedMatchesQuery(item: ParsedFeedItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  return hay.includes(q);
}

function mapToRow(item: ParsedFeedItem, source: string, category: string): NewsArticleRow {
  return {
    title: item.title,
    source,
    url: item.link,
    summary: item.summary,
    category,
    publishedAt: item.publishedAt,
  };
}

/**
 * Fetches and merges RSS from major outlets for the given Seraphim category and optional search query.
 */
export async function fetchMajorOutletNews(
  category: string,
  query?: string,
): Promise<NewsArticleRow[]> {
  const cat = category.toLowerCase().trim() || "general";
  let specs = feedsForCategory(cat);
  if (specs.length === 0) {
    specs = feedsForCategory("general");
  }

  const limitedSpecs = specs.slice(0, MAX_FEEDS_PER_REQUEST);
  const results = await Promise.all(
    limitedSpecs.map(async (spec: OutletFeedSpec) => {
      const xml = await fetchFeedXml(spec.feedUrl);
      if (!xml) return [] as NewsArticleRow[];
      let parsed: ParsedFeedItem[];
      try {
        parsed = parseFeedXml(xml);
      } catch {
        return [];
      }
      const sliced = parsed.slice(0, MAX_ITEMS_PER_FEED);
      return sliced
        .filter((item) => feedMatchesQuery(item, query ?? ""))
        .map((item) => mapToRow(item, spec.source, cat));
    }),
  );

  const merged = results.flat();
  const seen = new Set<string>();
  const deduped: NewsArticleRow[] = [];
  for (const row of merged) {
    const key = normalizeUrl(row.url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...row, url: key });
  }

  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return deduped.slice(0, MAX_ARTICLES_RETURNED);
}
