import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Desktop Companion host policy", () => {
  it("stores WebView2 user data beneath LOCALAPPDATA", () => {
    const sourcePath = path.resolve(
      import.meta.dirname,
      "../desktop/SeraphimDesktopCompanion/Program.cs",
    );
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("Environment.SpecialFolder.LocalApplicationData");
    expect(source).toContain("CoreWebView2Environment.CreateAsync");
    expect(source).toContain("EnsureCoreWebView2Async(environment)");
    expect(source).toContain('"Seraphim", "DesktopCompanion", "WebView2"');
  });

  it("brokers only signed Runtime GET reads and never gives WebView content SQLite access", () => {
    const program = fs.readFileSync(
      path.resolve(import.meta.dirname, "../desktop/SeraphimDesktopCompanion/Program.cs"),
      "utf8",
    );
    const broker = fs.readFileSync(
      path.resolve(import.meta.dirname, "../desktop/SeraphimDesktopCompanion/RuntimeReadBroker.cs"),
      "utf8",
    );

    expect(program).toContain("WebMessageReceived");
    expect(program).toContain("PostWebMessageAsJson");
    expect(broker).toContain("HttpMethod.Get");
    expect(broker).toContain("IPAddress.Loopback");
    expect(broker).toContain('"/v1/"');
    expect(broker).toContain("CryptUnprotectData");
    expect(broker).toContain("CryptographicOperations.ZeroMemory");
    expect(broker).not.toMatch(/SQLite|System\.Data|File\.Write|Process\.Start/);
  });
});
