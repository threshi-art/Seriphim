/**
 * Minimal RSS 2.0 / Atom feed parsing (no external XML dependency).
 */

export type ParsedFeedItem = {
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
};

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)));
}

function stripCdata(s: string): string {
  const t = s.trim();
  if (t.startsWith("<![CDATA[") && t.endsWith("]]>")) {
    return t.slice(9, -3).trim();
  }
  return t;
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m?.[1]) return "";
  return decodeBasicEntities(stripCdata(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim()));
}

function extractAtomLink(block: string): string {
  const m = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  return m?.[1] ? decodeBasicEntities(m[1].trim()) : "";
}

function stripHtml(s: string): string {
  if (!s) return "";
  const noTags = s.replace(/<[^>]+>/g, " ");
  return decodeBasicEntities(noTags).replace(/\s+/g, " ").trim();
}

function parseRfc822OrIso(dateStr: string): string {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
}

/** Parse RSS 2.0 <item> blocks. */
export function parseRss2Items(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1] ?? "";
    let title = extractTag(block, "title");
    let link = extractTag(block, "link");
    if (!link) {
      const guid = extractTag(block, "guid");
      if (guid.startsWith("http")) link = guid;
    }
    const description = extractTag(block, "description") || extractTag(block, "content:encoded");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
    title = stripHtml(title);
    link = link.trim();
    if (!title || !link || !link.startsWith("http")) continue;
    items.push({
      title,
      link,
      summary: stripHtml(description).slice(0, 500) || title,
      publishedAt: pubDate ? parseRfc822OrIso(pubDate) : new Date().toISOString(),
    });
  }
  return items;
}

/** Parse Atom <entry> blocks. */
export function parseAtomEntries(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const re = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1] ?? "";
    const title = stripHtml(extractTag(block, "title"));
    let link = extractAtomLink(block);
    if (!link) link = extractTag(block, "link");
    const summary =
      stripHtml(extractTag(block, "summary")) ||
      stripHtml(extractTag(block, "content")) ||
      title;
    const updated = extractTag(block, "updated") || extractTag(block, "published");
    if (!title || !link || !link.startsWith("http")) continue;
    items.push({
      title,
      link,
      summary: summary.slice(0, 500) || title,
      publishedAt: updated ? parseRfc822OrIso(updated) : new Date().toISOString(),
    });
  }
  return items;
}

export function parseFeedXml(xml: string): ParsedFeedItem[] {
  const trimmed = xml.trim();
  if (trimmed.includes("<rss") || trimmed.includes("<rdf:RDF")) {
    return parseRss2Items(trimmed);
  }
  if (trimmed.includes("xmlns=\"http://www.w3.org/2005/Atom\"") || /<feed[\s>]/.test(trimmed)) {
    return parseAtomEntries(trimmed);
  }
  const rssItems = parseRss2Items(trimmed);
  if (rssItems.length > 0) return rssItems;
  return parseAtomEntries(trimmed);
}
