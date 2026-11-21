import { ATTRIBUTES, type PageBody, TAGS } from "../../shared/dom";
import type { Scheduler } from "../ports";
import type { Notifier } from "./ports";

// The class content.css styles each message with.
export const TOAST_CLASS = "igdl-toast";

const alertRole = "alert";

// Short-lived messages in the corner of the page.
export class ToastNotifier implements Notifier {
  constructor(
    private readonly document: PageBody,
    private readonly scheduler: Scheduler,
    private readonly lifetimeMs: number,
  ) {}

  error(message: string): void {
    const toast = this.document.createElement(TAGS.div);
    toast.className = TOAST_CLASS;
    toast.setAttribute(ATTRIBUTES.role, alertRole);
    toast.textContent = message;
    this.document.body.append(toast);
    this.scheduler.after(this.lifetimeMs, () => {
      toast.remove();
    });
  }
}
