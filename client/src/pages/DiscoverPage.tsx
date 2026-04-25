import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Globe, Shuffle, ExternalLink, Plus, X, Sparkles, Compass, ArrowRight, Loader2 } from "lucide-react";

const INTEREST_SUGGESTIONS = [
  "Aerospace", "AI", "Cybersecurity", "Physics", "History", "Music",
  "Art", "Space", "Robotics", "Philosophy", "Mathematics", "Biology",
  "Cryptography", "Gaming", "Architecture", "Psychology", "Economics", "Photography",
];

export default function DiscoverPage() {
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [discoveredSites, setDiscoveredSites] = useState<Array<{
    title: string; url: string; description: string; category: string;
  }>>([]);

  const stumble = trpc.discover.stumble.useMutation({
    onSuccess: (site) => {
      setDiscoveredSites((prev) => [site, ...prev]);
    },
  });

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleStumble = () => {
    if (interests.length === 0) return;
    stumble.mutate({ interests });
  };

  const availableSuggestions = useMemo(
    () => INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s)),
    [interests]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-[oklch(0.70_0.14_175)]" />
            Web Discovery
          </h1>
          <p className="text-xs text-[oklch(0.45_0.02_230)] mt-1">
            StumbleUpon-style random website exploration
          </p>
        </div>
        <button
          onClick={handleStumble}
          disabled={interests.length === 0 || stumble.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-[oklch(0.70_0.14_175)] to-[oklch(0.55_0.18_200)] text-[#050a12] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_oklch(0.70_0.14_175_/_0.3)] transition-all"
        >
          {stumble.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Shuffle className="h-4 w-4" />
          )}
          Stumble!
        </button>
      </div>

      {/* Interest Selection */}
      <div className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.45_0.02_230)] mb-3">
          Your Interests
        </p>

        {/* Selected interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {interests.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[oklch(0.70_0.14_175_/_0.15)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.3)]"
              >
                {interest}
                <button onClick={() => removeInterest(interest)} className="hover:text-white transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom interest input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInterest.trim()) {
                addInterest(customInterest);
                setCustomInterest("");
              }
            }}
            placeholder="Add a custom interest..."
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-[oklch(0.08_0.02_230)] border border-[oklch(0.15_0.02_230)] text-white placeholder:text-[oklch(0.35_0.02_230)] focus:outline-none focus:border-[oklch(0.70_0.14_175_/_0.5)]"
          />
          <button
            onClick={() => {
              if (customInterest.trim()) {
                addInterest(customInterest);
                setCustomInterest("");
              }
            }}
            className="px-3 py-2 rounded-lg bg-[oklch(0.15_0.02_230)] border border-[oklch(0.20_0.02_230)] text-[oklch(0.50_0.02_230)] hover:text-[oklch(0.70_0.14_175)] hover:border-[oklch(0.70_0.14_175_/_0.3)] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => addInterest(s)}
              className="px-2.5 py-1 rounded-md text-[11px] bg-[oklch(0.12_0.02_230)] border border-[oklch(0.18_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-[oklch(0.70_0.14_175)] hover:border-[oklch(0.70_0.14_175_/_0.3)] transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {stumble.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {stumble.error.message}
        </div>
      )}

      {/* Discovered Sites */}
      {discoveredSites.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.45_0.02_230)]">
            Discovered ({discoveredSites.length})
          </p>
          {discoveredSites.map((site, i) => (
            <div
              key={`${site.url}-${i}`}
              className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-5 hover:border-[oklch(0.70_0.14_175_/_0.2)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-[oklch(0.70_0.14_175)] shrink-0" />
                    <h3 className="text-sm font-bold text-white truncate">{site.title}</h3>
                  </div>
                  <p className="text-xs text-[oklch(0.45_0.02_230)] mb-2 leading-relaxed">{site.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[oklch(0.70_0.14_175_/_0.1)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.2)]">
                      {site.category}
                    </span>
                    <span className="text-[10px] text-[oklch(0.35_0.02_230)] truncate">{site.url}</span>
                  </div>
                </div>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2.5 rounded-lg bg-[oklch(0.70_0.14_175_/_0.1)] border border-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)] hover:bg-[oklch(0.70_0.14_175_/_0.2)] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl border border-[oklch(0.12_0.02_230)] bg-[oklch(0.08_0.02_230_/_0.5)] p-12 text-center">
          <Sparkles className="h-10 w-10 text-[oklch(0.25_0.02_230)] mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[oklch(0.40_0.02_230)] mb-2">No discoveries yet</h3>
          <p className="text-xs text-[oklch(0.30_0.02_230)]">
            Select your interests above and hit <strong className="text-[oklch(0.70_0.14_175)]">Stumble!</strong> to explore the web.
          </p>
        </div>
      )}
    </div>
  );
}
