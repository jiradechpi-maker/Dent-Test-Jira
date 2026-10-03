import { describe, expect, it } from "vitest";
import { DEFAULT_ANNOUNCE, normalizeAnnounce } from "./use-announcer";

describe("saved announcement settings", () => {
  it("keeps valid values and repairs the rest", () => {
    expect(normalizeAnnounce(null)).toEqual(DEFAULT_ANNOUNCE);
    expect(normalizeAnnounce({ fiveMinutes: false, text: "เหลือ 5 นาที", voiceUri: "prem", rate: 0.8, chime: "bell" })).toEqual({
      fiveMinutes: false,
      text: "เหลือ 5 นาที",
      voiceUri: "prem",
      rate: 0.8,
      chime: "bell",
    });
    expect(normalizeAnnounce({ chime: "siren", rate: "fast" })).toMatchObject({ chime: DEFAULT_ANNOUNCE.chime, rate: DEFAULT_ANNOUNCE.rate });
  });

  it("maps a speed saved by an earlier version to the closest one offered now", () => {
    expect(normalizeAnnounce({ rate: 1.1 }).rate).toBe(1.0);
    expect(normalizeAnnounce({ rate: 0.95 }).rate).toBe(0.9);
    expect(normalizeAnnounce({ rate: 0.7 }).rate).toBe(0.8);
  });
});
