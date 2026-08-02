"""FastAPI scaffold for the Argus Vigil local capture backend."""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class BackendHealth(BaseModel):
    """Health response for the browser dashboard."""

    status: Literal["online"]
    service: str
    version: str
    capabilities: List[str]


class NetworkInterface(BaseModel):
    """Network interface metadata safe to show in the browser."""

    interface_id: str
    name: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    status: Literal["up", "down", "unknown"] = "unknown"
    capture_available: bool = False


class CaptureStartRequest(BaseModel):
    """Request to start an authorized local capture session."""

    interface_id: str
    store_raw_packets: bool = False
    display_filter: Optional[str] = None
    max_packets: Optional[int] = Field(default=None, ge=1)


class CaptureSessionResponse(BaseModel):
    """Capture session metadata returned to the dashboard."""

    session_id: str
    status: Literal["created", "running", "paused", "stopped"]
    mode: Literal["live", "pcap"]
    store_raw_packets: bool = False


class PacketRecord(BaseModel):
    """Packet summary returned to the browser by default."""

    number: int
    timestamp: str
    source_address: str
    destination_address: str
    protocol: str
    length: int
    info: str


class TrafficFlow(BaseModel):
    """Conversation summary for a network flow."""

    source_ip: str
    source_port: Optional[int] = None
    destination_ip: str
    destination_port: Optional[int] = None
    protocol: str
    packet_count: int
    byte_count: int
    duration_ms: int


class DefensiveFinding(BaseModel):
    """Defensive observation generated from capture metadata."""

    observation: str
    why_it_matters: str
    confidence: Literal["low", "medium", "high"]
    possible_benign_explanation: str
    suggested_next_step: str


class ReportRequest(BaseModel):
    """Request to generate an MVP Markdown report."""

    session_id: str
    analyst_notes: Optional[str] = None


class ReportResponse(BaseModel):
    """Generated report metadata."""

    report_id: str
    session_id: str
    format: Literal["markdown"] = "markdown"


SESSION_STORE: Dict[str, CaptureSessionResponse] = {}
REPORT_STORE: Dict[str, str] = {}


