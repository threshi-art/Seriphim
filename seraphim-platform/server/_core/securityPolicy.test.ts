import { describe, expect, it } from "vitest";
import {
  shouldAllowAnonymousFallback,
  resolveServerHost,
  storageKeyBelongsToUser,
} from "./securityPolicy";

describe("server security policy", () => {
  it("binds to loopback unless an operator explicitly chooses another host", () => {
    expect(resolveServerHost({})).toBe("127.0.0.1");
    expect(resolveServerHost({ SERAPHIM_SERVER_HOST: "0.0.0.0" })).toBe("0.0.0.0");
  });

  it("never creates the shared anonymous user in production", () => {
    expect(shouldAllowAnonymousFallback({ NODE_ENV: "production" })).toBe(false);
    expect(shouldAllowAnonymousFallback({ NODE_ENV: "development" })).toBe(true);
    expect(
      shouldAllowAnonymousFallback({
        NODE_ENV: "development",
        SERAPHIM_ALLOW_ANONYMOUS: "0",
      }),
    ).toBe(false);
  });

  it("limits storage reads to the authenticated user's upload prefix", () => {
    expect(storageKeyBelongsToUser("uploads/42/report.txt", 42)).toBe(true);
    expect(storageKeyBelongsToUser("uploads/7/report.txt", 42)).toBe(false);
    expect(storageKeyBelongsToUser("uploads/42/../7/report.txt", 42)).toBe(false);
    expect(storageKeyBelongsToUser("generated/report.png", 42)).toBe(false);
  });
});
