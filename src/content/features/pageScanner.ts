import type { Scheduler } from "../scheduler";
import type { Feature } from "./feature";

// Runs every feature once, then again shortly after the page changes.
// Instagram swaps whole pages without reloading, so this is how buttons
// appear on new posts and new pages.
export class PageScanner {
  private scheduled = false;

  constructor(
    private readonly features: readonly Feature[],
    private readonly scheduler: Scheduler,
    private readonly delayMs = 250,
  ) {}

  start(
    root: Node,
    createObserver: (callback: () => void) => MutationObserver,
  ): void {
    this.scanAll();
    createObserver(() => {
      this.schedule();
    }).observe(root, { childList: true, subtree: true });
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.scheduler.after(this.delayMs, () => {
      this.scheduled = false;
      this.scanAll();
    });
  }

  private scanAll(): void {
    for (const feature of this.features) {
      try {
        feature.scan();
      } catch {
        // One feature tripping over an unexpected page must not stop the rest.
      }
    }
  }
}
