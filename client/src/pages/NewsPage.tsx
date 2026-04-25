import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Newspaper, Search, ExternalLink, Clock, Loader2, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "general", "technology", "science", "business", "politics",
  "world", "health", "sports", "entertainment", "aerospace",
];

export default function NewsPage() {
  const [category, setCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data: articles, isLoading, refetch, isFetching } = trpc.news.fetch.useQuery(
    { category, query: activeSearch || undefined },
    { staleTime: 5 * 60 * 1000 }
  );

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-[oklch(0.70_0.14_175)]" />
            News Intelligence
          </h1>
          <p className="text-xs text-[oklch(0.45_0.02_230)] mt-1">
            AI-powered multi-source news aggregation
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[oklch(0.12_0.02_230)] border border-[oklch(0.18_0.02_230)] text-[oklch(0.50_0.02_230)] hover:text-[oklch(0.70_0.14_175)] hover:border-[oklch(0.70_0.14_175_/_0.3)] transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.35_0.02_230)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search news topics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-[oklch(0.08_0.02_230)] border border-[oklch(0.15_0.02_230)] text-white placeholder:text-[oklch(0.35_0.02_230)] focus:outline-none focus:border-[oklch(0.70_0.14_175_/_0.5)]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[oklch(0.70_0.14_175_/_0.15)] border border-[oklch(0.70_0.14_175_/_0.3)] text-[oklch(0.70_0.14_175)] hover:bg-[oklch(0.70_0.14_175_/_0.25)] transition-colors"
        >
          Search
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setActiveSearch("");
              setSearchQuery("");
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${
              category === cat && !activeSearch
                ? "bg-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.3)]"
                : "bg-[oklch(0.10_0.02_230)] border border-[oklch(0.15_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-[oklch(0.60_0.02_230)] hover:border-[oklch(0.20_0.02_230)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active search indicator */}
      {activeSearch && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[oklch(0.70_0.14_175_/_0.08)] border border-[oklch(0.70_0.14_175_/_0.2)]">
          <Search className="h-3.5 w-3.5 text-[oklch(0.70_0.14_175)]" />
          <span className="text-xs text-[oklch(0.70_0.14_175)]">
            Results for: <strong>{activeSearch}</strong>
          </span>
          <button
            onClick={() => { setActiveSearch(""); setSearchQuery(""); }}
            className="ml-auto text-[10px] text-[oklch(0.45_0.02_230)] hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[oklch(0.70_0.14_175)] animate-spin" />
          <span className="ml-3 text-sm text-[oklch(0.45_0.02_230)]">Fetching news intelligence...</span>
        </div>
      )}

      {/* Articles */}
      {!isLoading && articles && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article: any, i: number) => (
            <a
              key={`${article.url}-${i}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-5 hover:border-[oklch(0.70_0.14_175_/_0.2)] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.70_0.14_175_/_0.1)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.2)]">
                      {article.source}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[oklch(0.12_0.02_230)] text-[oklch(0.40_0.02_230)] capitalize">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-[oklch(0.70_0.14_175)] transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[oklch(0.45_0.02_230)] leading-relaxed mb-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-[oklch(0.35_0.02_230)]">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px]">
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-[oklch(0.30_0.02_230)] group-hover:text-[oklch(0.70_0.14_175)] transition-colors shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!articles || articles.length === 0) && (
        <div className="rounded-xl border border-[oklch(0.12_0.02_230)] bg-[oklch(0.08_0.02_230_/_0.5)] p-12 text-center">
          <Newspaper className="h-10 w-10 text-[oklch(0.25_0.02_230)] mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[oklch(0.40_0.02_230)] mb-2">No articles found</h3>
          <p className="text-xs text-[oklch(0.30_0.02_230)]">
            Try a different category or search term.
          </p>
        </div>
      )}
    </div>
  );
}
