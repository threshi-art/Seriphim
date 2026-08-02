import { useChatSession } from "@/contexts/ChatSessionContext";
import { DASHBOARD_NAV_GROUPS } from "@/config/dashboard-navigation";
import { useNewsflowFlagCounts } from "@/hooks/useNewsflowFlagCounts";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Bookmark, Clock, Home, LayoutDashboard, MessageSquare, Newspaper } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * Global ⌘K / Ctrl+K palette: jump to any dashboard route, deck, home, or open AI panel.
 */
export function NavigationCommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { setSidePanelOpen } = useChatSession();
  const newsflowCounts = useNewsflowFlagCounts();

  const go = useCallback(
    (path: string) => {
      setLocation(path);
      setOpen(false);
    },
    [setLocation],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-xl">
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList className="max-h-[min(420px,50vh)]">
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Quick">
          <CommandItem
            onSelect={() => {
              setSidePanelOpen(true);
              setOpen(false);
            }}
          >
            <MessageSquare className="text-primary" />
            Open Seraphim AI (sidebar chat)
          </CommandItem>
          <CommandItem onSelect={() => go("/")}>
            <Home />
            Home (landing)
          </CommandItem>
          <CommandItem onSelect={() => go("/deck")}>
            <LayoutDashboard />
            Command Deck
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="NewsFlow">
          <CommandItem
            value="newsflow news intelligence feed all"
            onSelect={() => go("/news")}
          >
            <Newspaper className="text-primary" />
            News — all signals
            <CommandShortcut className="font-mono text-[10px] opacity-60">/news</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="newsflow flagged bookmarked saved articles"
            onSelect={() => go("/news?view=flagged")}
          >
            <Bookmark className="text-primary" />
            News — flagged
            {newsflowCounts.flagged > 0 ? ` (${newsflowCounts.flagged})` : ""}
            <CommandShortcut className="font-mono text-[10px] opacity-60">?view=flagged</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="newsflow queued read later queue"
            onSelect={() => go("/news?view=queued")}
          >
            <Clock className="text-primary" />
            News — queued
            {newsflowCounts.queued > 0 ? ` (${newsflowCounts.queued})` : ""}
            <CommandShortcut className="font-mono text-[10px] opacity-60">?view=queued</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {DASHBOARD_NAV_GROUPS.map((group) => (
          <CommandGroup key={group.id} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem key={item.path} value={`${group.label} ${item.label} ${item.path}`} onSelect={() => go(item.path)}>
                <item.icon />
                {item.label}
                <CommandShortcut className="font-mono text-[10px] opacity-60">{item.path}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
