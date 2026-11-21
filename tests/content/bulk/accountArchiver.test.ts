import { SlideFiles } from "../../../src/content/mediaFiles";
import { AccountArchiver } from "../../../src/content/bulk/accountArchiver";
import { PinnedAwareCatchUp } from "../../../src/content/bulk/catchUp";
import { CONTENT_CONFIG } from "../../../src/content/config";
import type { ItemWriter } from "../../../src/content/saving/ports";
import { photo } from "../../fixtures";
import {
  MemoryFolder,
  asFolder,
  fakeBridge,
  reporter,
  signal,
} from "../helpers";

const defaultPacing = CONTENT_CONFIG.pacing;

const pages = [
  { items: [photo("1", "a.jpg"), photo("2", "b.jpg")], cursor: "c1" },
  { items: [photo("3", "c.jpg")], cursor: "c2" },
  { items: [photo("4", "d.jpg")], cursor: undefined },
];

function setup(
  existing: string[] = [],
  outcome: "saved" | "failed" = "saved",
  total?: number,
) {
  const bridge = fakeBridge({
    postsPage: ({ cursor }) =>
      pages[cursor === undefined ? 0 : Number(cursor.slice(1))]!,
  });
  const writer: ItemWriter = {
    exists: vi.fn((_folder: unknown, item: { url: string }) =>
      Promise.resolve(
        existing.includes(item.url.split("/").pop()!.split("?")[0]!),
      ),
    ),
    write: vi.fn(() => Promise.resolve(outcome)),
  };
  const pacer = {
    gate: { call: vi.fn((request: () => Promise<unknown>) => request()) },
    sleeper: { sleep: vi.fn(), between: vi.fn(() => Promise.resolve()) },
    fileDelayMs: defaultPacing.fileDelayMs,
  };
  const totals = { find: vi.fn(() => Promise.resolve(total)) };
  return {
    bridge,
    writer,
    pacer,
    totals,
    archiver: new AccountArchiver({
      files: new SlideFiles(),
      bridge,
      writer,
      pacer: pacer as never,
      totals,
      catchUp: new PinnedAwareCatchUp(),
    }),
  };
}

describe("AccountArchiver", () => {
  it("saves every post of every page into the account's folder", async () => {
    const { archiver, writer, pacer } = setup(["b.jpg"]);
    const root = new MemoryFolder();
    const report = reporter();
    const counts = await archiver.archive({
      username: "alice",
      folder: asFolder(root),
      onlyNew: false,
      signal: signal(),
      reporter: report,
    });
    expect(counts).toEqual({ saved: 3, skipped: 1, failed: 0 });
    expect(root.folders.has("alice")).toBe(true);
    expect(writer.write).toHaveBeenCalledTimes(3);
    expect(pacer.gate.call).toHaveBeenCalledTimes(3);
    expect(pacer.sleeper.between).toHaveBeenCalledWith(
      defaultPacing.fileDelayMs,
      expect.anything(),
    );
    expect(report.detail).toHaveBeenLastCalledWith(
      "Post 4: 3 new files, 1 already exists",
    );
    expect(report.accountBar).toHaveBeenCalledTimes(1);
    expect(report.accountBar).toHaveBeenCalledWith(undefined);
  });

  it("counts posts against the account's total and fills its bar", async () => {
    const { archiver, totals } = setup([], "saved", 8);
    const report = reporter();
    await archiver.archive({
      username: "alice",
      folder: asFolder(new MemoryFolder()),
      onlyNew: false,
      signal: signal(),
      reporter: report,
    });
    expect(totals.find).toHaveBeenCalledTimes(1);
    expect(totals.find).toHaveBeenCalledWith(
      "alice",
      pages[0],
      expect.anything(),
      report,
    );
    expect(report.detail).toHaveBeenLastCalledWith(
      "Post 4 of 8 (50%): 4 new files, 0 already exist",
    );
    expect(report.accountBar).toHaveBeenNthCalledWith(5, 0.5);
    expect(report.accountBar).toHaveBeenLastCalledWith(1);
  });

  it("caps the bar when Instagram's count is behind", async () => {
    const { archiver } = setup([], "saved", 2);
    const report = reporter();
    await archiver.archive({
      username: "alice",
      folder: asFolder(new MemoryFolder()),
      onlyNew: false,
      signal: signal(),
      reporter: report,
    });
    expect(report.accountBar).toHaveBeenLastCalledWith(1);
    expect(report.detail).toHaveBeenLastCalledWith(
      "Post 4: 4 new files, 0 already exist",
    );
  });

  it("counts posts the page could not read as failed", async () => {
    const { archiver, bridge } = setup();
    bridge.call.mockResolvedValueOnce({
      items: [],
      cursor: undefined,
      unreadable: 2,
    });
    const counts = await archiver.archive({
      username: "a",
      folder: asFolder(new MemoryFolder()),
      onlyNew: false,
      signal: signal(),
      reporter: reporter(),
    });
    expect(counts.failed).toBe(2);
  });

  it("counts files that failed", async () => {
    const { archiver } = setup([], "failed");
    const counts = await archiver.archive({
      username: "a",
      folder: asFolder(new MemoryFolder()),
      onlyNew: false,
      signal: signal(),
      reporter: reporter(),
    });
    expect(counts.failed).toBe(4);
  });

  it("stops at the first later page with nothing new for an account archived before", async () => {
    const { archiver, pacer, totals } = setup(["a.jpg", "b.jpg", "c.jpg"]);
    await archiver.archive({
      username: "a",
      folder: asFolder(new MemoryFolder()),
      onlyNew: true,
      signal: signal(),
      reporter: reporter(),
    });
    expect(pacer.gate.call).toHaveBeenCalledTimes(2);
    expect(totals.find).not.toHaveBeenCalled();
  });

  it("stops when the run is stopped", async () => {
    const { archiver } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(
      archiver.archive({
        username: "a",
        folder: asFolder(new MemoryFolder()),
        onlyNew: false,
        signal: controller.signal,
        reporter: reporter(),
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
