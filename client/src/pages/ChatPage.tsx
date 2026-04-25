import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles, Plus, Trash2, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant" | "system"; content: string };

export default function ChatPage() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        sendMsg.mutate({ conversationId: data.id, content: msg });
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
      setLocalMessages(prev => [...prev, { role: data.role, content: data.content }]);
      msgQuery.refetch();
      setError(null);
    },
    onError: (err) => setError(`Seraphim encountered an error: ${err.message}`),
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

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }));
    }
  };

  useEffect(() => { scrollToBottom(); }, [localMessages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMsg.isPending || createConv.isPending) return;
    setError(null);
    setInput("");
    textareaRef.current?.focus();
    if (!activeConvId) {
      setPendingMessage(trimmed);
      setLocalMessages([{ role: "user", content: trimmed }]);
      createConv.mutate({ title: trimmed.substring(0, 60) });
      return;
    }
    setLocalMessages(prev => [...prev, { role: "user", content: trimmed }]);
    sendMsg.mutate({ conversationId: activeConvId, content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayMessages = localMessages.filter(m => m.role !== "system");

  const suggestedPrompts = useMemo(() => [
    "Run a network security scan",
    "Write a Python function to parse JSON",
    "Analyze this text for ideological signals",
    "Convert 14.7 psi to kPa",
  ], []);

  return (
    <div className="flex h-full">
      {/* Conversation Sidebar */}
      <div className="w-60 border-r border-border/50 bg-muted/20 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b border-border/50">
          <Button
            onClick={() => createConv.mutate({ title: "New Conversation" })}
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
            disabled={createConv.isPending}
          >
            <Plus className="h-3.5 w-3.5" /> New Thread
          </Button>
        </div>
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
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {displayMessages.length === 0 && !sendMsg.isPending && !createConv.isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center seraphim-glow">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">AI Assistant</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Seraphim</h2>
                <p className="text-sm text-muted-foreground mt-1">How can I assist you, Operator?</p>
              </div>
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
                    <div className="nsa-card px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
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

        {/* Input */}
        <div className="border-t border-border/50 p-4 bg-muted/20">
          <div className="max-w-4xl mx-auto flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Seraphim..."
              className="flex-1 max-h-32 resize-none min-h-[42px] rounded-lg bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50"
              rows={1}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || sendMsg.isPending}
              className="shrink-0 h-[42px] w-[42px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
