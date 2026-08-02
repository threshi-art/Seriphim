import { trpc } from "@/lib/trpc";
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
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";
import { MODES } from "../../../shared/modes";
import type { SeraphimMode } from "../../../shared/modes";

type Message = { role: "user" | "assistant" | "system"; content: string; mode?: string };

const ICON_MAP: Record<string, typeof Brain> = {
  MessageSquare, Brain, Scale, Cpu, Globe, Users, Pen, Flame,
  BookOpen, FileText, ShieldAlert, LayoutDashboard,
};

function getModeIcon(iconName: string) {
  return ICON_MAP[iconName] || MessageSquare;
}

export default function ChatPage() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<SeraphimMode>("standard");
  const [showModePanel, setShowModePanel] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string; preview: string } | null>(null);
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = trpc.chatSearch.search.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length >= 2 }
  );

  const convQuery = trpc.chat.conversations.useQuery();
  const msgQuery = trpc.chat.messages.useQuery(
    { conversationId: activeConvId! },
    { enabled: !!activeConvId }
  );
  const createConv = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setActiveConvId(data.id);
      setLocalMessages([]);
      convQuery.refetch();
      if (pendingMessage) {
        const msg = pendingMessage;
        setPendingMessage(null);
        setLocalMessages([{ role: "user", content: msg }]);
        sendMsg.mutate({ conversationId: data.id, content: msg, mode: activeMode });
      }
    },
    onError: (err) => setError(`Failed to create conversation: ${err.message}`),
  });
  const deleteConv = trpc.chat.delete.useMutation({
    onSuccess: () => {
      if (convQuery.data && convQuery.data.length > 1) {
        convQuery.refetch();
      } else {
        setActiveConvId(null);
        setLocalMessages([]);
        convQuery.refetch();
      }
    },
  });
  const sendMsg = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setLocalMessages(prev => [...prev, { role: data.role, content: data.content, mode: data.mode }]);
      msgQuery.refetch();
      setError(null);
    },
    onError: (err) => setError(`Seraphim encountered an error: ${err.message}`),
  });
  const uploadFile = trpc.files.upload.useMutation({
    onError: (err) => setError(`File upload failed: ${err.message}`),
  });

  useEffect(() => {
    if (msgQuery.data) {
      setLocalMessages(msgQuery.data.map(m => ({ role: m.role as Message["role"], content: m.content })));
    }
  }, [msgQuery.data]);

  useEffect(() => {
    if (!activeConvId && convQuery.data && convQuery.data.length > 0) {
      setActiveConvId(convQuery.data[0].id);
    }
  }, [convQuery.data, activeConvId]);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }));
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [localMessages, scrollToBottom]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      setError("File too large. Maximum size is 16MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAttachmentData(base64);
      setAttachment({ name: file.name, type: file.type, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachment) || sendMsg.isPending || createConv.isPending) return;
    setError(null);

    let messageContent = trimmed;

    // If there's an attachment, upload it and prepend info to message
    if (attachment && attachmentData) {
      try {
        const uploaded = await uploadFile.mutateAsync({
          filename: attachment.name,
          contentType: attachment.type,
          base64Data: attachmentData,
        });
        const fileInfo = `[Attached file: ${attachment.name} (${(uploaded.size / 1024).toFixed(1)}KB)]`;
        messageContent = messageContent ? `${fileInfo}\n\n${messageContent}` : fileInfo;
      } catch {
        // Error handled by mutation onError
        return;
      }
      setAttachment(null);
      setAttachmentData(null);
    }

    if (!messageContent) return;
    setInput("");
    textareaRef.current?.focus();

    if (!activeConvId) {
      setPendingMessage(messageContent);
      setLocalMessages([{ role: "user", content: messageContent }]);
      createConv.mutate({ title: messageContent.substring(0, 60) });
      return;
    }
    setLocalMessages(prev => [...prev, { role: "user", content: messageContent }]);
    sendMsg.mutate({ conversationId: activeConvId, content: messageContent, mode: activeMode });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = () => {
    const text = localMessages
      .filter(m => m.role !== "system")
      .map(m => `## ${m.role === "user" ? "Chris (Operator)" : "Seraphim"}\n\n${m.content}`)
      .join("\n\n---\n\n");
    const header = `# Seraphim Intelligence Report\n**Mode:** ${MODES.find(m => m.id === activeMode)?.label || "Standard"}\n**Date:** ${new Date().toISOString().split("T")[0]}\n**Classification:** OPERATOR EYES ONLY\n\n---\n\n`;
    const blob = new Blob([header + text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seraphim-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayMessages = localMessages.filter(m => m.role !== "system");
  const currentMode = MODES.find(m => m.id === activeMode)!;
  const CurrentModeIcon = getModeIcon(currentMode.icon);

  const suggestedPrompts = useMemo(() => {
    const promptsByMode: Record<string, string[]> = {
      standard: [
        "What are the second-order effects of AI regulation?",
        "Help me think through a career decision",
        "Analyze the strategic implications of this situation",
        "Write a concise executive summary of this topic",
      ],
      eiram: [
        "Run EiRAM analysis on this Reddit thread",
        "Analyze this political speech for ideological signals",
        "Assess this person's behavioral patterns from their posts",
        "Generate a full EiRAM dashboard on this subject",
      ],
      legal: [
        "Analyze this contract clause using IRAC",
        "What are the potential claims and defenses here?",
        "Draft a legal memorandum on this issue",
        "Identify the jurisdictional considerations",
      ],
      technical: [
        "Review this system architecture for vulnerabilities",
        "Design a microservices architecture for this use case",
        "Analyze the dependencies and failure modes",
        "What are the implementation risks?",
      ],
    };
    return promptsByMode[activeMode] || promptsByMode.standard;
  }, [activeMode]);

  return (
    <div className="flex h-full">
      {/* Conversation Sidebar */}
      <div className="w-60 border-r border-border/50 bg-muted/20 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b border-border/50 space-y-2">
          <div className="flex gap-1.5">
            <Button
              onClick={() => createConv.mutate({ title: "New Conversation" })}
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
              disabled={createConv.isPending}
            >
              <Plus className="h-3.5 w-3.5" /> New Thread
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
              onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }}
            >
              {showSearch ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Search Results */}
        {showSearch && debouncedSearch.length >= 2 ? (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {searchResults.isLoading && (
                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </div>
              )}
              {searchResults.isError && (
                <div className="p-3 text-xs text-destructive text-center">Search failed. Try again.</div>
              )}
              {searchResults.data && searchResults.data.length === 0 && (
                <div className="p-3 text-xs text-muted-foreground text-center">No results found</div>
              )}
              {searchResults.data?.map((result, i) => (
                <button
                  key={`${result.messageId}-${i}`}
                  onClick={() => { setActiveConvId(result.conversationId); setShowSearch(false); setSearchQuery(""); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-border/30"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] font-medium text-primary truncate">{result.conversationTitle}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{result.content.substring(0, 120)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground/60">{result.role}</span>
                    <span className="text-[9px] text-muted-foreground/60">{new Date(result.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {convQuery.data?.map(conv => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-all",
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <div className={cn("w-1 h-1 rounded-full shrink-0", activeConvId === conv.id ? "bg-primary" : "bg-transparent")} />
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConv.mutate({ id: conv.id }); }}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Bar */}
        <div className="border-b border-border/50 bg-muted/10 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <CurrentModeIcon className="h-4 w-4 text-primary" />
              <Select value={activeMode} onValueChange={(v) => setActiveMode(v as SeraphimMode)}>
                <SelectTrigger className="w-[220px] h-8 text-xs bg-card/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map(mode => {
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
            <span className="text-[11px] text-muted-foreground hidden lg:inline">{currentMode.desc}</span>
          </div>
          <div className="flex items-center gap-1">
            {displayMessages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleExport}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as Markdown</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {displayMessages.length === 0 && !sendMsg.isPending && !createConv.isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center seraphim-glow">
                <CurrentModeIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">{currentMode.label}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Seraphim</h2>
                <p className="text-sm text-muted-foreground mt-1">{currentMode.desc}</p>
              </div>
            </div>

            {/* Mode Grid (collapsed by default) */}
            <div className="w-full max-w-3xl">
              <button
                onClick={() => setShowModePanel(!showModePanel)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto mb-3"
              >
                <span>All Modes</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", showModePanel && "rotate-180")} />
              </button>
              {showModePanel && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                  {MODES.map(mode => {
                    const Icon = getModeIcon(mode.icon);
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        className={cn(
                          "nsa-card px-3 py-2.5 text-left transition-all",
                          activeMode === mode.id
                            ? "border-primary/40 bg-primary/5"
                            : "hover:border-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("h-3.5 w-3.5", activeMode === mode.id ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", activeMode === mode.id ? "text-primary" : "text-foreground")}>{mode.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="nsa-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col space-y-4 p-6 max-w-4xl mx-auto">
                {displayMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 shrink-0 mt-1 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-primary/15 border border-primary/25 text-foreground"
                        : "nsa-card text-foreground"
                    )}>
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
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-xs text-destructive max-w-4xl mx-auto">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border/50 p-4 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {attachment && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                {attachment.preview ? (
                  <img src={attachment.preview} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs text-foreground flex-1 truncate">{attachment.name}</span>
                <button
                  onClick={() => { setAttachment(null); setAttachmentData(null); }}
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
                    {uploadFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
              <div className="flex-1 relative">
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
                onClick={handleSend}
                size="icon"
                disabled={(!input.trim() && !attachment) || sendMsg.isPending}
                className="shrink-0 h-[42px] w-[42px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
                  "bg-primary/10 text-primary border border-primary/20"
                )}>
                  <CurrentModeIcon className="h-2.5 w-2.5" />
                  {currentMode.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
