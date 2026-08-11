package ui;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuBar;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextArea;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

public class MainApp extends Application {

    private SystemCheckExecutor executor;
    private ResultLogger logger;
    private ResultExporter exporter;
    private ProgressBar progressBar;
    private TextArea outputConsole;
    private Button runAllButton;
    private List<OperationCard> systemHealthCards;
    private List<OperationCard> securityCards;
    private List<OperationCard> performanceCards;
    private List<OperationCard> inventoryCards;
    private List<OperationCard> logsCards;
    private Stage primaryStage;
    private boolean runAllInProgress;
    
    @Override
    public void start(Stage stage) {
        this.primaryStage = stage;
        executor = new SystemCheckExecutor();
        logger = new ResultLogger();
        exporter = new ResultExporter();
        
        BorderPane root = new BorderPane();
        
        // Create a container for menu bar and title bar
        VBox topContainer = new VBox();
        
        // Menu bar
        MenuBar menuBar = createMenuBar();
        topContainer.getChildren().add(menuBar);
        
        // Title bar with Run All button
        HBox titleBox = new HBox(15);
        titleBox.setPadding(new Insets(10, 15, 10, 15));
        titleBox.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        titleBox.getStyleClass().add("title-bar");
        Label titleLabel = new Label("System Sentinel – Local Integrity Console");
        titleLabel.getStyleClass().add("title-text");
        runAllButton = new Button("Run All Checks");
        runAllButton.getStyleClass().add("run-button");
        runAllButton.setOnAction(e -> runAllChecks());
        HBox.setHgrow(titleLabel, Priority.ALWAYS);
        titleBox.getChildren().addAll(titleLabel, runAllButton);
        topContainer.getChildren().add(titleBox);
        root.setTop(topContainer);
        
        // Center: TabPane with OperationCards
        TabPane tabPane = new TabPane();
        
        // System Health Tab
        Tab systemHealthTab = new Tab("System Health");
        systemHealthTab.setClosable(false);
        VBox systemHealthContent = new VBox(10);
        systemHealthContent.setPadding(new Insets(15));
        ScrollPane systemHealthScroll = new ScrollPane(systemHealthContent);
        systemHealthScroll.setFitToWidth(true);
        systemHealthScroll.setFitToHeight(true);
        systemHealthTab.setContent(systemHealthScroll);
        
        // Performance Tab
        Tab performanceTab = new Tab("Performance");
        performanceTab.setClosable(false);
        VBox performanceContent = new VBox(10);
        performanceContent.setPadding(new Insets(15));
        ScrollPane performanceScroll = new ScrollPane(performanceContent);
        performanceScroll.setFitToWidth(true);
        performanceScroll.setFitToHeight(true);
        performanceTab.setContent(performanceScroll);
        
        // Security Tab
        Tab securityTab = new Tab("Security");
        securityTab.setClosable(false);
        VBox securityContent = new VBox(10);
        securityContent.setPadding(new Insets(15));
        ScrollPane securityScroll = new ScrollPane(securityContent);
        securityScroll.setFitToWidth(true);
        securityScroll.setFitToHeight(true);
        securityTab.setContent(securityScroll);
        
        // Inventory Tab
        Tab inventoryTab = new Tab("Inventory");
        inventoryTab.setClosable(false);
        VBox inventoryContent = new VBox(10);
        inventoryContent.setPadding(new Insets(15));
        ScrollPane inventoryScroll = new ScrollPane(inventoryContent);
        inventoryScroll.setFitToWidth(true);
        inventoryScroll.setFitToHeight(true);
        inventoryTab.setContent(inventoryScroll);
        
        // Logs Tab
        Tab logsTab = new Tab("Logs");
        logsTab.setClosable(false);
        VBox logsContent = new VBox(10);
        logsContent.setPadding(new Insets(15));
        ScrollPane logsScroll = new ScrollPane(logsContent);
        logsScroll.setFitToWidth(true);
        logsScroll.setFitToHeight(true);
        logsTab.setContent(logsScroll);
        
        tabPane.getTabs().addAll(
            systemHealthTab,
            securityTab,
            performanceTab,
            inventoryTab,
            logsTab
        );
        root.setCenter(tabPane);
        
        // Initialize cards for all tabs
        initializeSystemHealthCards(systemHealthContent);
        initializeSecurityCards(securityContent);
        initializePerformanceCards(performanceContent);
        initializeInventoryCards(inventoryContent);
        initializeLogsCards(logsContent);
        
        // Bottom: ProgressBar and TextArea output console
        VBox bottomBox = new VBox(5);
        bottomBox.setPadding(new Insets(5));
        progressBar = new ProgressBar();
        progressBar.setProgress(0);
        outputConsole = new TextArea();
        outputConsole.setEditable(false);
        outputConsole.setPrefRowCount(5);
        bottomBox.getChildren().addAll(progressBar, outputConsole);
        root.setBottom(bottomBox);
        
        Scene scene = new Scene(root, 1000, 700);
        scene.getStylesheets().add(getClass().getResource("/styles.css").toExternalForm());
        stage.setTitle("System Sentinel");
        stage.setScene(scene);
        stage.show();
    }
    
