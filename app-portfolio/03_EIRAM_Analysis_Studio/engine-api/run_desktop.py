"""Desktop entrypoint for the EiRAM command deck."""

from __future__ import annotations

import sys
from pathlib import Path

if not getattr(sys, "frozen", False):
    project_root = Path(__file__).resolve().parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

from PySide6.QtWidgets import QApplication

from app.ui.main_window import MainWindow


def main() -> None:
    """Launch the EiRAM desktop shell."""

    qt_app = QApplication(sys.argv)
    qt_app.setStyle("Fusion")
    window = MainWindow()
    window.show()
    sys.exit(qt_app.exec())


if __name__ == "__main__":
    main()
