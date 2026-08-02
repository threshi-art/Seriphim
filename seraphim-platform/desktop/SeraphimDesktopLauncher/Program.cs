using System.Diagnostics;
using System.Drawing;
using System.Net.Http;
using System.Windows.Forms;

namespace SeraphimDesktopLauncher;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new LauncherForm());
    }
}

internal sealed class LauncherForm : Form
{
    private const string AgentUrl = "http://127.0.0.1:8767/";
    private const string AgentHealthUrl = "http://127.0.0.1:8767/health";
    private const string ConsoleUrl = "http://127.0.0.1:3000/agent";

    private readonly string? projectRoot;
    private readonly string? nodePath;
    private readonly HttpClient http = new() { Timeout = TimeSpan.FromSeconds(2) };
    private readonly Label statusLabel = new();
    private readonly Label rootLabel = new();
    private readonly Label nodeLabel = new();
    private readonly TextBox logBox = new();
    private readonly CheckBox trustedMode = new();
    private readonly Button startButton = new();
    private readonly Button stopButton = new();
    private readonly Button openConsoleButton = new();
    private readonly Button openAgentButton = new();
    private readonly System.Windows.Forms.Timer healthTimer = new();

    private Process? agentProcess;
    private Process? webProcess;
    private bool starting;

    public LauncherForm()
    {
        projectRoot = FindProjectRoot();
        nodePath = FindNodePath();

        Text = "Seraphim Desktop";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(820, 560);
        Size = new Size(940, 640);
        BackColor = Color.FromArgb(8, 13, 27);
        ForeColor = Color.FromArgb(226, 232, 240);

        BuildLayout();
        ConfigureHealthTimer();

        FormClosing += (_, _) => StopChildren();
        Shown += async (_, _) =>
        {
            Log("Seraphim Desktop Launcher ready.");
            Log("Close this window to stop processes started by this launcher.");
            await RefreshHealthAsync();
        };
    }

