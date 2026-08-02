import { useState } from "react";

const DOC_LINKS = [
  { path: "docs/00_program/document_index.md", title: "Document Index" },
  { path: "docs/00_program/baseline_assessment.md", title: "Baseline Assessment" },
  { path: "docs/00_program/gap_analysis.md", title: "Gap Analysis" },
  { path: "docs/01_plans/phased_implementation_roadmap.md", title: "Phased Roadmap" },
  { path: "docs/02_requirements/requirements_trace_matrix.md", title: "Requirements Trace Matrix" },
  { path: "docs/03_design/tool_permission_matrix.md", title: "Tool Permission Matrix" },
  { path: "docs/07_release/operator_safety_guide.md", title: "Operator Safety Guide" },
  { path: "seraphim_local_bridge/main.py", title: "Local Bridge (Phase 3 health)" },
  { path: "AGENTS.md", title: "AGENTS.md" },
  { path: "SERAPHIM_WHITE_PAPER.md", title: "White Paper v8.0" }
] as const;

export function DocumentationView() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openDoc(path: string) {
    setSelectedPath(path);
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/repo-docs/${path}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setContent(await response.text());
    } catch (error) {
      setContent("");
      setLoadError(error instanceof Error ? error.message : "Unable to load document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Documentation</h1>
          <p>Read-only assurance package preview. Green access only; no writes.</p>
        </div>
      </header>

      <div className="doc-layout">
        <div className="card doc-sidebar">
          <p className="muted">Select an artifact to preview bundled repository docs.</p>
          <ul className="doc-list">
            {DOC_LINKS.map((doc) => (
              <li key={doc.path}>
                <button
                  type="button"
                  className={`doc-link${selectedPath === doc.path ? " active" : ""}`}
                  onClick={() => void openDoc(doc.path)}
                >
                  <strong>{doc.title}</strong>
                  <code>{doc.path}</code>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card doc-preview">
          <h2>{selectedPath ?? "Preview"}</h2>
          {loading && <p className="muted">Loading…</p>}
          {loadError && <p className="warning-box">Could not load: {loadError}</p>}
          {!loading && !loadError && content && (
            <pre className="doc-preview-body">{content}</pre>
          )}
          {!loading && !loadError && !content && (
            <p className="muted">Choose a document from the list.</p>
          )}
        </div>
      </div>
    </section>
  );
}
