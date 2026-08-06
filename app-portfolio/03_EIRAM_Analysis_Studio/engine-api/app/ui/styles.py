"""PearlFuel-inspired styling for the EiRAM desktop shell."""

from __future__ import annotations

APPLICATION_STYLESHEET = """
QWidget#window {
    background:
        qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #04111d, stop:0.45 #0a2035, stop:1 #06111b);
    color: #dbeeff;
    font-family: "Bahnschrift", "Segoe UI", sans-serif;
}
QFrame#headerBar, QFrame#controlPanel, QFrame#resultsCard, QFrame#deckCard, QFrame#summaryCard {
    background: rgba(7, 21, 34, 0.88);
    border: 1px solid rgba(98, 169, 219, 0.18);
    border-radius: 22px;
}
QFrame#heroCard {
    border-radius: 28px;
    border: 1px solid rgba(107, 197, 255, 0.18);
    background:
        qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 rgba(8, 30, 51, 0.98),
        stop:0.55 rgba(10, 52, 87, 0.95),
        stop:1 rgba(4, 18, 31, 0.98));
}
QFrame#signalFrame, QFrame#outputFrame {
    background: rgba(4, 16, 28, 0.66);
    border: 1px solid rgba(107, 197, 255, 0.14);
    border-radius: 18px;
}
QLabel#brandText {
    color: #f5fbff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 2px;
}
QLabel#subBrandText {
    color: #8db5d6;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
}
QLabel#heroTitle {
    color: #f7fbff;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 1px;
}
QLabel#heroSubtitle, QLabel#panelDescription, QLabel#statCaption, QLabel#signalDetail, QLabel#subtleNote {
    color: #90b8d6;
    font-size: 14px;
    line-height: 1.45;
}
QLabel#eyebrowLabel, QLabel#signalTitle, QLabel#statTitle {
    color: #73c6ff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
}
QLabel#sectionTitle, QLabel#panelTitle, QLabel#signalValue, QLabel#statValue {
    color: #ffffff;
    font-size: 21px;
    font-weight: 700;
}
QLabel#statValue {
    font-size: 30px;
    font-weight: 800;
}
QLabel#statusChip, QLabel#secondaryChip {
    padding: 8px 16px;
    border-radius: 14px;
    border: 1px solid rgba(107, 197, 255, 0.2);
    background: rgba(8, 29, 48, 0.86);
    font-size: 12px;
    font-weight: 700;
    color: #d7f0ff;
}
QLabel#secondaryChip {
    color: #7fd8ff;
}
QLineEdit, QTextEdit, QListWidget, QComboBox {
    border-radius: 18px;
    border: 1px solid rgba(108, 189, 255, 0.16);
    background: rgba(4, 16, 28, 0.88);
    color: #e3f2ff;
    padding: 10px 12px;
    font-size: 14px;
}
QLineEdit:focus, QTextEdit:focus, QComboBox:focus {
    border: 1px solid rgba(102, 205, 255, 0.58);
}
QComboBox::drop-down {
    border: none;
    width: 26px;
}
QPushButton {
    min-height: 46px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 700;
    padding: 0 18px;
}
QPushButton#primaryButton {
    background:
        qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #0e82c9, stop:1 #30b8ff);
    color: #02131f;
    border: 1px solid rgba(147, 226, 255, 0.4);
}
QPushButton#primaryButton:hover {
    background:
        qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #1a9be2, stop:1 #4cc4ff);
}
QPushButton#secondaryButton {
    background: rgba(8, 29, 48, 0.9);
    color: #cfe8ff;
    border: 1px solid rgba(107, 197, 255, 0.2);
}
QPushButton#secondaryButton:hover {
    background: rgba(14, 42, 67, 0.95);
}
QPushButton:disabled {
    background: rgba(19, 34, 47, 0.7);
    color: rgba(180, 207, 226, 0.45);
    border: 1px solid rgba(87, 122, 148, 0.18);
}
QTabWidget::pane {
    border: 1px solid rgba(107, 197, 255, 0.2);
    border-radius: 14px;
    top: -1px;
    background: rgba(4, 16, 28, 0.35);
}
QTabBar {
    background: rgba(5, 18, 30, 0.92);
    border: 1px solid rgba(107, 197, 255, 0.16);
    border-radius: 14px;
    padding: 6px;
}
QTabBar::tab {
    min-width: 120px;
    min-height: 36px;
    background: rgba(8, 29, 48, 0.9);
    color: #c9e6ff;
    padding: 10px 18px;
    margin-right: 4px;
    border-radius: 12px;
    border: 1px solid rgba(107, 197, 255, 0.1);
    font-size: 13px;
    font-weight: 600;
}
QTabBar::tab:selected {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 rgba(16, 120, 190, 0.98),
        stop:1 rgba(48, 184, 255, 0.98));
    color: #ffffff;
    font-weight: 700;
    border: 1px solid rgba(160, 230, 255, 0.45);
}
QProgressBar {
    min-height: 12px;
    max-height: 12px;
    border-radius: 6px;
    border: none;
    background: rgba(8, 29, 48, 0.9);
}
QProgressBar::chunk {
    border-radius: 6px;
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #148fda, stop:1 #67d7ff);
}
QScrollArea, QStatusBar {
    background: transparent;
}
QStatusBar {
    color: #dbefff;
    border-top: 1px solid rgba(107, 197, 255, 0.14);
}
QListWidget::item {
    padding: 10px 12px;
    border-radius: 10px;
    margin: 4px;
}
QListWidget::item:selected {
    background: rgba(25, 108, 168, 0.9);
    color: #ffffff;
}
"""
