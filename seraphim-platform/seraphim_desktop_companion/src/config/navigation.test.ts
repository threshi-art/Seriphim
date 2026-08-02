import { describe, expect, it } from "vitest";
import { DESKTOP_NAV_ITEMS, DESKTOP_VIEW_IDS } from "../config/navigation";

describe("desktop navigation", () => {
  it("exposes all 12 MVP screens", () => {
    expect(DESKTOP_NAV_ITEMS).toHaveLength(12);
    expect(new Set(DESKTOP_VIEW_IDS).size).toBe(12);
  });
});
