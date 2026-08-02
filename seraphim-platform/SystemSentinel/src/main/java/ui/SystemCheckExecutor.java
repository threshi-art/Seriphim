package ui;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

/**
 * Executes PowerShell scripts and processes their output.
 * Classifies results as PASS, WARNING, or FAIL based on exit codes and output.
 */
public class SystemCheckExecutor {
    
    private final Path scriptsDirectory;
    
    public SystemCheckExecutor() {
        this.scriptsDirectory = AppPaths.resolveScriptsDirectory();
    }
    
    /**
     * Executes a PowerShell script asynchronously.
     * @param scriptName The name of the script file (e.g., "check-disk-space.ps1")
     * @param onComplete Callback that receives the result (status and output)
     * @return A CompletableFuture for the execution
     */
    public CompletableFuture<CheckResult> executeScript(String scriptName, Consumer<CheckResult> onComplete) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Path scriptPath = scriptsDirectory.resolve(scriptName);
                if (!scriptPath.toFile().exists()) {
                    CheckResult missingScriptResult = new CheckResult(
                        OperationCard.Status.FAIL,
                        "Script not found: " + scriptPath,
                        -1
                    );

                    if (onComplete != null) {
                        javafx.application.Platform.runLater(() -> onComplete.accept(missingScriptResult));
                    }

                    return missingScriptResult;
                }
                
                // Build PowerShell command
                ProcessBuilder processBuilder = new ProcessBuilder(
                    "powershell.exe",
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", scriptPath.toString()
                );
                
                processBuilder.directory(scriptPath.getParent().toFile());
                processBuilder.redirectErrorStream(true);
                Process process = processBuilder.start();
                
                // Read output
                StringBuilder output = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                    }
                }
                
                int exitCode = process.waitFor();
                String outputText = output.toString().trim();
                
                // Classify result based on exit code
                OperationCard.Status status;
                if (exitCode == 0) {
                    // Check output for warnings
                    if (outputText.toLowerCase().contains("warning") || 
                        outputText.toLowerCase().contains("caution")) {
                        status = OperationCard.Status.WARNING;
                    } else {
                        status = OperationCard.Status.PASS;
                    }
                } else {
                    status = OperationCard.Status.FAIL;
                }
                
                CheckResult result = new CheckResult(status, outputText, exitCode);
                
                // Execute callback on JavaFX Application Thread
                if (onComplete != null) {
                    javafx.application.Platform.runLater(() -> onComplete.accept(result));
                }
                
                return result;
                
            } catch (IOException | InterruptedException e) {
                CheckResult errorResult = new CheckResult(
                    OperationCard.Status.FAIL,
                    "Error executing script: " + e.getMessage(),
                    -1
                );
                
                if (onComplete != null) {
                    javafx.application.Platform.runLater(() -> onComplete.accept(errorResult));
                }
                
                return errorResult;
            }
        });
    }
    
    /**
     * Result container for script execution.
     */
    public static class CheckResult {
        private final OperationCard.Status status;
        private final String output;
        private final int exitCode;
        
        public CheckResult(OperationCard.Status status, String output, int exitCode) {
            this.status = status;
            this.output = output;
            this.exitCode = exitCode;
        }
        
        public OperationCard.Status getStatus() {
            return status;
        }
        
        public String getOutput() {
            return output;
        }
        
        public int getExitCode() {
            return exitCode;
        }
    }
}

