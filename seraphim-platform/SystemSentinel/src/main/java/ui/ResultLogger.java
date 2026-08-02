package ui;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Handles logging of system check results to files.
 */
public class ResultLogger {
    
    private final Path logsDirectory;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    public ResultLogger() {
        this.logsDirectory = AppPaths.getLogsDirectory();
    }
    
    /**
     * Logs a single check result to the log file.
     * @param operationName The name of the operation
     * @param status The status (PASS/WARNING/FAIL)
     * @param output The output from the check
     */
    public void logResult(String operationName, OperationCard.Status status, String output) {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        String logEntry = String.format("[%s] %s: %s%n%s%n---%n", 
            timestamp, operationName, status, output);
        
        try {
            Path logFile = logsDirectory.resolve("system-checks.log");
            try (FileWriter writer = new FileWriter(logFile.toFile(), true)) {
                writer.write(logEntry);
            }
        } catch (IOException e) {
            System.err.println("Failed to write to log file: " + e.getMessage());
        }
    }
    
    /**
     * Logs all check results from a list of cards.
     * @param cards The list of OperationCards to log
     */
    public void logAllResults(List<OperationCard> cards) {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        StringBuilder logEntry = new StringBuilder();
        logEntry.append("=== System Check Session: ").append(timestamp).append(" ===\n");
        
        for (OperationCard card : cards) {
            logEntry.append(String.format("%s: %s%n", 
                card.getOperationName(), card.getStatus()));
        }
        
        logEntry.append("=== End Session ===\n\n");
        
        try {
            Path logFile = logsDirectory.resolve("system-checks.log");
            try (FileWriter writer = new FileWriter(logFile.toFile(), true)) {
                writer.write(logEntry.toString());
            }
        } catch (IOException e) {
            System.err.println("Failed to write to log file: " + e.getMessage());
        }
    }
    
    /**
     * Gets the path to the logs directory.
     * @return The logs directory path
     */
    public Path getLogsDirectory() {
        return logsDirectory;
    }
}

