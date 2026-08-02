import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Search, Terminal, BookOpen, Calculator, Shield, FileText,
  GraduationCap, Wrench, ChevronRight, ChevronDown, Copy,
  CheckCircle2, XCircle, AlertTriangle, Globe, Cpu, Wifi,
  ArrowRight, RotateCcw, Download, Play, Loader2
} from "lucide-react";

type SubTab = "troubleshoot" | "labs" | "subnet" | "commands" | "ports" | "quiz" | "design" | "docs";

export default function NetworkIntelPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("troubleshoot");

  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: "troubleshoot", label: "Troubleshoot", icon: <Wrench className="w-4 h-4" /> },
    { id: "labs", label: "Labs", icon: <BookOpen className="w-4 h-4" /> },
    { id: "subnet", label: "Subnet Calc", icon: <Calculator className="w-4 h-4" /> },
    { id: "commands", label: "Commands", icon: <Terminal className="w-4 h-4" /> },
    { id: "ports", label: "Ports", icon: <Globe className="w-4 h-4" /> },
    { id: "quiz", label: "Quiz", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "design", label: "Design", icon: <Cpu className="w-4 h-4" /> },
    { id: "docs", label: "Docs", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-[#0c1222] overflow-x-auto shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "troubleshoot" && <TroubleshootTab />}
        {activeTab === "labs" && <LabsTab />}
        {activeTab === "subnet" && <SubnetTab />}
        {activeTab === "commands" && <CommandsTab />}
        {activeTab === "ports" && <PortsTab />}
        {activeTab === "quiz" && <QuizTab />}
        {activeTab === "design" && <DesignTab />}
        {activeTab === "docs" && <DocsTab />}
      </div>
    </div>
  );
}

