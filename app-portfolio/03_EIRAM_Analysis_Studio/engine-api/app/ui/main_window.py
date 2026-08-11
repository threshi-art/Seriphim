"""PearlFuel-inspired desktop command deck for EiRAM."""

from __future__ import annotations

import json
from html import escape
from pathlib import Path
from typing import Any

from PySide6.QtWidgets import (
    QComboBox,
    QFileDialog,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from app.engine import run_eiram
from app.schemas import AnalyzeRequest, AnalyzeResponse, PublicHandleResearchRequest
from app.services.public_profile_search import research_public_handle
from app.ui.styles import APPLICATION_STYLESHEET
from app.ui.widgets import ModuleCard, StatCard

MODULE_TITLES = {
    "iri": "Ideological Resonance Index",
    "vdm": "Vulnerability Detection Module",
    "tdm": "Temporal Drift Module",
    "ddm": "Deception Detection Module",
    "ecs": "Escalation Classification System",
    "eem": "Entropy Estimation Module",
    "pfm": "Persuasion Forecast Module",
}

PLATFORMS = ["x", "instagram", "facebook", "linkedin", "tiktok", "youtube", "reddit", "github"]


class MainWindow(QMainWindow):
    """Desktop shell that drives EiRAM directly."""

    def __init__(self) -> None:
        super().__init__()
        self._project_root = Path(__file__).resolve().parents[2]
        self._current_request: dict[str, Any] | None = None
        self._current_report: dict[str, Any] | None = None

        self.setObjectName("window")
        self.setWindowTitle("EiRAM Command Deck")
        self.resize(1540, 980)
        self.setMinimumSize(1280, 820)
        self.setStyleSheet(APPLICATION_STYLESHEET)

        self._build_ui()
        self._connect_signals()
        self._load_sample()
        self._render_idle()

    def _build_ui(self) -> None:
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(20, 14, 20, 20)
        root.setSpacing(14)
        root.addWidget(self._build_header())

        self.tabs = QTabWidget()
        self.tabs.addTab(self._build_analysis_tab(), "Analysis")
        self.tabs.addTab(self._build_handle_tab(), "Handle Intel")
        self.tabs.addTab(self._build_signals_tab(), "Signals")
        self.tabs.addTab(self._build_audit_tab(), "Audit")
        root.addWidget(self.tabs, 1)

        self.status_label = QLabel("Ready for intake.")
        self.statusBar().addWidget(self.status_label, 1)

    def _build_header(self) -> QFrame:
        frame = QFrame()
        frame.setObjectName("headerBar")
        layout = QHBoxLayout(frame)
        layout.setContentsMargins(22, 20, 22, 20)

        brand = QVBoxLayout()
        title = QLabel("EiRAM")
        title.setObjectName("brandText")
        subtitle = QLabel("Enigma Intelligence Risk Analysis Model")
        subtitle.setObjectName("subBrandText")
        brand.addWidget(title)
        brand.addWidget(subtitle)
        layout.addLayout(brand, 1)

        self.phase_chip = QLabel("PHASE 1")
        self.phase_chip.setObjectName("statusChip")
        self.state_chip = QLabel("NO ANALYSIS YET")
        self.state_chip.setObjectName("secondaryChip")
        layout.addWidget(self.phase_chip)
        layout.addWidget(self.state_chip)
        return frame

    def _build_analysis_tab(self) -> QWidget:
        page = QWidget()
        layout = QHBoxLayout(page)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(16)
        layout.addWidget(self._build_intake_panel(), 4)
        layout.addWidget(self._build_dashboard_panel(), 7)
        return page

    def _build_intake_panel(self) -> QFrame:
        panel = QFrame()
        panel.setObjectName("controlPanel")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(22, 22, 22, 22)
        layout.setSpacing(12)

        for widget in (
            self._label("Intake", "eyebrowLabel"),
            self._label("Analyst input channel", "panelTitle"),
            self._label(
                "Paste a narrative sample and EiRAM will generate a transparent phase-1 readout.",
                "panelDescription",
            ),
            self._label("Subject ID", "signalTitle"),
        ):
            if isinstance(widget, QLabel):
                widget.setWordWrap(True)
            layout.addWidget(widget)

        self.subject_input = QLineEdit()
        self.subject_input.setPlaceholderText("Optional subject identifier")
        layout.addWidget(self.subject_input)

        metadata_title = self._label("Metadata (JSON)", "signalTitle")
        layout.addWidget(metadata_title)
        self.metadata_input = QTextEdit()
        self.metadata_input.setPlaceholderText('{"source": "lab-sim"}')
        self.metadata_input.setMaximumHeight(110)
        layout.addWidget(self.metadata_input)

        text_title = self._label("Narrative Sample", "signalTitle")
        layout.addWidget(text_title)
        self.text_input = QTextEdit()
        self.text_input.setMinimumHeight(360)
        self.text_input.setPlaceholderText("Paste text here...")
        layout.addWidget(self.text_input, 1)

        note = self._label(
            "Phase-1 stays auditable by design. Use it as analyst support, not as a truth oracle.",
            "subtleNote",
        )
        note.setWordWrap(True)
        layout.addWidget(note)

        button_row = QHBoxLayout()
        self.analyze_button = self._button("Run EiRAM", "primaryButton")
        self.load_button = self._button("Load Text File", "secondaryButton")
        self.sample_button = self._button("Load Sample", "secondaryButton")
        self.clear_button = self._button("Clear", "secondaryButton")
        self.save_button = self._button("Save Report", "secondaryButton")
        self.save_button.setEnabled(False)
        for button in (self.analyze_button, self.load_button, self.sample_button, self.clear_button, self.save_button):
            button_row.addWidget(button)
        layout.addLayout(button_row)
        return panel

    def _build_dashboard_panel(self) -> QWidget:
        wrapper = QWidget()
        layout = QVBoxLayout(wrapper)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(14)

        hero = QFrame()
        hero.setObjectName("heroCard")
        hero_layout = QVBoxLayout(hero)
        hero_layout.setContentsMargins(26, 24, 26, 24)
        hero_layout.setSpacing(10)
        hero_layout.addWidget(self._label("Latest Analysis", "eyebrowLabel"))
        self.summary_title = self._label("Command deck idle", "heroTitle")
        self.summary_title.setWordWrap(True)
        self.summary_subtitle = self._label(
            "Run a narrative sample to populate the module lattice, evidence tray, and audit panes.",
            "heroSubtitle",
        )
        self.summary_subtitle.setWordWrap(True)
        hero_layout.addWidget(self.summary_title)
        hero_layout.addWidget(self.summary_subtitle)
        chip_row = QHBoxLayout()
        self.overall_chip = self._label("TEXT SIGNAL --", "statusChip")
        self.subject_chip = self._label("INPUT UNSPECIFIED", "secondaryChip")
        chip_row.addWidget(self.overall_chip)
        chip_row.addWidget(self.subject_chip)
        chip_row.addStretch()
        hero_layout.addLayout(chip_row)
        layout.addWidget(hero)

        stats = QGridLayout()
        stats.setSpacing(14)
        self.overall_card = StatCard("Overall Text Signal")
        self.ideology_card = StatCard("Ideological Lock")
        self.escalation_card = StatCard("Escalation Risk")
        self.destabilization_card = StatCard("Emotional Destabilization")
        for index, card in enumerate((self.overall_card, self.ideology_card, self.escalation_card, self.destabilization_card)):
            stats.addWidget(card, index // 2, index % 2)
        layout.addLayout(stats)

        modules_frame = QFrame()
        modules_frame.setObjectName("resultsCard")
        modules_layout = QVBoxLayout(modules_frame)
        modules_layout.setContentsMargins(20, 20, 20, 20)
        modules_layout.addWidget(self._label("Module lattice", "sectionTitle"))
        modules_layout.addWidget(
            self._label(
                "Every module keeps its own rationale so the readout stays interpretable.",
                "panelDescription",
            )
        )
        grid = QGridLayout()
        grid.setSpacing(12)
        self.module_cards: dict[str, ModuleCard] = {}
        for index, (key, title) in enumerate(MODULE_TITLES.items()):
            card = ModuleCard(title)
            self.module_cards[key] = card
            grid.addWidget(card, index // 2, index % 2)
        modules_layout.addLayout(grid)
        layout.addWidget(modules_frame, 1)

        lower = QHBoxLayout()
        self.evidence_list = QListWidget()
        self.forecast_text = QTextEdit()
        self.forecast_text.setReadOnly(True)
        lower.addWidget(self._wrap_output("Evidence tray", "Strongest phrase-level cues from the current run.", self.evidence_list), 4)
        lower.addWidget(self._wrap_output("Interpretation", "Descriptive output and mandatory limitations from the current text only.", self.forecast_text), 5)
        layout.addLayout(lower, 1)
        return wrapper

    def _build_handle_tab(self) -> QWidget:
        page = QWidget()
        layout = QHBoxLayout(page)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(16)

        controls = QFrame()
        controls.setObjectName("controlPanel")
        control_layout = QVBoxLayout(controls)
        control_layout.setContentsMargins(22, 22, 22, 22)
        control_layout.setSpacing(12)
        for widget in (
            self._label("Public handle research", "eyebrowLabel"),
            self._label("Cross-platform lead finder", "panelTitle"),
            self._label(
                "Plug in a public handle and EiRAM will assemble direct profile guesses, public search queries, and whatever live leads it can find.",
                "panelDescription",
            ),
            self._label("Handle", "signalTitle"),
        ):
            widget.setWordWrap(True)
            control_layout.addWidget(widget)

        self.handle_input = QLineEdit()
        self.handle_input.setPlaceholderText("@handle or handle")
        control_layout.addWidget(self.handle_input)

        control_layout.addWidget(self._label("Platform", "signalTitle"))
        self.platform_input = QComboBox()
        self.platform_input.addItems(PLATFORMS)
        control_layout.addWidget(self.platform_input)

        button_row = QHBoxLayout()
        self.research_button = self._button("Run Public Search", "primaryButton")
        self.research_clear_button = self._button("Clear", "secondaryButton")
        button_row.addWidget(self.research_button)
        button_row.addWidget(self.research_clear_button)
        control_layout.addLayout(button_row)
        control_layout.addStretch()

        leads_column = QWidget()
        leads_layout = QVBoxLayout(leads_column)
        leads_layout.setContentsMargins(0, 0, 0, 0)
        leads_layout.setSpacing(14)
        self.handle_summary = QTextEdit()
        self.handle_summary.setReadOnly(True)
        self.handle_leads = QListWidget()
        self.handle_queries = QTextEdit()
        self.handle_queries.setReadOnly(True)
        leads_layout.addWidget(self._wrap_output("Lead brief", "EiRAM's current public-search summary and guardrails.", self.handle_summary), 2)
        leads_layout.addWidget(self._wrap_output("Live leads", "Public URLs and snippets captured during lookup.", self.handle_leads), 3)
        leads_layout.addWidget(self._wrap_output("Query pack", "Search pivots for manual review or other AI tooling.", self.handle_queries), 2)

        layout.addWidget(controls, 4)
        layout.addWidget(leads_column, 7)
        return page

    def _build_signals_tab(self) -> QWidget:
        page = QWidget()
        layout = QHBoxLayout(page)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(14)
        self.features_text = QTextEdit()
        self.features_text.setReadOnly(True)
        self.rationales_text = QTextEdit()
        self.rationales_text.setReadOnly(True)
        layout.addWidget(self._wrap_output("Signal field", "Normalized features and composite proxies.", self.features_text), 1)
        layout.addWidget(self._wrap_output("Module rationales", "Readable traces for why each module landed where it did.", self.rationales_text), 1)
        return page

    def _build_audit_tab(self) -> QWidget:
        page = QWidget()
        layout = QHBoxLayout(page)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(14)
        self.request_text = QTextEdit()
        self.request_text.setReadOnly(True)
        self.raw_json_text = QTextEdit()
        self.raw_json_text.setReadOnly(True)
        layout.addWidget(self._wrap_output("Request payload", "Exactly what the deck sent into EiRAM.", self.request_text), 1)
        layout.addWidget(self._wrap_output("Raw EiRAM report", "Full JSON output for export or replay.", self.raw_json_text), 1)
        return page

    def _connect_signals(self) -> None:
        self.analyze_button.clicked.connect(self.on_analyze)
        self.load_button.clicked.connect(self.on_load_text_file)
        self.sample_button.clicked.connect(self._load_sample)
        self.clear_button.clicked.connect(self.on_clear)
        self.save_button.clicked.connect(self.on_save_report)
        self.research_button.clicked.connect(self.on_research_handle)
        self.research_clear_button.clicked.connect(self.on_clear_research)

    def _load_sample(self) -> None:
        sample_path = self._project_root / "data" / "sample_inputs.json"
        if not sample_path.exists():
            return
        try:
            sample_entries = json.loads(sample_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        if sample_entries:
            first = sample_entries[0]
            self.subject_input.setText(str(first.get("subject_id", "")))
            self.text_input.setPlainText(str(first.get("text", "")))
            self.metadata_input.setPlainText(json.dumps({"source": "sample_inputs.json"}, indent=2))
            self.status_label.setText("Loaded bundled sample input.")

    def _render_idle(self) -> None:
        self.summary_title.setText("Command deck idle")
        self.summary_subtitle.setText("Run a narrative sample to populate the module lattice, evidence tray, and audit panes.")
        self.state_chip.setText("NO ANALYSIS YET")
        self.overall_chip.setText("TEXT SIGNAL --")
        self.subject_chip.setText("INPUT UNSPECIFIED")
        self.forecast_text.setPlainText("No interpretation yet.")
        self.features_text.setHtml(self._simple_html("Signal field", "No extracted features yet."))
        self.rationales_text.setHtml(self._simple_html("Module rationales", "Run EiRAM to inspect module-level reasoning."))
        self.request_text.setPlainText("{}")
        self.raw_json_text.setPlainText("{}")
        self.handle_summary.setHtml(self._simple_html("Lead brief", "No public handle research has been run yet."))
        self.handle_queries.setPlainText("")
        self.handle_leads.clear()
        self.evidence_list.clear()
        self.evidence_list.addItem("No evidence snippets yet.")
        for card in (self.overall_card, self.ideology_card, self.escalation_card, self.destabilization_card):
            card.set_data("--", "Awaiting analysis")
        for card in self.module_cards.values():
            card.set_data(0.0, "idle", "No module output yet.")

    def on_analyze(self) -> None:
        text = self.text_input.toPlainText().strip()
        if not text:
            QMessageBox.information(self, "EiRAM", "Paste or load a narrative sample first.")
            return
        metadata = self._parse_metadata()
        if metadata is None and self.metadata_input.toPlainText().strip():
            return
        payload = AnalyzeRequest(text=text, subject_id=self.subject_input.text().strip() or None, metadata=metadata)
        try:
            result = run_eiram(payload)
        except Exception as exc:
            QMessageBox.critical(self, "EiRAM error", str(exc))
            return
        self._current_request = payload.dict()
        self._current_report = result.dict()
        self._render_result(payload, result)
        self.save_button.setEnabled(True)
        self.status_label.setText("Analysis complete.")

    def on_research_handle(self) -> None:
        handle = self.handle_input.text().strip()
        if not handle:
            QMessageBox.information(self, "EiRAM", "Enter a public handle first.")
            return
        payload = PublicHandleResearchRequest(handle=handle, platform=self.platform_input.currentText())
        try:
            result = research_public_handle(payload)
        except Exception as exc:
            QMessageBox.critical(self, "EiRAM", f"Handle lookup failed:\n{exc}")
            return
        notes = "".join(f"<div style='margin-top:6px;color:#9ec9e8;'>{escape(note)}</div>" for note in result.notes)
        direct_profiles = "".join(f"<div style='margin-top:6px;color:#c6e5ff;'>{escape(url)}</div>" for url in result.direct_profiles)
        self.handle_summary.setHtml(
            f"<div style=\"font-family:'Segoe UI';color:#d9ecff;\">"
            f"<div style=\"font-size:18px;font-weight:700;color:#ffffff;\">{escape(result.summary)}</div>"
            f"<div style=\"margin-top:12px;color:#7fd8ff;\">Direct profiles</div>{direct_profiles}"
            f"<div style=\"margin-top:14px;color:#7fd8ff;\">Notes</div>{notes}</div>"
        )
        self.handle_leads.clear()
        if result.leads:
            for lead in result.leads:
                self.handle_leads.addItem(f"{lead.title}\n{lead.url}\n{lead.snippet}")
        else:
            self.handle_leads.addItem("No live public leads captured on this run.")
        self.handle_queries.setPlainText("\n".join(result.queries))
        self.status_label.setText("Public handle research complete.")

    def on_load_text_file(self) -> None:
        file_path, _ = QFileDialog.getOpenFileName(self, "Load narrative text", str(self._project_root), "Text files (*.txt *.md *.json);;All files (*.*)")
        if not file_path:
            return
        try:
            loaded = Path(file_path).read_text(encoding="utf-8")
        except OSError as exc:
            QMessageBox.critical(self, "EiRAM", f"Could not read file:\n{exc}")
            return
        self.text_input.setPlainText(loaded)

    def on_clear(self) -> None:
        self.subject_input.clear()
        self.metadata_input.clear()
        self.text_input.clear()
        self._current_request = None
        self._current_report = None
        self.save_button.setEnabled(False)
        self._render_idle()
        self.status_label.setText("Intake cleared.")

    def on_clear_research(self) -> None:
        self.handle_input.clear()
        self.handle_summary.setHtml(self._simple_html("Lead brief", "No public handle research has been run yet."))
        self.handle_queries.setPlainText("")
        self.handle_leads.clear()

    def on_save_report(self) -> None:
        if self._current_report is None:
            QMessageBox.information(self, "EiRAM", "Run an analysis before exporting a report.")
            return
        file_path, _ = QFileDialog.getSaveFileName(self, "Save EiRAM report", str(self._project_root / "data" / "eiram_report.json"), "JSON files (*.json)")
        if not file_path:
            return
        Path(file_path).write_text(json.dumps({"request": self._current_request, "report": self._current_report}, indent=2), encoding="utf-8")
        self.status_label.setText(f"Saved report to {Path(file_path).name}.")

    def _parse_metadata(self) -> dict[str, Any] | None:
        raw = self.metadata_input.toPlainText().strip()
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            QMessageBox.warning(self, "Metadata JSON", f"Metadata must be valid JSON.\n\n{exc}")
            return None
        if not isinstance(parsed, dict):
            QMessageBox.warning(self, "Metadata JSON", "Metadata must decode to a JSON object.")
            return None
        return parsed

    def _render_result(self, payload: AnalyzeRequest, result: AnalyzeResponse) -> None:
        overall = float(result.risk_vector.get("overall_risk", 0.0))
        ideology = float(result.risk_vector.get("ideological_lock", 0.0))
        escalation = float(result.risk_vector.get("escalation_risk", 0.0))
        destabilization = float(result.risk_vector.get("emotional_destabilization", 0.0))
        self.summary_title.setText(result.summary)
        self.summary_subtitle.setText("Transparent phase-1 readout built from symbolic features, module scoring, and auditable evidence extraction.")
        self.state_chip.setText(self._risk_label(overall).upper())
        self.overall_chip.setText(f"TEXT SIGNAL {self._score_text(overall)}")
        self.subject_chip.setText(f"INPUT {(payload.subject_id or 'unspecified').upper()}")
        self.overall_card.set_data(self._score_text(overall), self._risk_caption(overall))
        self.ideology_card.set_data(self._score_text(ideology), "Current ideological lock proxy")
        self.escalation_card.set_data(self._score_text(escalation), "Escalation phase-1 module output")
        self.destabilization_card.set_data(self._score_text(destabilization), "Emotional destabilization proxy")
        limitations = "\n".join(f"• {item}" for item in result.limitations)
        self.forecast_text.setPlainText(f"{result.forecast}\n\nLimitations\n{limitations}")
        self.evidence_list.clear()
        for item in (result.evidence or ["No explicit evidence candidates captured on this run."]):
            self.evidence_list.addItem(QListWidgetItem(item))
        for key, module in result.module_scores.items():
            if key in self.module_cards:
                self.module_cards[key].set_data(module.score, module.label, module.rationale)
        self.features_text.setHtml(self._features_html(result))
        self.rationales_text.setHtml(self._rationales_html(result))
        self.request_text.setPlainText(json.dumps(self._current_request, indent=2))
        self.raw_json_text.setPlainText(json.dumps(self._current_report, indent=2))

    def _features_html(self, result: AnalyzeResponse) -> str:
        numeric_items = [(k, v) for k, v in result.extracted_features.items() if isinstance(v, (int, float))]
        numeric_items.sort(key=lambda item: float(item[1]), reverse=True)
        rows = []
        for key, value in numeric_items:
            rows.append(
                f"<div style='margin-top:8px;color:#c6e5ff;'>{escape(key.replace('_', ' '))}: <b>{self._value_text(value)}</b></div>"
            )
        vector = "".join(
            f"<div style='margin-top:6px;color:#9ec9e8;'>{escape(key.replace('_', ' '))}: <b>{self._score_text(float(value))}</b></div>"
            for key, value in result.risk_vector.items()
        )
        return self._simple_html("Legacy signal vector", vector + "<div style='margin-top:14px;color:#7fd8ff;'>Features</div>" + "".join(rows), raw=True)

    def _rationales_html(self, result: AnalyzeResponse) -> str:
        rows = []
        for key, title in MODULE_TITLES.items():
            payload = result.module_scores.get(key)
            if payload is None:
                continue
            rows.append(
                f"<div style='margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(10,32,54,0.72);"
                f"border:1px solid rgba(102,193,255,0.14);'><div style='color:#7fd8ff;'>{escape(title)}</div>"
                f"<div style='margin-top:6px;color:#ffffff;font-weight:700;'>{self._score_text(payload.score)} {escape(payload.label.upper())}</div>"
                f"<div style='margin-top:6px;color:#c6e5ff;'>{escape(payload.rationale)}</div></div>"
            )
        return self._simple_html("Module rationales", "".join(rows), raw=True)

    @staticmethod
    def _simple_html(title: str, body: str, *, raw: bool = False) -> str:
        content = body if raw else escape(body)
        return (
            f"<div style=\"font-family:'Segoe UI';color:#d9ecff;\">"
            f"<div style=\"font-size:18px;font-weight:700;color:#ffffff;\">{escape(title)}</div>"
            f"<div style=\"margin-top:10px;color:#9ec9e8;line-height:1.6;\">{content}</div></div>"
        )

    @staticmethod
    def _score_text(score: float) -> str:
        return f"{score * 100:.0f}%"

    @staticmethod
    def _value_text(value: float | int) -> str:
        return str(value) if isinstance(value, int) else (f"{value:.4f}" if abs(value) <= 1.0 else f"{value:.2f}")

    @staticmethod
    def _risk_label(score: float) -> str:
        if score >= 0.7:
            return "High signal"
        if score >= 0.4:
            return "Moderate signal"
        return "Low signal"

    @staticmethod
    def _risk_caption(score: float) -> str:
        if score >= 0.7:
            return "Hot stack with strong reinforcing signals"
        if score >= 0.4:
            return "Mixed stack with meaningful stress indicators"
        return "Limited ideological lock in the current sample"

    @staticmethod
    def _label(text: str, object_name: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName(object_name)
        return label

    @staticmethod
    def _button(text: str, object_name: str) -> QPushButton:
        button = QPushButton(text)
        button.setObjectName(object_name)
        return button

    def _wrap_output(self, title: str, subtitle: str, widget: QWidget) -> QFrame:
        frame = QFrame()
        frame.setObjectName("outputFrame")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(8)
        top = self._label(title, "sectionTitle")
        sub = self._label(subtitle, "panelDescription")
        sub.setWordWrap(True)
        layout.addWidget(top)
        layout.addWidget(sub)
        layout.addWidget(widget, 1)
        return frame
