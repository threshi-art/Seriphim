package ui;

import javafx.stage.FileChooser;
import javafx.stage.Stage;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Handles exporting system check results to various formats.
 */
public class ResultExporter {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * Exports all check results to a CSV file.
     * @param stage The JavaFX stage for file chooser
     * @param systemHealthCards List of system health cards
     * @param performanceCards List of performance cards
     * @return True if export was successful, false otherwise
     */
    public boolean exportToCSV(Stage stage, List<OperationCard> cards) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Export Results to CSV");
        fileChooser.getExtensionFilters().add(
            new FileChooser.ExtensionFilter("CSV Files", "*.csv"));
        fileChooser.setInitialFileName("system-sentinel-results-" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv");
        
        java.io.File file = fileChooser.showSaveDialog(stage);
        if (file == null) {
            return false; // User cancelled
        }
        
        try (FileWriter writer = new FileWriter(file)) {
            // Write CSV header
            writer.write("Category,Operation Name,Status,Timestamp,Details\n");
            
            String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
            
            for (OperationCard card : cards) {
                writer.write(String.format("%s,%s,%s,%s,%s\n",
                    escapeCSV(card.getCategory()),
                    escapeCSV(card.getOperationName()),
                    card.getStatus().toString(),
                    timestamp,
                    escapeCSV(card.getDetails())));
            }
            
            return true;
        } catch (IOException e) {
            System.err.println("Failed to export to CSV: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Exports all check results to a text file.
     * @param stage The JavaFX stage for file chooser
     * @param systemHealthCards List of system health cards
     * @param performanceCards List of performance cards
     * @return True if export was successful, false otherwise
     */
    public boolean exportToText(Stage stage, List<OperationCard> cards) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Export Results to Text");
        fileChooser.getExtensionFilters().add(
            new FileChooser.ExtensionFilter("Text Files", "*.txt"));
        fileChooser.setInitialFileName("system-sentinel-results-" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".txt");
        
        java.io.File file = fileChooser.showSaveDialog(stage);
        if (file == null) {
            return false; // User cancelled
        }
        
        try (FileWriter writer = new FileWriter(file)) {
            String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
            
            writer.write("System Sentinel - Check Results Report\n");
            writer.write("========================================\n");
            writer.write("Generated: " + timestamp + "\n\n");
            
            String currentCategory = null;
            for (OperationCard card : cards) {
                if (!card.getCategory().equals(currentCategory)) {
                    currentCategory = card.getCategory();
                    writer.write(currentCategory.toUpperCase() + "\n");
                    writer.write("-".repeat(currentCategory.length()) + "\n");
                }

                writer.write(String.format("%s: %s\n",
                    card.getOperationName(), card.getStatus()));

                if (!card.getDetails().isBlank()) {
                    writer.write(card.getDetails());
                    writer.write("\n");
                }

                writer.write("\n");
            }
            
            return true;
        } catch (IOException e) {
            System.err.println("Failed to export to text: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Escapes special characters in CSV fields.
     * @param field The field to escape
     * @return The escaped field
     */
    private String escapeCSV(String field) {
        if (field == null) {
            return "";
        }
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}

