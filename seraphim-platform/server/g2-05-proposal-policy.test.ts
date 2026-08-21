import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("G2-05 immutable proposal policy", () => {
  it("does not introduce workspace mutation or execution capability", () => {
    const source = fs.readFileSync(
      path.resolve(import.meta.dirname, "../seraphim_runtime/write_proposals.py"),
      "utf8",
    );

    expect(source).toContain("resolve_relative");
    expect(source).toContain("os.O_RDONLY | no_follow");
    expect(source).toContain("stat.S_ISREG(metadata.st_mode)");
    expect(source).toContain("runtime_file_write_proposals");
    expect(source).not.toMatch(/\.write_bytes\(|\.write_text\(|\.unlink\(|os\.replace\(|shutil\.|import subprocess|from subprocess|subprocess\.|Popen\(|Process\.Start/);
  });
});
