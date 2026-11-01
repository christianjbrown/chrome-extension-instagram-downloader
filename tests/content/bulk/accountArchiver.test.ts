import {
  AccountArchiver,
  describeCounts,
  describeProgress,
} from "../../../src/content/bulk/accountArchiver";
import { defaultPacing } from "../../../src/content/pacing/pacing";
import type { ItemWriter } from "../../../src/content/saving/directoryWriter";
import { photo } from "../../fixtures";
import {
  MemoryFolder,
  asFolder,
  fakeBridge,
  reporter,
  signal,
} from "../helpers";

const pages = [
  { items: [photo("1", "a.jpg"), photo("2", "b.jpg")], cursor: "c1" },
  { items: [photo("3", "c.jpg")], cursor: "c2" },
  { items: [photo("4", "d.jpg")], cursor: undefined },
];

function setup(existing: string[] = [], outcome: "saved" | "failed" = "saved") {
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
    pacing: defaultPacing,
  };
  return {
    bridge,
    writer,
    pacer,
    archiver: new AccountArchiver(bridge, writer, pacer as never),
  };
}

it("describes counts, mentioning failures only when there are some", () => {
  expect(describeCounts({ saved: 1, skipped: 2, failed: 0 })).toBe(
    "1 saved, 2 already there",
  );
  expect(describeCounts({ saved: 1, skipped: 2, failed: 3 })).toBe(
    "1 saved, 2 already there, 3 failed",
  );
});

it("counts posts against the account's total when it is known", () => {
  const counts = { saved: 1, skipped: 2, failed: 0 };
  expect(describeProgress(3, 640, counts)).toBe(
    "Post 3 of 640: 1 saved, 2 already there",
  );
  expect(describeProgress(641, 640, counts)).toBe(
    "Post 641: 1 saved, 2 already there",
  );
});

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
      "Post 4: 3 saved, 1 already there",
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
    const { archiver, pacer } = setup(["a.jpg", "b.jpg", "c.jpg"]);
    await archiver.archive({
      username: "a",
      folder: asFolder(new MemoryFolder()),
      onlyNew: true,
      signal: signal(),
      reporter: reporter(),
    });
    expect(pacer.gate.call).toHaveBeenCalledTimes(2);
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
