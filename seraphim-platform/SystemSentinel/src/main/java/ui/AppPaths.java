package ui;

import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Resolves bundled resources for both local development and packaged builds.
 */
public final class AppPaths {

    private static final String APP_NAME = "SystemSentinel";

    private AppPaths() {
    }

    public static Path resolveScriptsDirectory() {
        return resolveBundledPath(Paths.get("scripts"));
    }

    public static Path resolveAssetsDirectory() {
        return resolveBundledPath(Paths.get("assets"));
    }

    public static Path resolveIconPath(String iconName) {
        if (iconName == null || iconName.isBlank()) {
            return null;
        }

        Path iconsDirectory = resolveAssetsDirectory().resolve("icons");
        String[] candidates = {
            iconName,
            iconName.toLowerCase(),
            iconName.toUpperCase(),
            iconName.replace(" ", "_"),
            iconName.replace(" ", "-")
        };

        for (String candidateName : candidates) {
            Path candidate = iconsDirectory.resolve(candidateName).normalize();
            if (Files.exists(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    public static Path getLogsDirectory() {
        Path dataDirectory = getWritableDataDirectory().resolve("logs");
        try {
            Files.createDirectories(dataDirectory);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create logs directory: " + dataDirectory, e);
        }
        return dataDirectory;
    }

    private static Path resolveBundledPath(Path relativePath) {
        for (Path baseDirectory : getCandidateBaseDirectories()) {
            Path candidate = baseDirectory.resolve(relativePath).normalize();
            if (Files.exists(candidate)) {
                return candidate;
            }
        }

        return Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize().resolve(relativePath).normalize();
    }

    private static Set<Path> getCandidateBaseDirectories() {
        Set<Path> candidates = new LinkedHashSet<>();
        Path currentWorkingDirectory = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        addWithParents(candidates, currentWorkingDirectory, 3);

        Path codeSourceDirectory = getCodeSourceDirectory();
        if (codeSourceDirectory != null) {
            addWithParents(candidates, codeSourceDirectory, 4);
        }

        return candidates;
    }

    private static void addWithParents(Set<Path> candidates, Path start, int depth) {
        Path current = start;
        for (int i = 0; i <= depth && current != null; i++) {
            candidates.add(current.normalize());
            current = current.getParent();
        }
    }

    private static Path getCodeSourceDirectory() {
        try {
            Path location = Paths.get(AppPaths.class.getProtectionDomain()
                .getCodeSource()
                .getLocation()
                .toURI());
            return Files.isRegularFile(location) ? location.getParent() : location;
        } catch (URISyntaxException | NullPointerException e) {
            return null;
        }
    }

    private static Path getWritableDataDirectory() {
        String localAppData = System.getenv("LOCALAPPDATA");
        if (localAppData != null && !localAppData.isBlank()) {
            return Paths.get(localAppData, APP_NAME).toAbsolutePath().normalize();
        }

        return Paths.get(System.getProperty("user.home"), "." + APP_NAME.toLowerCase()).toAbsolutePath().normalize();
    }
}
