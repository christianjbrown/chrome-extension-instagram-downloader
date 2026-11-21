import type { Mock } from "vitest";
import type {
  Scheduler,
  Bridge,
  ErrorDescriber,
} from "../../src/content/ports";
import type { RunReporter } from "../../src/content/ui/ports";
import type { Input, Output, ProcedureName } from "../../src/shared/bridge";

type Answers = {
  [N in ProcedureName]?: (input: Input<N>) => Output<N> | Promise<Output<N>>;
};

type FakeBridge = Bridge & { call: ReturnType<typeof vi.fn> };

/** A bridge that answers from a table, rejecting anything not in it. */
export function fakeBridge(answers: Answers): FakeBridge {
  const call = vi.fn((name: ProcedureName, input: unknown) => {
    const answer = answers[name] as ((input: unknown) => unknown) | undefined;
    if (answer === undefined)
      return Promise.reject(new Error(`no answer for ${name}`));
    return Promise.resolve(answer(input));
  });
  return { call } as unknown as FakeBridge;
}

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : never;
};

export const reporter = (): Mocked<RunReporter> => ({
  heading: vi.fn(),
  detail: vi.fn(),
  waiting: vi.fn(),
  overall: vi.fn(),
  accountBar: vi.fn(),
});

export const notifier = (): { error: Mock<(message: string) => void> } => ({
  error: vi.fn(),
});

// Shows an error's own message, standing in for the real wording.
export const errorText = (): ErrorDescriber => ({
  describe: (error) => (error instanceof Error ? error.message : String(error)),
});

export const signal = (): AbortSignal => new AbortController().signal;

interface MemoryFile {
  getFile(): Promise<Blob>;
  createWritable(): Promise<{
    write(blob: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}

/** A folder in memory, shaped like the File System Access API. */
export class MemoryFolder {
  readonly kind = "directory";
  readonly files = new Map<string, Blob>();
  readonly folders = new Map<string, MemoryFolder>();

  constructor(readonly name = "root") {}

  getDirectoryHandle(name: string): Promise<MemoryFolder> {
    const folder = this.folders.get(name) ?? new MemoryFolder(name);
    this.folders.set(name, folder);
    return Promise.resolve(folder);
  }

  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<MemoryFile> {
    if (!this.files.has(name)) {
      if (options?.create !== true)
        return Promise.reject(new DOMException("missing", "NotFoundError"));
      this.files.set(name, new Blob([]));
    }
    return Promise.resolve({
      getFile: () => Promise.resolve(this.files.get(name)!),
      createWritable: () =>
        Promise.resolve({
          write: (blob: Blob) => {
            this.files.set(name, blob);
            return Promise.resolve();
          },
          close: () => Promise.resolve(),
        }),
    });
  }
}

export const asFolder = (folder: MemoryFolder): FileSystemDirectoryHandle =>
  folder as unknown as FileSystemDirectoryHandle;

/** A scheduler that runs nothing until the test says so. */
export class ManualScheduler implements Scheduler {
  readonly pending = new Map<number, { ms: number; callback: () => void }>();
  private next = 0;

  after(ms: number, callback: () => void): () => void {
    const id = this.next++;
    this.pending.set(id, { ms, callback });
    return () => {
      this.pending.delete(id);
    };
  }

  /** Runs everything still waiting. */
  runAll(): void {
    for (const [id, { callback }] of [...this.pending]) {
      this.pending.delete(id);
      callback();
    }
  }
}
