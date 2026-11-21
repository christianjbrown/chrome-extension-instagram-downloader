import type { Countdown, WaitLine, WaitWording } from "./ports";

// Counts a wait down a second at a time, worded for the panel. Only one wait
// shows at once, so a new one stops the last.
export class CountdownLine implements WaitLine {
  private cancel = (): void => undefined;

  constructor(
    private readonly countdown: Countdown,
    private readonly wording: WaitWording,
  ) {}

  start(reason: string, ms: number, write: (text: string) => void): void {
    this.stop();
    this.cancel = this.countdown.start(ms, (remaining) => {
      write(this.wording.wait(reason, remaining));
    });
  }

  stop(): void {
    this.cancel();
  }
}
