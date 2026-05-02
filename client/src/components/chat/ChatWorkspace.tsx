import { useChatSession } from "@/contexts/ChatSessionContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Loader2, Send, User, Sparkles, Plus, Trash2, MessageSquare,
  Brain, Scale, Cpu, Globe, Users, Pen, Flame, BookOpen,
  FileText, ShieldAlert, LayoutDashboard, Download, Paperclip,
  ChevronDown, Search, X,
} from "lucide-react";
import { useMemo } from "react";
import { Streamdown } from "streamdown";
import { MODES, type SeraphimMode } from "@shared/modes";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ChatConversationRow = RouterOutputs["chat"]["conversations"][number];
type ChatSearchRow = RouterOutputs["chatSearch"]["search"][number];

const ICON_MAP: Record<string, typeof Brain> = {
  MessageSquare, Brain, Scale, Cpu, Globe, Users, Pen, Flame,
  BookOpen, FileText, ShieldAlert, LayoutDashboard,
};

function getModeIcon(iconName: string) {
  return ICON_MAP[iconName] || MessageSquare;
}

export type ChatWorkspaceProps = {
  /** Full page uses wider thread rail; sheet uses a compact rail always visible */
  variant?: "page" | "sheet";
};

export function ChatWorkspace({ variant = "page" }: ChatWorkspaceProps) {
  const {
    activeConvId,
    setActiveConvId,
    localMessages,
    input,
    setInput,
    error,
    activeMode,
    setActiveMode,
    showModePanel,
    setShowModePanel,
    attachment,
    setAttachment,
    setAttachmentData,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    showSearch,
    setShowSearch,
    scrollRef,
    textareaRef,
    fileInputRef,
    searchResults,
    convQuery,
    createConv,
    deleteConv,
    sendMsg,
    uploadFile,
    handleFileSelect,
    handleSend,
    handleKeyDown,
    handleExport,
    suggestedPrompts,
  } = useChatSession();

  const displayMessages = localMessages.filter((m) => m.role !== "system");
  const currentMode = MODES.find((m) => m.id === activeMode)!;
  const CurrentModeIcon = getModeIcon(currentMode.icon);

  const searchHits: ChatSearchRow[] = Array.isArray(searchResults.data) ? searchResults.data : [];
  const conversations: ChatConversationRow[] = Array.isArray(convQuery.data) ? convQuery.data : [];

  const threadRailClass =
    variant === "page"
      ? "w-60 border-r border-border/50 bg-muted/20 flex flex-col shrink-0 hidden md:flex"
      : "w-[11rem] sm:w-52 border-r border-border/50 bg-muted/20 flex flex-col shrink-0 flex";

  return (
    <div className={cn("flex h-full min-h-0", variant === "sheet" && "text-[13px]")}>
      <div className={threadRailClass}>
        <div className="p-3 border-b border-border/50 space-y-2">
          <div className="flex gap-1.5">
            <Button
              onClick={() => createConv.mutate({ title: "New Conversation" })}
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
              disabled={createConv.isPending}
            >
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
            >
              {showSearch ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            </div>
          )}
        </div>

        {showSearch && debouncedSearch.length >= 2 ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {searchResults.isLoading && (
                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </div>
              )}
              {searchResults.isError && (
                <div className="p-3 text-xs text-destructive text-center">Search failed. Try again.</div>
              )}
              {searchHits.length === 0 && debouncedSearch.length >= 2 && !searchResults.isLoading && !searchResults.isError && (
                <div className="p-3 text-xs text-muted-foreground text-center">No results</div>
              )}
              {searchHits.map((result, i) => (
                <button
                  key={`${result.messageId}-${i}`}
                  type="button"
                  onClick={() => {
                    setActiveConvId(result.conversationId);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-border/30"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] font-medium text-primary truncate">{result.conversationTitle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{result.content.substring(0, 120)}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-all",
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                  onClick={() => setActiveConvId(conv.id)}
                  onKeyDown={(e) => e.key === "Enter" && setActiveConvId(conv.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full shrink-0",
                      activeConvId === conv.id ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConv.mutate({ id: conv.id });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="border-b border-border/50 bg-muted/10 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <CurrentModeIcon className="h-4 w-4 text-primary shrink-0" />
              <Select value={activeMode} onValueChange={(v) => setActiveMode(v as SeraphimMode)}>
                <SelectTrigger
                  className={cn(
                    "h-8 text-xs bg-card/50 border-border/50 min-w-0",
                    variant === "sheet" ? "w-[min(100%,11rem)]" : "w-[220px]",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((mode) => {
                    const Icon = getModeIcon(mode.icon);
                    return (
                      <SelectItem key={mode.id} value={mode.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {mode.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {variant === "page" && (
              <span className="text-[11px] text-muted-foreground hidden lg:inline truncate">{currentMode.desc}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {displayMessages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as Markdown</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {displayMessages.length === 0 && !sendMsg.isPending && !createConv.isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 sm:p-8 overflow-y-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center seraphim-glow">
                <CurrentModeIcon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">{currentMode.label}</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">Seraphim</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{currentMode.desc}</p>
              </div>
            </div>

            <div className="w-full max-w-2xl">
              {variant === "page" && (
              <button
                type="button"
                onClick={() => setShowModePanel(!showModePanel)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto mb-3"
              >
                <span>All Modes</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", showModePanel && "rotate-180")} />
              </button>
              )}
              {showModePanel && variant === "page" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {MODES.map((mode) => {
                    const Icon = getModeIcon(mode.icon);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveMode(mode.id)}
                        className={cn(
                          "nsa-card px-3 py-2.5 text-left transition-all",
                          activeMode === mode.id
                            ? "border-primary/40 bg-primary/5"
                            : "hover:border-primary/20",
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              activeMode === mode.id ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              activeMode === mode.id ? "text-primary" : "text-foreground",
                            )}
                          >
                            {mode.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="nsa-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="flex flex-col space-y-4 p-4 sm:p-6 max-w-4xl mx-auto">
                {displayMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 shrink-0 mt-1 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2.5 sm:px-4 sm:py-3",
                        msg.role === "user"
                          ? "bg-primary/15 border border-primary/25 text-foreground"
                          : "nsa-card text-foreground",
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 shrink-0 mt-1 rounded-lg bg-primary/15 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {sendMsg.isPending && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 mt-1 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="nsa-card px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {activeMode === "eiram" ? "Running EiRAM pipeline..." : "Processing..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 shrink-0">
            <p className="text-xs text-destructive max-w-4xl mx-auto">{error}</p>
          </div>
        )}

        <div className="border-t border-border/50 p-3 sm:p-4 bg-muted/20 shrink-0">
          <div className="max-w-4xl mx-auto w-full">
            {attachment && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                {attachment.preview ? (
                  <img src={attachment.preview} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs text-foreground flex-1 truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    setAttachmentData(null);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
            />
            <div className="flex gap-2 items-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-[42px] w-[42px] rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFile.isPending}
                  >
                    {uploadFile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
              <div className="flex-1 relative min-w-0">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message Seraphim (${currentMode.label})...`}
                  className="flex-1 max-h-32 resize-none min-h-[42px] rounded-lg bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 pr-10"
                  rows={1}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleSend()}
                size="icon"
                disabled={(!input.trim() && !attachment) || sendMsg.isPending}
                className="shrink-0 h-[42px] w-[42px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
                  "bg-primary/10 text-primary border border-primary/20",
                )}
              >
                <CurrentModeIcon className="h-2.5 w-2.5" />
                {currentMode.label}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">Shift+Enter newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
