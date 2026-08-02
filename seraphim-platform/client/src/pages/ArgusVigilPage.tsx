import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Database,
  Eye,
  FileUp,
  Filter,
  Globe2,
  HardDrive,
  Info,
  Network,
  Pause,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Square,
  UploadCloud,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type BackendStatus = "checking" | "online" | "offline";

type PacketSummary = {
  number: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
};

type NetworkInterfaceSummary = {
  interface_id: string;
  name: string;
  description?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  status: "up" | "down" | "unknown";
  capture_available: boolean;
};

type CaptureSession = {
  session_id: string;
  status: "created" | "running" | "paused" | "stopped";
  mode: "live" | "pcap";
  store_raw_packets: boolean;
};

const AUTHORIZATION_KEY = "argus-vigil-authorization-acknowledged";
const BACKEND_BASE_URL = "http://127.0.0.1:8765";
const BACKEND_HEALTH_URL = `${BACKEND_BASE_URL}/health`;

function readAuthorizationAcknowledgement() {
  try {
    return localStorage.getItem(AUTHORIZATION_KEY) === "true";
  } catch {
    return false;
  }
}

function writeAuthorizationAcknowledgement() {
  try {
    localStorage.setItem(AUTHORIZATION_KEY, "true");
  } catch {
    // The acknowledgement still applies for this browser session.
  }
}

const packetSummaries: PacketSummary[] = [
  {
    number: 1,
    timestamp: "00:00.042",
    source: "192.168.1.20",
    destination: "8.8.8.8",
    protocol: "DNS",
    length: 92,
    info: "Standard query A example.com",
  },
  {
    number: 2,
    timestamp: "00:00.087",
    source: "8.8.8.8",
    destination: "192.168.1.20",
    protocol: "DNS",
    length: 124,
    info: "Standard query response A 93.184.216.34",
  },
  {
    number: 3,
    timestamp: "00:00.231",
    source: "192.168.1.20",
    destination: "93.184.216.34",
    protocol: "TCP",
    length: 66,
    info: "443 SYN",
  },
  {
    number: 4,
    timestamp: "00:00.289",
    source: "93.184.216.34",
    destination: "192.168.1.20",
    protocol: "TLS",
    length: 517,
    info: "Client Hello metadata, SNI visible",
  },
  {
    number: 5,
    timestamp: "00:01.442",
    source: "192.168.1.20",
    destination: "10.0.0.12",
    protocol: "HTTP",
    length: 434,
    info: "GET /status, sensitive headers redacted",
  },
];

const findings = [
  {
    observation: "Cleartext HTTP traffic detected",
    confidence: "High",
    nextStep: "Confirm whether this endpoint can be moved to HTTPS.",
  },
  {
    observation: "Repeated DNS lookups for one domain",
    confidence: "Medium",
    nextStep: "Compare against expected application behavior.",
  },
  {
    observation: "Long lived TLS connection to external host",
    confidence: "Low",
    nextStep: "Review ownership and business purpose before escalating.",
  },
];

const protocolBreakdown = [
  { name: "TCP", value: 42, color: "bg-blue-400" },
  { name: "DNS", value: 24, color: "bg-violet-400" },
  { name: "TLS", value: 21, color: "bg-cyan-400" },
  { name: "HTTP", value: 8, color: "bg-amber-400" },
  { name: "ARP", value: 5, color: "bg-slate-400" },
];