app = FastAPI(
    title="Argus Vigil Local Capture Backend",
    version="0.1.0",
    description="Authorized defensive packet analysis backend for Seraphim NetScope Web.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=BackendHealth)
async def health() -> BackendHealth:
    """Return backend status and feature capability flags."""

    return BackendHealth(
        status="online",
        service="argus-vigil-backend",
        version="0.1.0",
        capabilities=[
            "pcap-upload",
            "packet-metadata",
            "defensive-findings",
            "markdown-reports",
        ],
    )


@app.get("/interfaces", response_model=List[NetworkInterface])
async def list_interfaces() -> List[NetworkInterface]:
    """Return local interfaces once capture adapters are implemented."""

    return []


@app.post("/capture/start", response_model=CaptureSessionResponse)
async def start_capture(request: CaptureStartRequest) -> CaptureSessionResponse:
    """Start an authorized live capture session."""

    session = CaptureSessionResponse(
        session_id=f"live-{request.interface_id}",
        status="running",
        mode="live",
        store_raw_packets=request.store_raw_packets,
    )
    SESSION_STORE[session.session_id] = session
    return session


@app.post("/capture/pause")
async def pause_capture() -> Dict[str, bool]:
    """Pause the active capture session."""

    return {"success": True}


@app.post("/capture/resume")
async def resume_capture() -> Dict[str, bool]:
    """Resume a paused capture session."""

    return {"success": True}


@app.post("/capture/stop")
async def stop_capture() -> Dict[str, bool]:
    """Stop the active capture session."""

    return {"success": True}


@app.post("/pcap/upload", response_model=CaptureSessionResponse)
async def upload_pcap(file: UploadFile) -> CaptureSessionResponse:
    """Accept a PCAP or PCAPNG upload for future parsing."""

    safe_name = file.filename or "uploaded-capture"
    session = CaptureSessionResponse(
        session_id=f"pcap-{safe_name}",
        status="created",
        mode="pcap",
    )
    SESSION_STORE[session.session_id] = session
    return session


@app.get("/sessions", response_model=List[CaptureSessionResponse])
async def list_sessions() -> List[CaptureSessionResponse]:
    """List known live and uploaded capture sessions."""

    return list(SESSION_STORE.values())


@app.get("/sessions/{session_id}", response_model=CaptureSessionResponse)
async def get_session(session_id: str) -> CaptureSessionResponse:
    """Return session metadata, using an empty placeholder if not parsed yet."""

    return SESSION_STORE.get(
        session_id,
        CaptureSessionResponse(session_id=session_id, status="created", mode="pcap"),
    )


@app.get("/sessions/{session_id}/packets", response_model=List[PacketRecord])
async def list_packets(session_id: str) -> List[PacketRecord]:
    """Return redacted packet summaries for a session."""

    return [
        PacketRecord(
            number=1,
            timestamp="2026-04-25T08:42:00.000Z",
            source_address="192.168.1.20",
            destination_address="8.8.8.8",
            protocol="DNS",
            length=92,
            info=f"{session_id}: Standard query A example.com",
        )
    ]


@app.get("/sessions/{session_id}/flows", response_model=List[TrafficFlow])
async def list_flows(session_id: str) -> List[TrafficFlow]:
    """Return flow conversations derived from packet metadata."""

    return [
        TrafficFlow(
            source_ip="192.168.1.20",
            source_port=53124,
            destination_ip="8.8.8.8",
            destination_port=53,
            protocol="UDP",
            packet_count=2,
            byte_count=216,
            duration_ms=45,
        )
    ]


@app.get("/sessions/{session_id}/stats")
async def get_stats(session_id: str) -> Dict[str, object]:
    """Return traffic statistics for a session."""

    return {
        "session_id": session_id,
        "total_packets": 1,
        "total_bytes": 92,
        "protocol_distribution": {"DNS": 1},
    }


@app.get("/sessions/{session_id}/dns")
async def get_dns_records(session_id: str) -> List[Dict[str, object]]:
    """Return DNS metadata only."""

    return [
        {
            "session_id": session_id,
            "queried_domain": "example.com",
            "query_type": "A",
            "response_ips": ["93.184.216.34"],
            "response_code": "NOERROR",
            "requesting_client": "192.168.1.20",
        }
    ]


@app.get("/sessions/{session_id}/http")
async def get_http_records(session_id: str) -> List[Dict[str, object]]:
    """Return visible unencrypted HTTP metadata with sensitive headers redacted."""

    return []


@app.get("/sessions/{session_id}/tls")
async def get_tls_records(session_id: str) -> List[Dict[str, object]]:
    """Return TLS metadata only. No decryption is attempted."""

    return []


@app.get("/sessions/{session_id}/findings", response_model=List[DefensiveFinding])
async def get_findings(session_id: str) -> List[DefensiveFinding]:
    """Return defensive findings without offensive guidance."""

    return [
        DefensiveFinding(
            observation=f"{session_id}: DNS traffic observed",
            why_it_matters="DNS metadata helps identify contacted services.",
            confidence="low",
            possible_benign_explanation="Normal application name resolution.",
            suggested_next_step="Compare domains against expected application behavior.",
        )
    ]


@app.post("/reports/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest) -> ReportResponse:
    """Generate an MVP Markdown report from stored metadata."""

    report_id = f"report-{request.session_id}"
    REPORT_STORE[report_id] = (
        f"# Argus Vigil Defensive Report\n\n"
        f"- Session: {request.session_id}\n"
        f"- Notes: {request.analyst_notes or 'None'}\n\n"
        "This scaffold report contains metadata only and does not store sensitive payloads by default.\n"
    )
    return ReportResponse(report_id=report_id, session_id=request.session_id)


@app.get("/reports/{report_id}/download")
async def download_report(report_id: str) -> Dict[str, str]:
    """Return generated Markdown report content for MVP download wiring."""

    return {"report_id": report_id, "content": REPORT_STORE.get(report_id, "")}


@app.websocket("/ws/capture/{session_id}")
async def capture_stream(websocket: WebSocket, session_id: str) -> None:
    """Stream live packet summaries for a capture session."""

    await websocket.accept()
    try:
        await websocket.send_json(
            {
                "type": "capture.status",
                "session_id": session_id,
                "status": "connected",
            }
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        return
