import { describe, expect, it } from "vitest";
import { parseFeedXml, parseRss2Items } from "./rss-xml";

describe("rss-xml", () => {
  it("parses RSS 2.0 items", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title>Test &amp; Story</title>
        <link>https://example.com/a</link>
        <description><![CDATA[<p>Hello world</p>]]></description>
        <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;
    const items = parseRss2Items(xml);
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe("Test & Story");
    expect(items[0]!.link).toBe("https://example.com/a");
    expect(items[0]!.summary).toContain("Hello world");
  });

  it("parseFeedXml detects RSS", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title>T</title><link>https://x.test</link><description>D</description>
    </item></channel></rss>`;
    expect(parseFeedXml(xml)).toHaveLength(1);
  });
});