    private MenuBar createMenuBar() {
        MenuBar menuBar = new MenuBar();
        
        Menu fileMenu = new Menu("File");
        MenuItem exportCSV = new MenuItem("Export to CSV...");
        exportCSV.setOnAction(e -> {
            List<OperationCard> allCards = new ArrayList<>();
            allCards.addAll(systemHealthCards);
            allCards.addAll(securityCards);
            allCards.addAll(performanceCards);
            allCards.addAll(inventoryCards);
            allCards.addAll(logsCards);
            boolean success = exporter.exportToCSV(primaryStage, allCards);
            if (success) {
                appendToConsole("Results exported to CSV successfully.\n");
            }
        });
        MenuItem exportText = new MenuItem("Export to Text...");
        exportText.setOnAction(e -> {
            List<OperationCard> allCards = new ArrayList<>();
            allCards.addAll(systemHealthCards);
            allCards.addAll(securityCards);
            allCards.addAll(performanceCards);
            allCards.addAll(inventoryCards);
            allCards.addAll(logsCards);
            boolean success = exporter.exportToText(primaryStage, allCards);
            if (success) {
                appendToConsole("Results exported to text file successfully.\n");
            }
        });
        fileMenu.getItems().addAll(exportCSV, exportText);
        
        menuBar.getMenus().add(fileMenu);
        return menuBar;
    }
    
    private void initializeSystemHealthCards(VBox container) {
        systemHealthCards = new ArrayList<>();
        
        // Core Integrity & Repair features
        // Format: {name, script, icon}
        String[][] checks = {
            {"SFC Scan & Repair", "check-sfc-scan.ps1", "19610.jpg"},
            {"DISM Health Check & Restore", "check-dism-health.ps1", "19610.jpg"},
            {"CHKDSK with Auto-Repair", "check-chkdsk.ps1", "19610.jpg"},
            {"Windows Update Audit", "check-windows-updates.ps1", "19610.jpg"},
            {"Driver Integrity Check", "check-driver-integrity.ps1", "19610.jpg"},
            {"Disk Space Check", "check-disk-space.ps1", "19610.jpg"},
            {"Memory Usage", "check-memory.ps1", "19610.jpg"},
            {"CPU Temperature", "check-cpu-temperature.ps1", "19610.jpg"},
            {"Service Status", "check-service-status.ps1", "19610.jpg"},
            {"Network Connectivity", "check-network-connectivity.ps1", "19610.jpg"}
        };
        
        addCards(container, systemHealthCards, "System Health", checks);
    }
    
    private void initializeSecurityCards(VBox container) {
        securityCards = new ArrayList<>();
        
        // Security & Audit features
        String[][] checks = {
            {"Startup Program Audit", "check-startup-programs.ps1", "orchestra.JPG"},
            {"Process Watchdog", "check-process-watchdog.ps1", "orchestra.JPG"},
            {"Network Port Monitor", "check-network-ports.ps1", "orchestra.JPG"},
            {"Firewall Rule Audit", "check-firewall-rules.ps1", "orchestra.JPG"},
            {"Event Log Criticals", "check-event-log-criticals.ps1", "orchestra.JPG"}
        };
        
        addCards(container, securityCards, "Security", checks);
    }
    
    private void initializePerformanceCards(VBox container) {
        performanceCards = new ArrayList<>();
        
        // Performance & Maintenance features
        String[][] checks = {
            {"Disk Defrag / Optimize", "check-disk-defrag.ps1", "photo.JPG"},
            {"Memory Diagnostic", "check-memory-diagnostic.ps1", "photo.JPG"},
            {"Resource Usage Dashboard", "check-resource-usage.ps1", "photo.JPG"},
            {"Scheduled Task Audit", "check-scheduled-tasks.ps1", "photo.JPG"},
            {"Service Status Viewer", "check-service-status-viewer.ps1", "photo.JPG"},
            {"Disk I/O Performance", "check-disk-io.ps1", "photo.JPG"},
            {"Network Latency", "check-network-latency.ps1", "photo.JPG"},
            {"Application Response Time", "check-app-response-time.ps1", "photo.JPG"}
        };
        
        addCards(container, performanceCards, "Performance", checks);
    }
    
