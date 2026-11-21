import { describeWait } from "../pacing/waitText";
import type { PanelWording } from "./ports";

// The panel's own words, in English.
export class EnglishPanelWording implements PanelWording {
  readonly note = "Keep this tab open while it runs.";
  readonly stop = "Stop";
  readonly close = "Close";

  wait(reason: string, remainingMs: number): string {
    return describeWait(reason, remainingMs);
  }
}
