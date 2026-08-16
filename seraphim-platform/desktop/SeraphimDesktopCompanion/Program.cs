using System.Drawing;
using System.Windows.Forms;

namespace SeraphimDesktopCompanion;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new CompanionForm());
    }
}

internal sealed class CompanionForm : Form
{
    private const string VirtualHost = "app.seraphim.local";
    private readonly Microsoft.Web.WebView2.WinForms.WebView2 webView = new();
    private readonly Label statusLabel = new();

    public CompanionForm()
    {
        Text = "Seraphim Desktop Companion";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(1280, 800);
        Size = new Size(1600, 960);
        BackColor = Color.FromArgb(7, 11, 19);
        ForeColor = Color.FromArgb(238, 246, 255);

        statusLabel.Dock = DockStyle.Fill;
        statusLabel.TextAlign = ContentAlignment.MiddleCenter;
        statusLabel.Font = new Font("Segoe UI Semibold", 14f, FontStyle.Regular);
        statusLabel.ForeColor = Color.FromArgb(94, 234, 212);
        statusLabel.Text = "Starting Seraphim Desktop Companion...";
        Controls.Add(statusLabel);

        webView.Dock = DockStyle.Fill;
        webView.Visible = false;
        Controls.Add(webView);

        Shown += async (_, _) => await InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        try
        {
            var wwwroot = ResolveWwwRoot();
            if (wwwroot is null)
            {
                statusLabel.Text =
                    "Companion UI not found.\n\nRun scripts\\build-desktop.ps1 to package wwwroot next to this executable.";
                statusLabel.ForeColor = Color.FromArgb(251, 146, 60);
                return;
            }

            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Seraphim", "DesktopCompanion", "WebView2");
            Directory.CreateDirectory(userDataFolder);
            var environment = await Microsoft.Web.WebView2.Core.CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: userDataFolder);
            await webView.EnsureCoreWebView2Async(environment);

            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = false;

            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                VirtualHost,
                wwwroot,
                Microsoft.Web.WebView2.Core.CoreWebView2HostResourceAccessKind.Allow);

            webView.CoreWebView2.NavigationCompleted += (_, args) =>
            {
                if (!args.IsSuccess)
                {
                    statusLabel.Visible = true;
                    statusLabel.Text = "Failed to load companion UI.";
                    statusLabel.ForeColor = Color.FromArgb(248, 113, 113);
                    return;
                }

                statusLabel.Visible = false;
                webView.Visible = true;
                webView.BringToFront();
            };

            webView.CoreWebView2.Navigate($"https://{VirtualHost}/index.html");
        }
        catch (Exception ex)
        {
            statusLabel.Text =
                "Unable to start WebView2 host.\n\n" +
                "Install the Microsoft Edge WebView2 Runtime, then try again.\n\n" +
                ex.Message;
            statusLabel.ForeColor = Color.FromArgb(248, 113, 113);
        }
    }

    private static string? ResolveWwwRoot()
    {
        foreach (var candidate in CandidateWwwRoots())
        {
            var indexPath = Path.Combine(candidate, "index.html");
            if (File.Exists(indexPath))
            {
                return candidate;
            }
        }

        return null;
    }

    private static IEnumerable<string> CandidateWwwRoots()
    {
        var baseDirectory = AppContext.BaseDirectory;

        yield return Path.Combine(baseDirectory, "wwwroot");
        yield return Path.Combine(baseDirectory, "seraphim_desktop_companion", "dist");

        var directory = new DirectoryInfo(baseDirectory);
        while (directory is not null)
        {
            yield return Path.Combine(directory.FullName, "desktop", "SeraphimDesktopCompanion", "wwwroot");
            yield return Path.Combine(directory.FullName, "seraphim_desktop_companion", "dist");
            yield return Path.Combine(directory.FullName, "dist", "desktop", "wwwroot");
            directory = directory.Parent;
        }
    }
}