// ── Troubleshoot Tab ──
function TroubleshootTab() {
  const [problem, setProblem] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const troubleshoot = trpc.netIntel.troubleshoot.useMutation({
    onSuccess: (data) => setResult(data.analysis),
    onError: (e) => toast.error(e.message),
  });

  const presets = [
    "Host cannot reach the internet but can ping the default gateway",
    "Two VLANs cannot communicate despite router-on-a-stick configuration",
    "OSPF neighbors not forming adjacency between two routers",
    "Intermittent packet loss on a trunk link between switches",
    "DNS resolution fails but IP connectivity works fine",
    "New host gets 169.254.x.x address instead of DHCP lease",
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">OSI Troubleshooting Engine</h2>
        <p className="text-xs text-gray-500">Describe a network problem and Seraphim will analyze it layer-by-layer using the OSI model.</p>
      </div>

      {/* Preset problems */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button key={i} onClick={() => setProblem(p)}
            className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-teal-500/10 hover:text-teal-400 border border-white/5 hover:border-teal-500/20 transition-all">
            {p.length > 50 ? p.slice(0, 50) + "..." : p}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          placeholder="Describe the network problem..."
          rows={3}
          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-teal-500/50 focus:outline-none resize-none"
        />
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Additional context (topology, devices, recent changes)... (optional)"
          rows={2}
          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-teal-500/50 focus:outline-none resize-none"
        />
        <button
          onClick={() => troubleshoot.mutate({ problem, context: context || undefined })}
          disabled={!problem.trim() || troubleshoot.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          {troubleshoot.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {troubleshoot.isPending ? "Analyzing..." : "Analyze Problem"}
        </button>
      </div>

      {result && (
        <div className="bg-[#0a0e1a] border border-teal-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Troubleshooting Report</span>
            <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}
              className="text-gray-500 hover:text-teal-400"><Copy className="w-4 h-4" /></button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <Streamdown>{result}</Streamdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Labs Tab ──
function LabsTab() {
  const { data: labs } = trpc.netIntel.labs.useQuery(undefined);
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { data: labDetail } = trpc.netIntel.labDetail.useQuery(
    { id: selectedLab! },
    { enabled: !!selectedLab }
  );

  const categories = useMemo(() => {
    if (!labs) return [];
    const cats = Array.from(new Set((labs as any[]).map(l => l.category)));
    return cats;
  }, [labs]);

  const filtered = useMemo(() => {
    if (!labs) return [];
    if (categoryFilter === "all") return labs as any[];
    return (labs as any[]).filter(l => l.category === categoryFilter);
  }, [labs, categoryFilter]);

  if (selectedLab && labDetail) {
    const lab = labDetail as any;
    return (
      <div className="space-y-4 max-w-4xl">
        <button onClick={() => setSelectedLab(null)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Back to Labs
        </button>
        <div className="bg-[#0a0e1a] border border-teal-500/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              lab.difficulty === "Beginner" ? "bg-green-500/20 text-green-400" :
              lab.difficulty === "Intermediate" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>{lab.difficulty}</span>
            <span className="text-xs text-gray-500">{lab.category}</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-3">{lab.title}</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">Objectives</h3>
              <ul className="space-y-1">
                {lab.objectives.map((o: string, i: number) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">Topology</h3>
              <p className="text-sm text-gray-300 bg-black/30 rounded px-3 py-2 border border-white/5">{lab.topology}</p>
            </div>

            {lab.keyCommands.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">Key Commands</h3>
                <div className="flex flex-wrap gap-2">
                  {lab.keyCommands.map((c: string, i: number) => (
                    <code key={i} className="text-xs bg-black/40 text-teal-300 px-2 py-1 rounded border border-white/5">{c}</code>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-2">Quiz Questions</h3>
              <div className="space-y-3">
                {lab.quizQuestions.map((q: any, i: number) => (
                  <QuizCard key={i} question={q.question} answer={q.answer} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Lab Registry</h2>
        <p className="text-xs text-gray-500">28 CMIT 265 labs with objectives, topology, commands, and quiz questions.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoryFilter("all")}
          className={`text-xs px-3 py-1 rounded-full ${categoryFilter === "all" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5"}`}>
          All ({labs?.length || 0})
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`text-xs px-3 py-1 rounded-full ${categoryFilter === c ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {filtered.map((lab: any) => (
          <button key={lab.id} onClick={() => setSelectedLab(lab.id)}
            className="flex items-center gap-3 p-3 bg-[#0a0e1a] border border-white/5 rounded-lg hover:border-teal-500/30 transition-all text-left group">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              lab.difficulty === "Beginner" ? "bg-green-400" :
              lab.difficulty === "Intermediate" ? "bg-yellow-400" : "bg-red-400"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-200 group-hover:text-white truncate">{lab.title}</div>
              <div className="text-[10px] text-gray-500">{lab.category} · {lab.difficulty} · {lab.objectives.length} objectives</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-teal-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizCard({ question, answer }: { question: string; answer: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
      <p className="text-sm text-gray-200 mb-2 font-medium">{question}</p>
      {revealed ? (
        <p className="text-sm text-teal-300 bg-teal-500/5 rounded px-2 py-1 border border-teal-500/10">{answer}</p>
      ) : (
        <button onClick={() => setRevealed(true)} className="text-xs text-teal-400 hover:text-teal-300">
          Reveal Answer →
        </button>
      )}
    </div>
  );
}

// ── Subnet Calculator Tab ──
function SubnetTab() {
  const [ip, setIp] = useState("192.168.1.0");
  const [cidr, setCidr] = useState(24);
  const { data: result } = trpc.netIntel.subnet.useQuery({ ip, cidr }, {
    enabled: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip),
  });

  const r = result as any;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">IPv4 Subnet Calculator</h2>
        <p className="text-xs text-gray-500">Calculate network details from any IP/CIDR combination with binary breakdown.</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={ip}
          onChange={e => setIp(e.target.value)}
          placeholder="192.168.1.0"
          className="bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 w-48 focus:border-teal-500/50 focus:outline-none font-mono"
        />
        <span className="text-gray-500 text-lg">/</span>
        <input
          type="number"
          value={cidr}
          onChange={e => setCidr(Math.max(0, Math.min(32, parseInt(e.target.value) || 0)))}
          min={0}
          max={32}
          className="bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 w-20 focus:border-teal-500/50 focus:outline-none font-mono"
        />
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap">
        {[8, 16, 20, 24, 25, 26, 27, 28, 30, 32].map(c => (
          <button key={c} onClick={() => setCidr(c)}
            className={`text-xs px-2 py-1 rounded font-mono ${cidr === c ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"}`}>
            /{c}
          </button>
        ))}
      </div>

      {r && !r.error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#0a0e1a] border border-white/5 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-3">Network Details</h3>
            <Row label="Network Address" value={r.networkAddress} />
            <Row label="Broadcast Address" value={r.broadcastAddress} />
            <Row label="Subnet Mask" value={r.subnetMask} />
            <Row label="Wildcard Mask" value={r.wildcardMask} />
            <Row label="First Usable Host" value={r.firstUsableHost} />
            <Row label="Last Usable Host" value={r.lastUsableHost} />
            <Row label="Total Usable Hosts" value={r.totalUsableHosts.toLocaleString()} />
            <Row label="IP Class" value={`Class ${r.ipClass}`} />
            <Row label="Private" value={r.isPrivate ? "Yes" : "No"} />
          </div>

          <div className="bg-[#0a0e1a] border border-white/5 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-medium text-teal-400 uppercase tracking-wider mb-3">Binary Breakdown</h3>
            <BinaryRow label="IP Address" value={r.binary.ip} cidr={cidr} />
            <BinaryRow label="Subnet Mask" value={r.binary.mask} cidr={cidr} />
            <BinaryRow label="Network" value={r.binary.network} cidr={cidr} />
            <BinaryRow label="Broadcast" value={r.binary.broadcast} cidr={cidr} />
          </div>
        </div>
      )}

      {r?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{r.error}</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-200 font-mono">{value}</span>
    </div>
  );
}

function BinaryRow({ label, value, cidr }: { label: string; value: string; cidr: number }) {
  // Color the network portion vs host portion
  const raw = value.replace(/\./g, "");
  const network = raw.slice(0, cidr);
  const host = raw.slice(cidr);

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      <div className="font-mono text-xs break-all">
        <span className="text-teal-400">{network}</span>
        <span className="text-gray-500">{host}</span>
      </div>
    </div>
  );
}

// ── Commands Tab ──
function CommandsTab() {
  const { data: commands } = trpc.netIntel.commands.useQuery(undefined);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!commands) return [];
    let list = commands as any[];
    if (platformFilter !== "all") list = list.filter(c => c.platform === platformFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.command.toLowerCase().includes(q) || c.purpose.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    return list;
  }, [commands, platformFilter, searchQuery]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Command Library</h2>
        <p className="text-xs text-gray-500">28 essential networking commands across Windows, Linux, and Cisco IOS.</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1">
          {["all", "Windows", "Linux", "Cisco"].map(p => (
            <button key={p} onClick={() => setPlatformFilter(p)}
              className={`text-xs px-3 py-1 rounded-full ${platformFilter === p ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5"}`}>
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search commands..."
          className="bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 w-48 focus:border-teal-500/50 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        {filtered.map((cmd: any, i: number) => (
          <div key={i} className="bg-[#0a0e1a] border border-white/5 rounded-lg overflow-hidden">
            <button onClick={() => setExpanded(expanded === cmd.command ? null : cmd.command)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-all">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                cmd.platform === "Windows" ? "bg-blue-500/20 text-blue-400" :
                cmd.platform === "Linux" ? "bg-orange-500/20 text-orange-400" :
                "bg-cyan-500/20 text-cyan-400"
              }`}>{cmd.platform}</span>
              <code className="text-sm text-teal-300 font-mono">{cmd.command}</code>
              <span className="text-xs text-gray-500 flex-1 truncate">{cmd.purpose}</span>
              {expanded === cmd.command ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>

            {expanded === cmd.command && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Syntax</span>
                  <pre className="text-xs text-gray-300 bg-black/30 rounded px-2 py-1 mt-1 font-mono whitespace-pre-wrap">{cmd.syntax}</pre>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-green-400 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Good Output</span>
                    <pre className="text-[11px] text-green-300/80 bg-green-500/5 rounded px-2 py-1 mt-1 font-mono whitespace-pre-wrap border border-green-500/10">{cmd.goodOutput}</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-red-400 uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /> Bad Output</span>
                    <pre className="text-[11px] text-red-300/80 bg-red-500/5 rounded px-2 py-1 mt-1 font-mono whitespace-pre-wrap border border-red-500/10">{cmd.badOutput}</pre>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-yellow-400 uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Tips</span>
                  <p className="text-xs text-gray-400 mt-1">{cmd.tips}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ports Tab ──
function PortsTab() {
  const { data: ports } = trpc.netIntel.ports.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!ports) return [];
    if (!searchQuery) return ports as unknown as any[];
    const q = searchQuery.toLowerCase();
    return (ports as unknown as any[]).filter(p =>
      p.protocol.toLowerCase().includes(q) ||
      p.port.toString().includes(q) ||
      p.purpose.toLowerCase().includes(q)
    );
  }, [ports, searchQuery]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Port Database</h2>
        <p className="text-xs text-gray-500">26 essential network ports with security concerns and troubleshooting commands.</p>
      </div>

      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search by port number, protocol, or purpose..."
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-teal-500/50 focus:outline-none"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Port</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Protocol</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Transport</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Purpose</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Security</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 px-2 font-mono text-teal-400 font-bold">{p.port}</td>
                <td className="py-2 px-2 text-gray-200">{p.protocol}</td>
                <td className="py-2 px-2 text-gray-400">{p.transport}</td>
                <td className="py-2 px-2 text-gray-300 max-w-xs">{p.purpose}</td>
                <td className="py-2 px-2 text-yellow-400/80 max-w-xs text-[11px]">{p.securityConcern}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quiz Tab ──
function QuizTab() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const generate = trpc.netIntel.quiz.useMutation({
    onSuccess: (data) => {
      setQuestions(data.questions);
      setAnswers({});
      setShowResults(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const presetTopics = ["Subnetting & CIDR", "VLANs & Trunking", "OSPF Routing", "ACLs & Firewall Rules", "TCP/IP Fundamentals", "STP & EtherChannel", "NAT & PAT", "IPv6 Addressing", "Network Security", "DNS & DHCP"];

  const score = useMemo(() => {
    if (!showResults) return 0;
    return questions.filter((q, i) => answers[i] === q.correct).length;
  }, [showResults, questions, answers]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Exam Prep Quiz Generator</h2>
        <p className="text-xs text-gray-500">Generate multiple-choice questions on any CMIT 265 topic.</p>
      </div>

      {questions.length === 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presetTopics.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className={`text-xs px-3 py-1 rounded-full ${topic === t ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic..."
                className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-teal-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Questions</label>
              <input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-20 bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-teal-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                className="bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-teal-500/50 focus:outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <button onClick={() => generate.mutate({ topic, count, difficulty })}
              disabled={!topic.trim() || generate.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium">
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{topic} — {difficulty}</span>
            <div className="flex gap-2">
              {!showResults && (
                <button onClick={() => setShowResults(true)}
                  className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-500">
                  Submit Answers
                </button>
              )}
              <button onClick={() => { setQuestions([]); setAnswers({}); setShowResults(false); }}
                className="text-xs px-3 py-1 bg-white/5 text-gray-400 rounded hover:bg-white/10">
                New Quiz
              </button>
            </div>
          </div>

          {showResults && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              score >= questions.length * 0.8 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
              score >= questions.length * 0.6 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
              "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              Score: {score}/{questions.length} ({Math.round(score / questions.length * 100)}%)
            </div>
          )}

          {questions.map((q: any, i: number) => (
            <div key={i} className="bg-[#0a0e1a] border border-white/5 rounded-lg p-4">
              <p className="text-sm text-gray-200 font-medium mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt: string, j: number) => {
                  const letter = String.fromCharCode(65 + j);
                  const isSelected = answers[i] === letter;
                  const isCorrect = showResults && letter === q.correct;
                  const isWrong = showResults && isSelected && letter !== q.correct;

                  return (
                    <button key={j}
                      onClick={() => !showResults && setAnswers({ ...answers, [i]: letter })}
                      disabled={showResults}
                      className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${
                        isCorrect ? "bg-green-500/10 border border-green-500/30 text-green-400" :
                        isWrong ? "bg-red-500/10 border border-red-500/30 text-red-400" :
                        isSelected ? "bg-teal-500/10 border border-teal-500/30 text-teal-400" :
                        "bg-black/20 border border-white/5 text-gray-300 hover:bg-white/5"
                      }`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showResults && q.explanation && (
                <p className="text-xs text-gray-400 mt-2 bg-white/5 rounded px-2 py-1">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Design Tab ──
function DesignTab() {
  const [requirements, setRequirements] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const design = trpc.netIntel.design.useMutation({
    onSuccess: (data) => setResult(data.design),
    onError: (e) => toast.error(e.message),
  });

  const presets = [
    "Small office with 3 departments (Sales, Engineering, Management), 50 users total, needs internet access and inter-department communication with security",
    "Branch office connecting to HQ via VPN, 2 VLANs, OSPF routing, with DMZ for web server",
    "University campus with 4 buildings, wireless in each, centralized data center, 500 users",
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Network Design Engine</h2>
        <p className="text-xs text-gray-500">Describe your requirements and Seraphim will generate a complete network design with IP scheme, VLANs, routing, and security.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button key={i} onClick={() => setRequirements(p)}
            className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-teal-500/10 hover:text-teal-400 border border-white/5 hover:border-teal-500/20 transition-all text-left">
            {p.slice(0, 60)}...
          </button>
        ))}
      </div>

      <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
        placeholder="Describe your network requirements (number of users, departments, services needed, security requirements)..."
        rows={4}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-teal-500/50 focus:outline-none resize-none" />

      <button onClick={() => design.mutate({ requirements })}
        disabled={!requirements.trim() || design.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium">
        {design.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
        {design.isPending ? "Designing..." : "Generate Design"}
      </button>

      {result && (
        <div className="bg-[#0a0e1a] border border-teal-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Network Design Document</span>
            <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}
              className="text-gray-500 hover:text-teal-400"><Copy className="w-4 h-4" /></button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <Streamdown>{result}</Streamdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Docs Tab ──
function DocsTab() {
  const [docType, setDocType] = useState<"ip_table" | "vlan_table" | "firewall_rules" | "topology_notes" | "change_log">("ip_table");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const generateDocs = trpc.netIntel.generateDocs.useMutation({
    onSuccess: (data) => setResult(data.document),
    onError: (e) => toast.error(e.message),
  });

  const docTypes = [
    { id: "ip_table" as const, label: "IP Address Table", placeholder: "Describe the network: 3 subnets, 192.168.0.0/16, departments: Sales, Engineering, Management" },
    { id: "vlan_table" as const, label: "VLAN Table", placeholder: "Describe VLANs: VLAN 10 Sales, VLAN 20 Engineering, VLAN 30 Management, VLAN 99 Native" },
    { id: "firewall_rules" as const, label: "Firewall Rules", placeholder: "Describe policy: Allow HTTP/HTTPS outbound, allow SSH from management VLAN only, block all inbound except established" },
    { id: "topology_notes" as const, label: "Topology Notes", placeholder: "Describe topology: 2 core switches, 4 access switches, 1 router, 1 firewall, 3 servers in DMZ" },
    { id: "change_log" as const, label: "Change Log", placeholder: "Describe change: Adding VLAN 40 for IoT devices, updating ACLs on core switch, scheduled for Friday maintenance window" },
  ];

  const current = docTypes.find(d => d.id === docType)!;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-teal-400 mb-1">Documentation Generator</h2>
        <p className="text-xs text-gray-500">Generate professional network documentation from descriptions.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {docTypes.map(d => (
          <button key={d.id} onClick={() => { setDocType(d.id); setResult(null); }}
            className={`text-xs px-3 py-1 rounded-full ${docType === d.id ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-gray-400 border border-white/5"}`}>
            {d.label}
          </button>
        ))}
      </div>

      <textarea value={context} onChange={e => setContext(e.target.value)}
        placeholder={current.placeholder}
        rows={4}
        className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-teal-500/50 focus:outline-none resize-none" />

      <button onClick={() => generateDocs.mutate({ docType, context })}
        disabled={!context.trim() || generateDocs.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium">
        {generateDocs.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {generateDocs.isPending ? "Generating..." : `Generate ${current.label}`}
      </button>

      {result && (
        <div className="bg-[#0a0e1a] border border-teal-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">{current.label}</span>
            <div className="flex gap-2">
              <button onClick={() => {
                const blob = new Blob([result], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${docType}.md`; a.click();
                URL.revokeObjectURL(url);
                toast.success("Downloaded");
              }} className="text-gray-500 hover:text-teal-400"><Download className="w-4 h-4" /></button>
              <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}
                className="text-gray-500 hover:text-teal-400"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <Streamdown>{result}</Streamdown>
          </div>
        </div>
      )}
    </div>
  );
}