export default function ArgusVigilPage() {
  const [, setLocation] = useLocation();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [authorizationAccepted, setAuthorizationAccepted] = useState(readAuthorizationAcknowledgement);
  const [selectedPacketNumber, setSelectedPacketNumber] = useState(1);
  const [filterValue, setFilterValue] = useState("protocol equals dns");
  const [searchValue, setSearchValue] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterfaceSummary[]>([]);
  const [activeSession, setActiveSession] = useState<CaptureSession | null>(null);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const visiblePackets = useMemo(
    () => filterPackets(packetSummaries, filterValue, searchValue),
    [filterValue, searchValue],
  );
  const selectedPacket = useMemo(
    () => packetSummaries.find(packet => packet.number === selectedPacketNumber) ?? packetSummaries[0],
    [selectedPacketNumber],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      setBackendStatus("checking");
      try {
        const response = await fetch(BACKEND_HEALTH_URL, {
          signal: controller.signal,
        });
        setBackendStatus(response.ok ? "online" : "offline");
      } catch {
        if (!controller.signal.aborted) {
          setBackendStatus("offline");
        }
      }
    }

    checkBackend();
    const interval = window.setInterval(checkBackend, 15000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const acceptAuthorization = () => {
    writeAuthorizationAcknowledgement();
    setAuthorizationAccepted(true);
  };

  const loadInterfaces = async () => {
    setBackendMessage(null);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/interfaces`);
      if (!response.ok) {
        throw new Error(`Interface query failed with ${response.status}`);
      }
      const data = await response.json() as NetworkInterfaceSummary[];
      setInterfaces(data);
      setBackendMessage(data.length > 0 ? `Loaded ${data.length} interface(s).` : "Backend returned no capture interfaces yet.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load interfaces.");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadedFileName(file?.name ?? null);
    setBackendMessage(null);

    if (!file || backendStatus !== "online") {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${BACKEND_BASE_URL}/pcap/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`PCAP upload failed with ${response.status}`);
      }
      const session = await response.json() as CaptureSession;
      setActiveSession(session);
      setBackendMessage(`Created ${session.mode.toUpperCase()} session ${session.session_id}.`);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to upload PCAP.");
    }
  };

  if (!authorizationAccepted) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center p-6">
          <div className="nsa-card p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Argus Vigil Authorization</p>
                <h1 className="mt-2 text-2xl font-bold text-foreground">Seraphim NetScope Web</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This tool is for analyzing traffic on systems and networks you own, administer, or are explicitly authorized to inspect.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground">
              <p>Do not use this tool to intercept traffic without permission.</p>
              <p>The application does not include offensive capabilities.</p>
              <p>Live capture requires a local backend because a browser cannot directly capture raw packets from a network interface.</p>
            </div>

            <Button onClick={acceptAuthorization} className="mt-5 w-full gap-2 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
              I understand and will use this only for authorized defensive analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Argus Vigil</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Seraphim NetScope Web</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={() => setLocation("/argus-terra")}
          >
            <Globe2 className="h-3.5 w-3.5" />
            Open Argus Terra
          </Button>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
              backendStatus === "online" && "border-green-500/20 bg-green-500/10 text-green-400",
              backendStatus === "offline" && "border-red-500/20 bg-red-500/10 text-red-400",
              backendStatus === "checking" && "border-border/50 bg-muted/20 text-muted-foreground",
            )}
          >
            {backendStatus === "online" ? <Radio className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            Backend status: {backendStatus}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <aside className="hidden border-r border-border/50 bg-muted/5 xl:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Capture Sessions" icon={Activity}>
                <SidebarRow label="Local lab session" meta={activeSession?.mode === "live" ? activeSession.status : "Waiting for backend"} active />
                <SidebarRow label="Uploaded PCAP files" meta={uploadedFileName ?? "No file selected"} />
                {activeSession && <SidebarRow label="Active session" meta={activeSession.session_id} />}
              </Panel>

              <Panel title="Network Interfaces" icon={Network}>
                <SidebarRow label="Interface selection" meta={backendStatus === "online" ? "Ready to query" : "Start backend first"} />
                {interfaces.map(networkInterface => (
                  <SidebarRow
                    key={networkInterface.interface_id}
                    label={networkInterface.name}
                    meta={networkInterface.ip_address ?? networkInterface.description ?? networkInterface.status}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2 text-xs"
                  disabled={backendStatus !== "online"}
                  onClick={loadInterfaces}
                >
                  <Radio className="h-3.5 w-3.5" />
                  Load Interfaces
                </Button>
              </Panel>

              <Panel title="Saved Reports" icon={Database}>
                <SidebarRow label="Markdown report" meta="MVP export target" />
                <SidebarRow label="JSON analysis data" meta="Planned" />
              </Panel>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex min-w-0 flex-col overflow-hidden">
          {backendStatus === "offline" && (
            <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-3 text-sm text-amber-200">
              <span className="font-semibold">Backend offline.</span> Start the local capture backend with{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">python -m uvicorn app.main:app --host 127.0.0.1 --port 8765</code>.
              PCAP upload remains the first supported analysis path.
            </div>
          )}
          {backendMessage && (
            <div className="border-b border-primary/20 bg-primary/10 px-6 py-2 text-xs text-primary">
              {backendMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-6 py-3">
            <Button size="sm" className="gap-2 rounded-lg" disabled={backendStatus !== "online"}>
              <Play className="h-3.5 w-3.5" />
              Start Capture
            </Button>
            <Button size="sm" variant="outline" className="gap-2 rounded-lg" disabled>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
            <Button size="sm" variant="outline" className="gap-2 rounded-lg" disabled>
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
              <UploadCloud className="h-3.5 w-3.5" />
              Upload PCAP
              <input className="hidden" type="file" accept=".pcap,.pcapng" onChange={handleFileChange} />
            </label>
            {uploadedFileName && <span className="text-xs text-muted-foreground">{uploadedFileName}</span>}
          </div>

          <div className="grid gap-3 border-b border-border/50 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filterValue}
                onChange={event => setFilterValue(event.target.value)}
                className="h-9 rounded-lg border-border/50 bg-muted/20 pl-9 text-xs"
                placeholder="protocol equals dns, ip source equals 192.168.1.10, tcp port equals 443"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                className="h-9 rounded-lg border-border/50 bg-muted/20 pl-9 text-xs"
                placeholder="Search packets"
              />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_280px] overflow-hidden">
            <ScrollArea className="min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b border-border/50">
                    {["No.", "Time", "Source", "Destination", "Protocol", "Length", "Info"].map(column => (
                      <th key={column} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePackets.map(packet => (
                    <tr
                      key={packet.number}
                      className={cn(
                        "cursor-pointer border-b border-border/20 transition-colors hover:bg-white/[0.03]",
                        packet.number === selectedPacketNumber && "bg-primary/10",
                      )}
                      onClick={() => setSelectedPacketNumber(packet.number)}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{packet.number}</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{packet.timestamp}</td>
                      <td className="px-4 py-2 font-mono text-xs text-foreground">{packet.source}</td>
                      <td className="px-4 py-2 font-mono text-xs text-foreground">{packet.destination}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{packet.protocol}</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{packet.length}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{packet.info}</td>
                    </tr>
                  ))}
                  {visiblePackets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No packets match the current filter or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>

            <div className="grid min-h-0 grid-cols-1 border-t border-border/50 lg:grid-cols-2">
              <PacketDetails packet={selectedPacket} />
              <HexView />
            </div>
          </div>
        </main>

        <aside className="hidden border-l border-border/50 bg-muted/5 xl:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Traffic Statistics" icon={Activity}>
                <Stat label="Total packets" value="5 sample rows" />
                <Stat label="Total bytes" value="1.2 KB" />
                <Stat label="Capture duration" value="00:01.442" />
                <Stat label="TCP vs UDP" value="64% / 36%" />
              </Panel>

              <Panel title="Protocol Breakdown" icon={Globe2}>
                <div className="space-y-2">
                  {protocolBreakdown.map(protocol => (
                    <div key={protocol.name}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="font-semibold text-foreground">{protocol.name}</span>
                        <span className="text-muted-foreground">{protocol.value}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", protocol.color)} style={{ width: `${protocol.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Defensive Findings" icon={AlertTriangle}>
                <div className="space-y-3">
                  {findings.map(finding => (
                    <div key={finding.observation} className="rounded-lg border border-border/40 bg-background/50 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{finding.observation}</p>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{finding.confidence}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{finding.nextStep}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <section className="nsa-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">{title}</p>
      </div>
      {children}
    </section>
  );
}

function SidebarRow({ label, meta, active = false }: { label: string; meta: string; active?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border/30 p-3", active ? "bg-primary/10" : "bg-muted/10")}>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{meta}</p>
    </div>
  );
}

function filterPackets(packets: PacketSummary[], filterValue: string, searchValue: string) {
  const normalizedFilter = filterValue.trim().toLowerCase();
  const normalizedSearch = searchValue.trim().toLowerCase();

  return packets.filter(packet => {
    const searchable = [
      packet.number.toString(),
      packet.timestamp,
      packet.source,
      packet.destination,
      packet.protocol,
      packet.length.toString(),
      packet.info,
    ].join(" ").toLowerCase();

    const searchMatches = normalizedSearch.length === 0 || searchable.includes(normalizedSearch);
    const filterMatches = normalizedFilter.length === 0 || packetMatchesFilter(packet, normalizedFilter);

    return searchMatches && filterMatches;
  });
}

function packetMatchesFilter(packet: PacketSummary, filterValue: string) {
  const protocolMatch = filterValue.match(/^protocol\s+equals\s+(\w+)$/);
  if (protocolMatch) {
    return packet.protocol.toLowerCase() === protocolMatch[1].toLowerCase();
  }

  const sourceMatch = filterValue.match(/^ip\s+source\s+equals\s+([\d.:a-f]+)$/i);
  if (sourceMatch) {
    return packet.source.toLowerCase() === sourceMatch[1].toLowerCase();
  }

  const destinationMatch = filterValue.match(/^ip\s+destination\s+equals\s+([\d.:a-f]+)$/i);
  if (destinationMatch) {
    return packet.destination.toLowerCase() === destinationMatch[1].toLowerCase();
  }

  const containsMatch = filterValue.match(/^contains\s+(.+)$/);
  if (containsMatch) {
    return packet.info.toLowerCase().includes(containsMatch[1].toLowerCase());
  }

  return true;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function PacketDetails({ packet }: { packet: PacketSummary }) {
  return (
    <div className="min-h-0 border-r border-border/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Packet Details Tree</p>
      </div>
      <ScrollArea className="h-[220px]">
        <div className="space-y-2 text-xs">
          <DetailLayer name="Frame" fields={[`Packet ${packet.number}`, `${packet.length} bytes on wire`, `Time delta ${packet.timestamp}`]} />
          <DetailLayer name="Ethernet" fields={["Source and destination MAC metadata", "Type: IPv4 or IPv6 when available"]} />
          <DetailLayer name="IP" fields={[`Source: ${packet.source}`, `Destination: ${packet.destination}`, "Header fields decoded by backend"]} />
          <DetailLayer name={packet.protocol} fields={[packet.info, "Sensitive payload fields are not streamed by default"]} />
        </div>
      </ScrollArea>
    </div>
  );
}

function DetailLayer({ name, fields }: { name: string; fields: string[] }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
      <p className="mb-2 font-semibold text-foreground">{name}</p>
      <div className="space-y-1">
        {fields.map(field => (
          <p key={field} className="font-mono text-[11px] text-muted-foreground">
            {field}
          </p>
        ))}
      </div>
    </div>
  );
}

function HexView() {
  const rows = [
    "0000  45 00 00 5c 1c 46 40 00 40 11 a6 ec c0 a8 01 14  E..\\.F@.@.......",
    "0010  08 08 08 08 c0 23 00 35 00 48 7a 91 12 34 01 00  .....#.5.Hz..4..",
    "0020  00 01 00 00 00 00 00 00 07 65 78 61 6d 70 6c 65  .........example",
    "0030  03 63 6f 6d 00 00 01 00 01                    .com.....",
  ];

  return (
    <div className="min-h-0 p-4">
      <div className="mb-3 flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Raw Hex View</p>
      </div>
      <div className="rounded-lg border border-border/30 bg-black/30 p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <FileUp className="h-3.5 w-3.5" />
          Hex preview is redacted by default when sensitive fields are detected.
        </div>
        <pre className="overflow-auto font-mono text-[11px] leading-5 text-slate-300">{rows.join("\n")}</pre>
      </div>
    </div>
  );
}
