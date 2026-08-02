package ui;

/**
 * Standalone entry point used by packaged builds.
 * Launching the JavaFX Application subclass directly can fail in app images.
 */
public final class Launcher {

    private Launcher() {
    }

    public static void main(String[] args) {
        MainApp.main(args);
    }
}
