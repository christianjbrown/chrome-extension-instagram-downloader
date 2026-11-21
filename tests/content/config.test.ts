import { CONTENT_CONFIG } from "../../src/content/config";

describe("content config", () => {
  const { pacing } = CONTENT_CONFIG;

  it("paces bulk downloads gently", () => {
    expect(pacing).toEqual({
      apiDelayMs: [4000, 9000],
      apiCallsPerHour: 600,
      fileDelayMs: [400, 1200],
      backoffMs: [15 * 60_000, 30 * 60_000, 60 * 60_000, 120 * 60_000],
    });
  });

  it("keeps the hourly ceiling a backstop behind the delays", () => {
    const hour = 3_600_000;
    const [min, max] = pacing.apiDelayMs;
    // What a run makes in an hour when every wait lands at the given point.
    const typical = hour / ((min + max) / 2);
    const quickest = hour / min;
    expect(pacing.apiCallsPerHour).toBeGreaterThan(typical);
    expect(pacing.apiCallsPerHour).toBeLessThan(quickest);
  });

  it("waits a minute for the page, and a minute before asking for the viewer again", () => {
    expect(CONTENT_CONFIG.bridgeTimeoutMs).toBe(60_000);
    expect(CONTENT_CONFIG.viewerRetryMs).toBe(60_000);
  });

  it("rescans a quarter second after the page changes and shows errors for six seconds", () => {
    expect(CONTENT_CONFIG.scanDelayMs).toBe(250);
    expect(CONTENT_CONFIG.toastLifetimeMs).toBe(6000);
  });

  it("stops a following run after three accounts in a row fail", () => {
    expect(CONTENT_CONFIG.failuresInARow).toBe(3);
  });

  it("leaves small thumbnails and pictures alone", () => {
    expect(CONTENT_CONFIG.gridMinimumWidth).toBe(100);
    expect(CONTENT_CONFIG.assetMinimumSide).toBe(150);
  });
});