    private void initializeInventoryCards(VBox container) {
        inventoryCards = new ArrayList<>();
        
        // Inventory & Forensics features
        String[][] checks = {
            {"Installed Software List", "check-installed-software.ps1", "Screenshot 2025-04-04 024321.png"},
            {"Driver List with Versions", "check-driver-list.ps1", "Screenshot 2025-04-04 024321.png"},
            {"Patch History Timeline", "check-patch-history.ps1", "Screenshot 2025-04-04 024321.png"},
            {"BSOD Dump Parser", "check-bsod-dump.ps1", "Screenshot 2025-04-04 024321.png"}
        };
        
        addCards(container, inventoryCards, "Inventory", checks);
    }
    
    private void initializeLogsCards(VBox container) {
        logsCards = new ArrayList<>();
        
        // Logs features
        String[][] checks = {
            {"Session Log Timeline", "check-session-log-timeline.ps1", "photo (2).jpg"}
        };
        
        addCards(container, logsCards, "Logs", checks);
    }

    private void addCards(VBox container, List<OperationCard> cards, String category, String[][] checks) {
        for (String[] check : checks) {
            OperationCard card = new OperationCard(category, check[0], check[1], null);
            card.setRunCallback(this::runSingleCheck);
            cards.add(card);
            container.getChildren().add(card);
        }
    }

    private List<OperationCard> getAllCards() {
        List<OperationCard> allCards = new ArrayList<>();
        allCards.addAll(systemHealthCards);
        allCards.addAll(securityCards);
        allCards.addAll(performanceCards);
        allCards.addAll(inventoryCards);
        allCards.addAll(logsCards);
        return allCards;
    }

    private CompletableFuture<SystemCheckExecutor.CheckResult> runCheck(OperationCard card) {
        String scriptName = card.getScriptName();
        if (scriptName == null || scriptName.isEmpty()) {
            appendToConsole("No script configured for: " + card.getOperationName() + "\n");
            return CompletableFuture.completedFuture(
                new SystemCheckExecutor.CheckResult(OperationCard.Status.FAIL, "No script configured", -1)
            );
        }

        card.updateStatus(OperationCard.Status.PENDING);
        card.setDetails("");
        card.setRunButtonEnabled(false);
        appendToConsole("Running: " + card.getOperationName() + "...\n");

        return executor.executeScript(scriptName, result -> {
            card.updateStatus(result.getStatus());
            card.setDetails(result.getOutput());
            card.setRunButtonEnabled(!runAllInProgress);

            String message = String.format("%s: %s\n", card.getOperationName(), result.getStatus());
            appendToConsole(message);

            logger.logResult(card.getOperationName(), result.getStatus(), result.getOutput());
        });
    }
    
    private void runSingleCheck(OperationCard card) {
        if (runAllInProgress) {
            appendToConsole("Run All is already in progress.\n");
            return;
        }

        runCheck(card);
    }
    
    private void runAllChecks() {
        outputConsole.clear();
        appendToConsole("Starting system checks...\n");
        progressBar.setProgress(0);

        List<OperationCard> allCards = getAllCards();
        int totalChecks = allCards.size();
        AtomicInteger completed = new AtomicInteger();
        runAllInProgress = true;
        runAllButton.setDisable(true);

        for (OperationCard card : allCards) {
            card.updateStatus(OperationCard.Status.PENDING);
            card.setDetails("");
            card.setRunButtonEnabled(false);
        }

        CompletableFuture<Void> sequence = CompletableFuture.completedFuture(null);
        for (OperationCard card : allCards) {
            sequence = sequence.thenCompose(ignored ->
                runCheck(card).handle((result, error) -> {
                    updateProgress(completed.incrementAndGet(), totalChecks);
                    if (error != null) {
                        appendToConsole("Unexpected error while running " + card.getOperationName() + ".\n");
                    }
                    return null;
                })
            );
        }

        sequence.whenComplete((ignored, error) -> Platform.runLater(() -> {
            runAllInProgress = false;
            runAllButton.setDisable(false);
            for (OperationCard card : allCards) {
                card.setRunButtonEnabled(true);
            }
            logger.logAllResults(allCards);
            if (error != null) {
                appendToConsole("\nRun All completed with one or more errors.\n");
            }
        }));
    }
    
    private void updateProgress(int completed, int total) {
        Platform.runLater(() -> {
            progressBar.setProgress((double) completed / total);
            if (completed == total) {
                appendToConsole("\nAll checks completed.\n");
            }
        });
    }
    
    private void appendToConsole(String text) {
        Platform.runLater(() -> {
            outputConsole.appendText(text);
        });
    }

    public static void main(String[] args) {
        launch(args);
    }
}
