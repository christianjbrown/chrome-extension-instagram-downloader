import type { Scheduler } from "../scheduler";

export interface Notifier {
  error(message: string): void;
}

// Short-lived messages in the corner of the page.
export class ToastNotifier implements Notifier {
  constructor(
    private readonly document: Document,
    private readonly scheduler: Scheduler,
    private readonly lifetimeMs = 6000,
  ) {}

  error(message: string): void {
    const toast = this.document.createElement("div");
    toast.className = "igdl-toast";
    toast.setAttribute("role", "alert");
    toast.textContent = message;
    this.document.body.append(toast);
    this.scheduler.after(this.lifetimeMs, () => {
      toast.remove();
    });
  }
}
