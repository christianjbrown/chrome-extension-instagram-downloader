import type { Mock } from "vitest";
import type { Bridge } from "../../src/content/bridgeClient";
import type { RunReporter } from "../../src/content/ui/progressPanel";
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
});

export const notifier = (): { error: Mock<(message: string) => void> } => ({
  error: vi.fn(),
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

  getFileHandle(name: string): Promise<MemoryFile> {
    if (!this.files.has(name)) this.files.set(name, new Blob([]));
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
