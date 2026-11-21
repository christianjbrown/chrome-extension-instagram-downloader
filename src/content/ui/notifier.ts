import type { Scheduler } from "../scheduler";
import { CLASS } from "./classNames";

export interface Notifier {
  error(message: string): void;
}

// Short-lived messages in the corner of the page.
export class ToastNotifier implements Notifier {
  constructor(
    private readonly document: Document,
    private readonly scheduler: Scheduler,
    private readonly lifetimeMs: number,
  ) {}

  error(message: string): void {
    const toast = this.document.createElement("div");
    toast.className = CLASS.toast;
    toast.setAttribute("role", "alert");
    toast.textContent = message;
    this.document.body.append(toast);
    this.scheduler.after(this.lifetimeMs, () => {
      toast.remove();
    });
  }
}
