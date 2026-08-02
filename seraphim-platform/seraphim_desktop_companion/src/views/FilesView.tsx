import { useEffect, useMemo, useState } from "react";
import {
  BridgeClientError,
  fetchWorkspaceConfig,
  listWorkspace,
  readWorkspaceFile
} from "../services/bridgeClient";
import { useSeraphim } from "../state/SeraphimState";
import type { WorkspaceConfig, WorkspaceEntry, WorkspaceReadResult } from "../types/bridge";

const PREVIEW_LIMIT = 30_000;

type LiveReadState = "loading" | "live" | "mock";

function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parentPath(relativePath: string) {
  if (!relativePath) return "";
  const parts = relativePath.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

function isHiddenEntry(entry: WorkspaceEntry) {
  return entry.name.startsWith(".");
}

function describeBridgeError(caught: unknown) {
  if (caught instanceof BridgeClientError) {
    return `${caught.code ? `${caught.code}: ` : ""}${caught.message}`;
  }

  if (caught instanceof Error) {
    return caught.message;
  }

  return "Bridge request failed.";
}

export function FilesView() {
  const {
    files: mockFiles,
    settings,
    bridgeHealth,
    refreshBridgeHealth,
    addLog
  } = useSeraphim();

  const [liveState, setLiveState] = useState<LiveReadState>("loading");
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null);
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<WorkspaceReadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => !isHiddenEntry(entry)),
    [entries]
  );

  const hiddenEntryCount = entries.length - visibleEntries.length;

  async function loadLiveDirectory(relativePath = currentPath, shouldLog = true) {
    setLiveState("loading");
    setErrorMessage(null);
    setSelectedFile(null);

    try {
      const config = await fetchWorkspaceConfig(settings.bridgeEndpoint);
      const listing = await listWorkspace(settings.bridgeEndpoint, relativePath);

      setWorkspaceConfig(config);
      setEntries(listing.entries);
      setCurrentPath(listing.relativePath);
      setLiveState("live");

      if (shouldLog) {
        addLog(`Green workspace list: ${listing.relativePath || "(root)"}.`, "info");
      }
    } catch (caught) {
      setLiveState("mock");
      setWorkspaceConfig(null);
      setEntries([]);
      setErrorMessage(describeBridgeError(caught));
    }
  }

  async function openFilePreview(entry: WorkspaceEntry) {
    setIsReadingFile(true);
    setErrorMessage(null);

    try {
      const file = await readWorkspaceFile(settings.bridgeEndpoint, entry.relativePath);
      setSelectedFile(file);
      addLog(`Green workspace read: ${file.relativePath}.`, "info");
    } catch (caught) {
      setSelectedFile(null);
      setErrorMessage(describeBridgeError(caught));
    } finally {
      setIsReadingFile(false);
    }
  }

  useEffect(() => {
    void loadLiveDirectory("", false);
    // Reload when the bridge target changes; user-triggered navigation handles path changes.
  }, [settings.bridgeEndpoint]);

  const liveBanner =
    liveState === "live"
      ? "LIVE READ (GREEN)"
      : liveState === "loading"
        ? "CHECKING BRIDGE"
        : "MOCK FALLBACK";

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Files</h1>
          <p>Green workspace listing and text preview through seraphim_local_bridge Phase 4.</p>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={() => void refreshBridgeHealth()}>
            Check bridge
          </button>
          <button onClick={() => void loadLiveDirectory(currentPath)}>Refresh files</button>
        </div>
      </header>

      <div className="card">
        <div className="card-topline">
          <div>
            <div className="label">Workspace Read State</div>
            <div className="value">{liveBanner}</div>
          </div>
          <span className={`bridge-status ${bridgeHealth.status}`}>{bridgeHealth.status}</span>
        </div>
        <div className="detail-row">
          <span>Bridge endpoint</span>
          <strong>{settings.bridgeEndpoint}</strong>
        </div>
        <div className="detail-row">
          <span>Approved workspace</span>
          <strong>{workspaceConfig?.workspaceRoot || settings.defaultWorkspace || "Not configured"}</strong>
        </div>
        <div className="detail-row">
          <span>Read limit</span>
          <strong>{workspaceConfig ? formatBytes(workspaceConfig.maxReadBytes) : "Bridge policy unavailable"}</strong>
        </div>
        <p className="warning-box">
          Green read-only only. This screen can list folders and preview text files through
          the bridge. It cannot write, delete, move, execute, or run PowerShell.
        </p>
        {errorMessage && <p className="warning-box">{errorMessage}</p>}
      </div>

      {liveState === "live" ? (
        <div className="file-browser">
          <div className="card file-list-card">
            <div className="card-topline">
              <div>
                <div className="label">Current Directory</div>
                <div className="value">{currentPath || "(workspace root)"}</div>
              </div>
              {currentPath && (
                <button
                  className="secondary-button"
                  onClick={() => void loadLiveDirectory(parentPath(currentPath))}
                >
                  Up
                </button>
              )}
            </div>

            {hiddenEntryCount > 0 && (
              <p className="muted">
                {hiddenEntryCount} hidden dotfile entr{hiddenEntryCount === 1 ? "y" : "ies"} filtered
                in the Desktop MVP to reduce accidental secret exposure.
              </p>
            )}

            <div className="file-list">
              {visibleEntries.map((entry) => (
                <button
                  key={entry.relativePath}
                  className="file-row"
                  onClick={() =>
                    entry.kind === "directory"
                      ? void loadLiveDirectory(entry.relativePath)
                      : void openFilePreview(entry)
                  }
                >
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{entry.relativePath}</small>
                  </span>
                  <span className="file-meta">
                    <span className="status-pill pending">
                      {entry.kind === "directory" ? "folder" : "file"}
                    </span>
                    <span>{formatBytes(entry.sizeBytes)}</span>
                  </span>
                </button>
              ))}
            </div>

            {visibleEntries.length === 0 && (
              <p className="muted">No visible entries returned for this directory.</p>
            )}
          </div>

          <div className="card file-preview-card">
            <div className="card-topline">
              <div>
                <div className="label">Text Preview</div>
                <div className="value">
                  {selectedFile?.relativePath || (isReadingFile ? "Reading..." : "Select a text file")}
                </div>
              </div>
              <span className="status-pill approved">read-only</span>
            </div>

            {selectedFile ? (
              <>
                <div className="detail-row">
                  <span>Size</span>
                  <strong>{formatBytes(selectedFile.sizeBytes)}</strong>
                </div>
                <div className="detail-row">
                  <span>Encoding</span>
                  <strong>{selectedFile.encoding}</strong>
                </div>
                <pre className="file-preview-body">
                  {selectedFile.content.length > PREVIEW_LIMIT
                    ? `${selectedFile.content.slice(0, PREVIEW_LIMIT)}\n\n[Preview truncated in UI]`
                    : selectedFile.content}
                </pre>
              </>
            ) : (
              <p className="muted">
                File previews are fetched through `GET /workspace/read` and remain Green
                read-only. Binary and oversized files are rejected by bridge policy.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="label">Mock Fixture Listing</div>
            <div className="value">{settings.defaultWorkspace || "No workspace selected"}</div>
            <p className="warning-box">
              Bridge live read is unavailable, so these files are fixtures for UI development.
              Start `seraphim_local_bridge` with `SERAPHIM_BRIDGE_WORKSPACE_ROOT` to show live data.
            </p>
          </div>

          <div className="card-grid">
            {mockFiles.map((file) => (
              <article key={file.id} className="card">
                <div className="card-topline">
                  <strong>{file.name}</strong>
                  <span className="status-pill pending">{file.kind}</span>
                </div>
                <div className="detail-row">
                  <span>Relative path</span>
                  <strong>{file.relativePath}</strong>
                </div>
                {file.sizeBytes !== undefined && (
                  <div className="detail-row">
                    <span>Size</span>
                    <strong>{file.sizeBytes} bytes</strong>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
