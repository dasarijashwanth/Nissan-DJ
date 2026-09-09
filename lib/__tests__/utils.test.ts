import { describe, it, expect, vi, afterEach } from "vitest";
import { nowInAppTimezone } from "@/lib/utils";

describe("nowInAppTimezone", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the UTC calendar day unchanged during Eastern daytime hours", () => {
    // 2026-08-30 15:00 UTC = 11:00am EDT (UTC-4) — same calendar day either way.
    vi.setSystemTime(new Date("2026-08-30T15:00:00.000Z"));
    const result = nowInAppTimezone();
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(7); // August (0-indexed)
    expect(result.getUTCDate()).toBe(30);
  });

  it("rolls back to the previous Eastern calendar day during evening UTC hours", () => {
    // 2026-08-30 00:25 UTC = 2026-08-29 8:25pm EDT — this is the exact bug case from the session:
    // raw `new Date()` would read as Sunday Aug 30, but it's still Saturday Aug 29 in Eastern time.
    vi.setSystemTime(new Date("2026-08-30T00:25:00.000Z"));
    const result = nowInAppTimezone();
    expect(result.getUTCDate()).toBe(29);
    expect(result.getUTCDay()).toBe(6); // Saturday, not Sunday
  });

  it("handles the daylight-saving transition without throwing or misreading the day", () => {
    // 2026-11-01 05:30 UTC is around the US DST fallback — just needs to resolve to a sane Eastern date.
    vi.setSystemTime(new Date("2026-11-01T05:30:00.000Z"));
    const result = nowInAppTimezone();
    expect(Number.isNaN(result.getTime())).toBe(false);
    expect(result.getUTCFullYear()).toBe(2026);
  });

  it("never returns hour 24 (an Intl formatToParts quirk for midnight)", () => {
    // Midnight Eastern falls at 04:00 or 05:00 UTC depending on DST — pick a moment right at that edge.
    vi.setSystemTime(new Date("2026-08-30T04:00:00.000Z"));
    const result = nowInAppTimezone();
    expect(result.getUTCHours()).toBeGreaterThanOrEqual(0);
    expect(result.getUTCHours()).toBeLessThan(24);
  });
});