    private void BuildLayout()
    {
        var shell = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(22),
            ColumnCount = 1,
            RowCount = 5,
        };
        shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 78));
        shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 116));
        shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 54));
        shell.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
        Controls.Add(shell);

        var title = new Label
        {
            Text = "Seraphim Desktop",
            Dock = DockStyle.Fill,
            Font = new Font("Segoe UI Semibold", 24, FontStyle.Regular),
            ForeColor = Color.FromArgb(103, 232, 249),
            TextAlign = ContentAlignment.MiddleLeft,
        };
        shell.Controls.Add(title, 0, 0);

        var statusPanel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 4,
            Padding = new Padding(0, 4, 0, 8),
        };
        statusPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 25));
        statusPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 25));
        statusPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 25));
        statusPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 25));
        shell.Controls.Add(statusPanel, 0, 1);

        statusLabel.Text = "Agent: checking";
        rootLabel.Text = "Project: " + (projectRoot ?? "not found; set SERAPHIM_PROJECT_ROOT");
        nodeLabel.Text = "Node: " + (nodePath ?? "not found; install Node or set SERAPHIM_NODE_PATH");
        trustedMode.Text = "Trusted workspace mode";
        trustedMode.ForeColor = Color.FromArgb(203, 213, 225);
        trustedMode.AutoSize = true;
        trustedMode.Checked = false;
        trustedMode.Enabled = agentProcess is null;
        trustedMode.BackColor = BackColor;

        foreach (var label in new[] { statusLabel, rootLabel, nodeLabel })
        {
            label.Dock = DockStyle.Fill;
            label.AutoEllipsis = true;
            label.Font = new Font("Segoe UI", 10, FontStyle.Regular);
            label.ForeColor = Color.FromArgb(203, 213, 225);
            statusPanel.Controls.Add(label);
        }
        statusPanel.Controls.Add(trustedMode);

        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            WrapContents = false,
        };
        shell.Controls.Add(actions, 0, 2);

        ConfigureButton(startButton, "Start Seraphim", true);
        ConfigureButton(stopButton, "Stop Started Processes", false);
        ConfigureButton(openConsoleButton, "Open Console", true);
        ConfigureButton(openAgentButton, "Open Agent Bridge", true);

        startButton.Enabled = projectRoot is not null && nodePath is not null;
        stopButton.Enabled = false;
        startButton.Click += async (_, _) => await StartSeraphimAsync();
        stopButton.Click += (_, _) => StopChildren();
        openConsoleButton.Click += (_, _) => OpenUrl(ConsoleUrl);
        openAgentButton.Click += (_, _) => OpenUrl(AgentUrl);

        actions.Controls.Add(startButton);
        actions.Controls.Add(stopButton);
        actions.Controls.Add(openConsoleButton);
        actions.Controls.Add(openAgentButton);

        logBox.Dock = DockStyle.Fill;
        logBox.Multiline = true;
        logBox.ReadOnly = true;
        logBox.ScrollBars = ScrollBars.Vertical;
        logBox.BorderStyle = BorderStyle.FixedSingle;
        logBox.BackColor = Color.FromArgb(15, 23, 42);
        logBox.ForeColor = Color.FromArgb(226, 232, 240);
        logBox.Font = new Font("Consolas", 10, FontStyle.Regular);
        shell.Controls.Add(logBox, 0, 3);

        var footer = new Label
        {
            Dock = DockStyle.Fill,
            Text = "Local bridge: 127.0.0.1:8767 | Web console: 127.0.0.1:3000/agent",
            ForeColor = Color.FromArgb(148, 163, 184),
            TextAlign = ContentAlignment.MiddleLeft,
        };
        shell.Controls.Add(footer, 0, 4);
    }

    private void ConfigureButton(Button button, string text, bool primary)
    {
        button.Text = text;
        button.AutoSize = true;
        button.Height = 36;
        button.Margin = new Padding(0, 0, 10, 0);
        button.Padding = new Padding(12, 6, 12, 6);
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderSize = 1;
        button.FlatAppearance.BorderColor = primary ? Color.FromArgb(20, 184, 166) : Color.FromArgb(51, 65, 85);
        button.BackColor = primary ? Color.FromArgb(15, 118, 110) : Color.FromArgb(15, 23, 42);
        button.ForeColor = Color.White;
        button.Font = new Font("Segoe UI Semibold", 9, FontStyle.Regular);
    }

    private void ConfigureHealthTimer()
    {
        healthTimer.Interval = 5000;
        healthTimer.Tick += async (_, _) => await RefreshHealthAsync();
        healthTimer.Start();
    }

    private async Task StartSeraphimAsync()
    {
        if (starting)
        {
            return;
        }

        if (projectRoot is null || nodePath is null)
        {
            Log("Cannot start. Project root or Node runtime was not found.");
            return;
        }

        starting = true;
        startButton.Enabled = false;
        trustedMode.Enabled = false;

        try
        {
            Log("Starting Seraphim services...");
            await EnsureBuildAsync();
            await StartAgentAsync();
            await StartWebConsoleAsync();
            await WaitForHealthAsync(AgentHealthUrl, "local agent");
            await WaitForHealthAsync(ConsoleUrl, "web console");
            OpenUrl(ConsoleUrl);
            stopButton.Enabled = agentProcess is not null || webProcess is not null;
            Log("Seraphim is ready.");
        }
        catch (Exception ex)
        {
            Log("Launch failed: " + ex.Message);
            startButton.Enabled = true;
            trustedMode.Enabled = true;
        }
        finally
        {
            starting = false;
            await RefreshHealthAsync();
        }
    }

    private async Task EnsureBuildAsync()
    {
        var agentBundle = Path.Combine(projectRoot!, "dist", "local-agent.js");
        if (File.Exists(agentBundle))
        {
            Log("Build found: dist\\local-agent.js");
            return;
        }

        var buildScript = Path.Combine(projectRoot!, "scripts", "build.mjs");
        if (!File.Exists(buildScript))
        {
            throw new FileNotFoundException("scripts\\build.mjs was not found.");
        }

        Log("Build missing. Running scripts\\build.mjs...");
        await RunNodeAndWaitAsync(buildScript, Array.Empty<string>(), "build", TimeSpan.FromMinutes(4));
    }

    private async Task StartAgentAsync()
    {
        if (await UrlRespondsAsync(AgentHealthUrl))
        {
            Log("Local agent is already online.");
            return;
        }

        var agentBundle = Path.Combine(projectRoot!, "dist", "local-agent.js");
        agentProcess = StartNodeProcess(agentBundle, Array.Empty<string>(), "agent", trustedMode.Checked);
        Log(trustedMode.Checked
            ? "Agent started in trusted workspace mode."
            : "Agent started in observe mode.");
    }

    private async Task StartWebConsoleAsync()
    {
        if (await UrlRespondsAsync(ConsoleUrl))
        {
            Log("Web console is already online.");
            return;
        }

        var viteScript = Path.Combine(projectRoot!, "node_modules", "vite", "bin", "vite.js");
        if (!File.Exists(viteScript))
        {
            throw new FileNotFoundException("node_modules\\vite\\bin\\vite.js was not found. Run dependency install first.");
        }

        webProcess = StartNodeProcess(viteScript, new[] { "--host", "127.0.0.1", "--port", "3000", "--strictPort" }, "web", false);
        Log("Web console start requested on port 3000.");
    }

    private Process StartNodeProcess(string scriptPath, IReadOnlyList<string> args, string label, bool trusted)
    {
        var process = CreateNodeProcess(scriptPath, args, trusted);
        AttachLogging(process, label);
        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return process;
    }

    private async Task RunNodeAndWaitAsync(string scriptPath, IReadOnlyList<string> args, string label, TimeSpan timeout)
    {
        using var process = CreateNodeProcess(scriptPath, args, false);
        AttachLogging(process, label);
        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var cts = new CancellationTokenSource(timeout);
        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            TryKill(process);
            throw new TimeoutException(label + " timed out.");
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(label + " exited with code " + process.ExitCode + ".");
        }
    }

    private Process CreateNodeProcess(string scriptPath, IReadOnlyList<string> args, bool trusted)
    {
        var startInfo = new ProcessStartInfo(nodePath!)
        {
            WorkingDirectory = projectRoot!,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        startInfo.ArgumentList.Add(scriptPath);
        foreach (var arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        startInfo.Environment["SERAPHIM_PROJECT_ROOT"] = projectRoot!;
        if (trusted)
        {
            startInfo.Environment["SERAPHIM_AGENT_TRUSTED"] = "1";
        }

        return new Process
        {
            StartInfo = startInfo,
            EnableRaisingEvents = true,
        };
    }

    private void AttachLogging(Process process, string label)
    {
        process.OutputDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data))
            {
                Log("[" + label + "] " + e.Data);
            }
        };
        process.ErrorDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data))
            {
                Log("[" + label + "] " + e.Data);
            }
        };
        process.Exited += (_, _) => Log("[" + label + "] exited with code " + process.ExitCode);
    }

    private async Task WaitForHealthAsync(string url, string name)
    {
        for (var attempt = 1; attempt <= 30; attempt++)
        {
            if (await UrlRespondsAsync(url))
            {
                Log(name + " is responding.");
                return;
            }

            await Task.Delay(1000);
        }

        throw new TimeoutException(name + " did not respond in time.");
    }

    private async Task RefreshHealthAsync()
    {
        var online = await UrlRespondsAsync(AgentHealthUrl);
        statusLabel.Text = online ? "Agent: online at " + AgentHealthUrl : "Agent: offline";
        statusLabel.ForeColor = online ? Color.FromArgb(94, 234, 212) : Color.FromArgb(251, 146, 60);
    }

    private async Task<bool> UrlRespondsAsync(string url)
    {
        try
        {
            using var response = await http.GetAsync(url);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private void OpenUrl(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            Log("Could not open " + url + ": " + ex.Message);
        }
    }

    private void StopChildren()
    {
        TryKill(webProcess);
        TryKill(agentProcess);
        webProcess = null;
        agentProcess = null;
        stopButton.Enabled = false;
        startButton.Enabled = projectRoot is not null && nodePath is not null;
        trustedMode.Enabled = true;
    }

    private static void TryKill(Process? process)
    {
        if (process is null)
        {
            return;
        }

        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch
        {
            // Best effort shutdown for child processes started by the launcher.
        }
    }

    private void Log(string message)
    {
        if (IsDisposed)
        {
            return;
        }

        if (InvokeRequired)
        {
            BeginInvoke(() => Log(message));
            return;
        }

        logBox.AppendText(DateTime.Now.ToString("HH:mm:ss") + "  " + message + Environment.NewLine);
    }

    private static string? FindProjectRoot()
    {
        var envRoot = Environment.GetEnvironmentVariable("SERAPHIM_PROJECT_ROOT");
        if (LooksLikeProjectRoot(envRoot))
        {
            return Path.GetFullPath(envRoot!);
        }

        foreach (var start in new[] { AppContext.BaseDirectory, Environment.CurrentDirectory })
        {
            var directory = new DirectoryInfo(start);
            while (directory is not null)
            {
                if (LooksLikeProjectRoot(directory.FullName))
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }
        }

        return null;
    }

    private static bool LooksLikeProjectRoot(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        return File.Exists(Path.Combine(path, "package.json"))
            && File.Exists(Path.Combine(path, "scripts", "build.mjs"))
            && Directory.Exists(Path.Combine(path, "server", "local-agent"));
    }

    private static string? FindNodePath()
    {
        var envNode = Environment.GetEnvironmentVariable("SERAPHIM_NODE_PATH");
        if (File.Exists(envNode))
        {
            return Path.GetFullPath(envNode!);
        }

        var pathNode = FindOnPath("node.exe");
        if (pathNode is not null)
        {
            return pathNode;
        }

        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var bundledNode = Path.Combine(
            userProfile,
            ".cache",
            "codex-runtimes",
            "codex-primary-runtime",
            "dependencies",
            "node",
            "bin",
            "node.exe");

        return File.Exists(bundledNode) ? bundledNode : null;
    }

    private static string? FindOnPath(string fileName)
    {
        var pathValue = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (var rawPath in pathValue.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var directory = rawPath.Trim().Trim('"');
            var candidate = Path.Combine(directory, fileName);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}
