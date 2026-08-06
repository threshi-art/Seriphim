"""Reusable dashboard widgets for the EiRAM desktop shell."""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QFrame, QLabel, QProgressBar, QVBoxLayout, QWidget


class StatCard(QFrame):
    """Compact metric tile with title, primary value, and caption."""

    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("deckCard")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(6)

        self.title_label = QLabel(title)
        self.title_label.setObjectName("statTitle")
        self.value_label = QLabel("--")
        self.value_label.setObjectName("statValue")
        self.caption_label = QLabel("Awaiting analysis")
        self.caption_label.setObjectName("statCaption")
        self.caption_label.setWordWrap(True)

        layout.addWidget(self.title_label)
        layout.addWidget(self.value_label)
        layout.addWidget(self.caption_label)
        layout.addStretch()

    def set_data(self, value: str, caption: str) -> None:
        """Update the card contents."""

        self.value_label.setText(value)
        self.caption_label.setText(caption)


class ModuleCard(QFrame):
    """Shows score, label, and rationale for one EiRAM module."""

    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("signalFrame")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(8)

        self.title_label = QLabel(title)
        self.title_label.setObjectName("signalTitle")
        self.score_label = QLabel("--")
        self.score_label.setObjectName("signalValue")
        self.label_chip = QLabel("Idle")
        self.label_chip.setObjectName("secondaryChip")
        self.progress = QProgressBar()
        self.progress.setRange(0, 100)
        self.progress.setTextVisible(False)
        self.detail_label = QLabel("No rationale yet.")
        self.detail_label.setObjectName("signalDetail")
        self.detail_label.setWordWrap(True)
        self.detail_label.setAlignment(Qt.AlignTop | Qt.AlignLeft)

        layout.addWidget(self.title_label)
        layout.addWidget(self.score_label)
        layout.addWidget(self.label_chip)
        layout.addWidget(self.progress)
        layout.addWidget(self.detail_label)
        layout.addStretch()

    def set_data(self, score: float, label: str, rationale: str) -> None:
        """Populate the module card from the EiRAM module output."""

        self.score_label.setText(f"{score * 100:.0f}%")
        self.label_chip.setText(label.upper())
        self.progress.setValue(int(round(score * 100)))
        self.detail_label.setText(rationale)
