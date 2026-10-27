import { BulkRunner } from "../../../src/content/bulk/bulkRunner";
import { abortError } from "../../../src/content/errors";
import { notifier } from "../helpers";

function setup(
  pick: () => Promise<FileSystemDirectoryHandle> = () =>
    Promise.resolve({} as FileSystemDirectoryHandle),
) {
  const panel = {
    open: vi.fn(),
    finish: vi.fn(),
    heading: vi.fn(),
    detail: vi.fn(),
    waiting: vi.fn(),
  };
  const notes = notifier();
  return { panel, notes, runner: new BulkRunner({ pick }, panel, notes) };
}

describe("BulkRunner", () => {
  it("runs a job in the panel and shows how it finished", async () => {
    const { runner, panel } = setup();
    await runner.run({ title: "Job", run: () => Promise.resolve("All done") });
    expect(panel.open).toHaveBeenCalledWith("Job", expect.any(Function));
    expect(panel.finish).toHaveBeenCalledWith("All done");
  });

  it("stops the job from the panel's Stop button", async () => {
    const { runner, panel } = setup();
    await runner.run({
      title: "Job",
      run: (_folder, signal) => {
        (panel.open.mock.calls[0]?.[1] as () => void)();
        return signal.aborted
          ? Promise.reject(abortError())
          : Promise.resolve("not stopped");
      },
    });
    expect(panel.finish).toHaveBeenCalledWith(
      "Stopped. Start it again to carry on where it left off.",
    );
  });

  it("shows why a job failed", async () => {
    const { runner, panel } = setup();
    await runner.run({
      title: "Job",
      run: () => Promise.reject(new Error("Blocked")),
    });
    expect(panel.finish).toHaveBeenCalledWith("Blocked");
  });

  it("says so when the folder cannot be opened", async () => {
    const { runner, panel, notes } = setup(() =>
      Promise.reject(new Error("aborted")),
    );
    await runner.run({ title: "Job", run: vi.fn() });
    expect(notes.error).toHaveBeenCalledWith(
      "Could not get access to the download folder.",
    );
    expect(panel.open).not.toHaveBeenCalled();
  });

  it("runs one job at a time", async () => {
    const { runner, notes } = setup();
    let finish: ((value: string) => void) | undefined;
    const first = runner.run({
      title: "A",
      run: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    });
    await runner.run({ title: "B", run: vi.fn() });
    expect(notes.error).toHaveBeenCalledWith("A download is already running.");
    await vi.waitFor(() => {
      expect(finish).toBeDefined();
    });
    finish?.("done");
    await first;
    await runner.run({ title: "C", run: () => Promise.resolve("ok") });
    expect(notes.error).toHaveBeenCalledTimes(1);
  });
});
