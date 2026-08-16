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
});
