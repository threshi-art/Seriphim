import { trpc } from "@/lib/trpc";
import { MODES, type SeraphimMode } from "@shared/modes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string; mode?: string };

export type ChatSessionContextValue = {
  activeConvId: number | null;
  setActiveConvId: (id: number | null) => void;
  localMessages: ChatMessage[];
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: (v: string) => void;
  pendingMessage: string | null;
  setPendingMessage: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
  activeMode: SeraphimMode;
  setActiveMode: (m: SeraphimMode) => void;
  showModePanel: boolean;
  setShowModePanel: (v: boolean) => void;
  attachment: { name: string; type: string; preview: string } | null;
  setAttachment: (v: { name: string; type: string; preview: string } | null) => void;
  attachmentData: string | null;
  setAttachmentData: (v: string | null) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  debouncedSearch: string;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  searchResults: ReturnType<typeof trpc.chatSearch.search.useQuery>;
  convQuery: ReturnType<typeof trpc.chat.conversations.useQuery>;
  msgQuery: ReturnType<typeof trpc.chat.messages.useQuery>;
  createConv: ReturnType<typeof trpc.chat.create.useMutation>;
  deleteConv: ReturnType<typeof trpc.chat.delete.useMutation>;
  sendMsg: ReturnType<typeof trpc.chat.send.useMutation>;
  uploadFile: ReturnType<typeof trpc.files.upload.useMutation>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSend: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleExport: () => void;
  scrollToBottom: () => void;
  suggestedPrompts: string[];
  sidePanelOpen: boolean;
  setSidePanelOpen: (v: boolean) => void;
  toggleSidePanel: () => void;
};

const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

function useChatSessionState(): ChatSessionContextValue {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
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
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const toggleSidePanel = useCallback(() => {
    setSidePanelOpen((o) => !o);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = trpc.chatSearch.search.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length >= 2 },
  );

  const convQuery = trpc.chat.conversations.useQuery();
  const msgQuery = trpc.chat.messages.useQuery(
    { conversationId: activeConvId! },
    { enabled: !!activeConvId },
  );

  const sendMsg = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setLocalMessages((prev) => [...prev, { role: data.role, content: data.content, mode: data.mode }]);
      void msgQuery.refetch();
      setError(null);
    },
    onError: (err) => setError(`Seraphim encountered an error: ${err.message}`),
  });

  const createConv = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setActiveConvId(data.id);
      setLocalMessages([]);
      void convQuery.refetch();
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
        void convQuery.refetch();
      } else {
        setActiveConvId(null);
        setLocalMessages([]);
        void convQuery.refetch();
      }
    },
  });

  const uploadFile = trpc.files.upload.useMutation({
    onError: (err) => setError(`File upload failed: ${err.message}`),
  });

  useEffect(() => {
    if (msgQuery.data) {
      setLocalMessages(msgQuery.data.map((m) => ({ role: m.role as ChatMessage["role"], content: m.content })));
    }
  }, [msgQuery.data]);

  useEffect(() => {
    if (!activeConvId && convQuery.data && convQuery.data.length > 0) {
      setActiveConvId(convQuery.data[0].id);
    }
  }, [convQuery.data, activeConvId]);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" }));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      setAttachment({
        name: file.name,
        type: file.type,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachment) || sendMsg.isPending || createConv.isPending) return;
    setError(null);

    let messageContent = trimmed;

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
    setLocalMessages((prev) => [...prev, { role: "user", content: messageContent }]);
    sendMsg.mutate({ conversationId: activeConvId, content: messageContent, mode: activeMode });
  }, [
    input,
    attachment,
    attachmentData,
    sendMsg.isPending,
    createConv.isPending,
    uploadFile,
    activeConvId,
    activeMode,
    createConv,
    sendMsg,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

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

  const handleExport = useCallback(() => {
    const text = localMessages
      .filter((m) => m.role !== "system")
      .map((m) => `## ${m.role === "user" ? "Chris (Operator)" : "Seraphim"}\n\n${m.content}`)
      .join("\n\n---\n\n");
    const header = `# Seraphim Intelligence Report\n**Mode:** ${MODES.find((m) => m.id === activeMode)?.label || "Standard"}\n**Date:** ${new Date().toISOString().split("T")[0]}\n**Classification:** OPERATOR EYES ONLY\n\n---\n\n`;
    const blob = new Blob([header + text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seraphim-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [localMessages, activeMode]);

  return useMemo(
    (): ChatSessionContextValue => ({
      activeConvId,
      setActiveConvId,
      localMessages,
      setLocalMessages,
      input,
      setInput,
      pendingMessage,
      setPendingMessage,
      error,
      setError,
      activeMode,
      setActiveMode,
      showModePanel,
      setShowModePanel,
      attachment,
      setAttachment,
      attachmentData,
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
      msgQuery,
      createConv,
      deleteConv,
      sendMsg,
      uploadFile,
      handleFileSelect,
      handleSend,
      handleKeyDown,
      handleExport,
      scrollToBottom,
      suggestedPrompts,
      sidePanelOpen,
      setSidePanelOpen,
      toggleSidePanel,
    }),
    [
      activeConvId,
      localMessages,
      input,
      pendingMessage,
      error,
      activeMode,
      showModePanel,
      attachment,
      attachmentData,
      searchQuery,
      debouncedSearch,
      showSearch,
      searchResults,
      convQuery,
      msgQuery,
      createConv,
      deleteConv,
      sendMsg,
      uploadFile,
      handleFileSelect,
      handleSend,
      handleKeyDown,
      handleExport,
      scrollToBottom,
      suggestedPrompts,
      sidePanelOpen,
      toggleSidePanel,
    ],
  );
}

export function ChatSessionProvider({ children }: { children: React.ReactNode }) {
  const value = useChatSessionState();
  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
}

export function useChatSession(): ChatSessionContextValue {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) {
    throw new Error("useChatSession must be used within ChatSessionProvider");
  }
  return ctx;
}
