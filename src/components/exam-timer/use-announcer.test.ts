import { describe, expect, it } from "vitest";
import { DEFAULT_ANNOUNCE, normalizeAnnounce } from "./use-announcer";

describe("saved 5-minute warning settings", () => {
  it("keeps valid values and repairs the rest", () => {
    expect(normalizeAnnounce(null)).toEqual(DEFAULT_ANNOUNCE);
    expect(normalizeAnnounce({ fiveMinutes: false, text: "เหลือ 5 นาที", chime: "bell" })).toEqual({ fiveMinutes: false, text: "เหลือ 5 นาที", chime: "bell" });
    expect(normalizeAnnounce({ chime: "siren", text: 5 })).toEqual(DEFAULT_ANNOUNCE);
  });

  it("drops the voice settings saved by the version that spoke", () => {
    expect(normalizeAnnounce({ fiveMinutes: true, text: "", voiceUri: "prem", rate: 1.1, chime: "triple" })).toEqual({
      fiveMinutes: true,
      text: "",
      chime: "triple",
    });
  });
});
