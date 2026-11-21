// Starts the content script: tidies up after earlier versions first, then
// watches the page for places to add buttons.
import type { PageWatcher, StartupStep } from "./ports";

export class ContentStartup implements PageWatcher {
  constructor(
    private readonly tidyUps: readonly StartupStep[],
    private readonly watcher: PageWatcher,
  ) {}

  start(
    root: Node,
    createObserver: (callback: () => void) => MutationObserver,
  ): void {
    for (const step of this.tidyUps) step.run();
    this.watcher.start(root, createObserver);
  }
}
