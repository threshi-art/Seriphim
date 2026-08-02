package ui;

import java.io.File;
import java.util.function.Consumer;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;

/**
 * OperationCard component for displaying system check results.
 * Shows operation name, status (PASS/WARNING/FAIL), and optional details.
 */
public class OperationCard extends VBox {
    
    public enum Status {
        PASS, WARNING, FAIL, PENDING
    }
    
    private final Label nameLabel;
    private final Label statusLabel;
    private final Label detailsLabel;
    private final Circle statusIndicator;
    private final Button runButton;
    private final ImageView iconView;
    private final String category;
    private Status currentStatus;
    private String scriptName;
    private String details;
    private Consumer<OperationCard> runCallback;
    
    public OperationCard(String operationName) {
        this(operationName, null, null);
    }
    
    public OperationCard(String operationName, String scriptName) {
        this("General", operationName, scriptName, null);
    }
    
    public OperationCard(String operationName, String scriptName, String iconPath) {
        this("General", operationName, scriptName, iconPath);
    }

    public OperationCard(String category, String operationName, String scriptName, String iconPath) {
        this.currentStatus = Status.PENDING;
        this.category = category;
        this.scriptName = scriptName;
        this.details = "";
        
        // Icon (if provided)
        iconView = new ImageView();
        iconView.setFitWidth(32);
        iconView.setFitHeight(32);
        iconView.setPreserveRatio(true);
        if (iconPath != null && !iconPath.isEmpty()) {
            try {
                File iconFile = new File(iconPath);
                if (iconFile.exists()) {
                    Image icon = new Image(iconFile.toURI().toString());
                    iconView.setImage(icon);
                } else {
                    iconView.setVisible(false);
                }
            } catch (Exception e) {
                iconView.setVisible(false);
            }
        } else {
            iconView.setVisible(false);
        }
        
        // Status indicator circle
        statusIndicator = new Circle(8);
        statusIndicator.setFill(Color.GRAY);
        
        // Operation name
        nameLabel = new Label(operationName);
        nameLabel.getStyleClass().add("operation-name");
        
        // Status label
        statusLabel = new Label("PENDING");
        statusLabel.getStyleClass().add("operation-status");
        
        // Run button
        runButton = new Button("Run");
        runButton.getStyleClass().add("card-run-button");
        runButton.setOnAction(e -> {
            if (runCallback != null) {
                runCallback.accept(this);
            }
        });
        
        // Details label (optional)
        detailsLabel = new Label("");
        detailsLabel.getStyleClass().add("operation-details");
        detailsLabel.setWrapText(true);
        detailsLabel.setVisible(false);
        
        // Layout
        HBox headerBox = new HBox(10);
        headerBox.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(nameLabel, Priority.ALWAYS);
        if (iconView.isVisible()) {
            headerBox.getChildren().addAll(iconView, statusIndicator, nameLabel, statusLabel, runButton);
        } else {
            headerBox.getChildren().addAll(statusIndicator, nameLabel, statusLabel, runButton);
        }
        
        this.setSpacing(5);
        this.setPadding(new Insets(10));
        this.getStyleClass().add("operation-card");
        this.getChildren().addAll(headerBox, detailsLabel);
        
        initializeStatus(Status.PENDING);
    }
    
    /**
     * Private helper method to initialize or update the status.
     * This method is safe to call from the constructor.
     * @param status The new status (PASS, WARNING, FAIL, or PENDING)
     */
    private void initializeStatus(Status status) {
        this.currentStatus = status;
        
        switch (status) {
            case PASS:
                statusIndicator.setFill(Color.web("#4caf50")); // Green
                statusLabel.setText("PASS");
                statusLabel.setStyle("-fx-text-fill: #4caf50;");
                break;
            case WARNING:
                statusIndicator.setFill(Color.web("#ff9800")); // Orange
                statusLabel.setText("WARNING");
                statusLabel.setStyle("-fx-text-fill: #ff9800;");
                break;
            case FAIL:
                statusIndicator.setFill(Color.web("#f44336")); // Red
                statusLabel.setText("FAIL");
                statusLabel.setStyle("-fx-text-fill: #f44336;");
                break;
            case PENDING:
            default:
                statusIndicator.setFill(Color.web("#757575")); // Gray
                statusLabel.setText("PENDING");
                statusLabel.setStyle("-fx-text-fill: #757575;");
                break;
        }
    }
    
    /**
     * Updates the status of this operation card.
     * @param status The new status (PASS, WARNING, FAIL, or PENDING)
     */
    public void updateStatus(Status status) {
        initializeStatus(status);
    }
    
    /**
     * Sets the details text for this operation.
     * @param details The details text to display
     */
    public void setDetails(String details) {
        if (details != null && !details.trim().isEmpty()) {
            this.details = details;
            detailsLabel.setText(details);
            detailsLabel.setVisible(true);
        } else {
            this.details = "";
            detailsLabel.setText("");
            detailsLabel.setVisible(false);
        }
    }
    
    /**
     * Gets the current status of this operation.
     * @return The current status
     */
    public Status getStatus() {
        return currentStatus;
    }
    
    /**
     * Gets the operation name.
     * @return The operation name
     */
    public String getOperationName() {
        return nameLabel.getText();
    }

    public String getCategory() {
        return category;
    }
    
    /**
     * Gets the script name associated with this card.
     * @return The script name, or null if not set
     */
    public String getScriptName() {
        return scriptName;
    }
    
    /**
     * Sets the script name for this operation.
     * @param scriptName The script name
     */
    public void setScriptName(String scriptName) {
        this.scriptName = scriptName;
    }

    public String getDetails() {
        return details;
    }
    
    /**
     * Sets the callback to execute when the Run button is clicked.
     * @param callback The callback function
     */
    public void setRunCallback(Consumer<OperationCard> callback) {
        this.runCallback = callback;
    }
    
    /**
     * Sets the enabled state of the Run button.
     * @param enabled True to enable, false to disable
     */
    public void setRunButtonEnabled(boolean enabled) {
        runButton.setDisable(!enabled);
    }
}

