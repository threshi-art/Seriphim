/**
 * Major news outlet RSS feeds used for real, verifiable article links.
 * URLs are public feeds published by or for these organizations.
 */

export type OutletFeedSpec = {
  /** Display name shown in the UI (outlet brand). */
  source: string;
  feedUrl: string;
  /** Seraphim category slugs this feed contributes to. */
  categories: string[];
};

/**
 * Each feed is tagged with one or more categories. `general` is the broad home / top-stories mix.
 */
export const MAJOR_OUTLET_FEEDS: OutletFeedSpec[] = [
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/rss.xml", categories: ["general", "world"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml", categories: ["world"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml", categories: ["technology"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", categories: ["science", "aerospace"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml", categories: ["business"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/politics/rss.xml", categories: ["politics"] },
  { source: "BBC News", feedUrl: "https://feeds.bbci.co.uk/news/health/rss.xml", categories: ["health"] },

  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_topstories.rss", categories: ["general"] },
  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_world.rss", categories: ["world"] },
  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_tech.rss", categories: ["technology"] },
  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_showbiz.rss", categories: ["entertainment"] },
  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_health.rss", categories: ["health"] },
  { source: "CNN", feedUrl: "http://rss.cnn.com/rss/cnn_sport.rss", categories: ["sports"] },

  { source: "AP News", feedUrl: "https://apnews.com/hub/apf-topnews?format=rss", categories: ["general", "world"] },
  { source: "AP News", feedUrl: "https://apnews.com/hub/politics?format=rss", categories: ["politics"] },
  { source: "AP News", feedUrl: "https://apnews.com/hub/sports?format=rss", categories: ["sports"] },
  { source: "AP News", feedUrl: "https://apnews.com/hub/entertainment?format=rss", categories: ["entertainment"] },

  { source: "NPR", feedUrl: "https://feeds.npr.org/1001/rss.xml", categories: ["general"] },
  { source: "NPR", feedUrl: "https://feeds.npr.org/1004/rss.xml", categories: ["world"] },
  { source: "NPR", feedUrl: "https://feeds.npr.org/1019/rss.xml", categories: ["politics"] },
  { source: "NPR", feedUrl: "https://feeds.npr.org/1007/rss.xml", categories: ["science"] },
  { source: "NPR", feedUrl: "https://feeds.npr.org/1008/rss.xml", categories: ["technology"] },

  { source: "PBS NewsHour", feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines", categories: ["general", "politics", "world"] },

  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/news", categories: ["general"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/world", categories: ["world"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/politics", categories: ["politics"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/technology", categories: ["technology"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/science", categories: ["science", "aerospace"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/business", categories: ["business"] },
  { source: "NBC News", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/health", categories: ["health"] },

  { source: "MSNBC", feedUrl: "https://feeds.nbcnews.com/msnbc/public/news", categories: ["general", "politics"] },

  { source: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/main", categories: ["general"] },
  { source: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/world", categories: ["world"] },
  { source: "CBS News", feedUrl: "https://www.cbsnews.com/latest/rss/politics", categories: ["politics"] },
];

export function feedsForCategory(category: string): OutletFeedSpec[] {
  const c = category.toLowerCase().trim();
  if (c === "general") {
    return MAJOR_OUTLET_FEEDS.filter((f) => f.categories.includes("general"));
  }
  return MAJOR_OUTLET_FEEDS.filter((f) => f.categories.includes(c));
}
