// The headers that make a REST call look like Instagram's own, read from
// Instagram's own modules at call time.
import { HEADERS, MEMBERS, MODULES } from "./instagramApi";
import { callMember, textAnswer } from "./members";
import type { ModuleRequire, HeaderSource } from "./ports";

export class InstagramHeaders implements HeaderSource {
  constructor(private readonly require: ModuleRequire) {}

  headers(): Record<string, string> {
    return {
      [HEADERS.appId]: this.text(MODULES.config, MEMBERS.appId),
      [HEADERS.claim]: this.text(MODULES.claim, MEMBERS.claim),
    };
  }

  private text(module: string, member: string): string {
    return textAnswer(callMember(this.require(module), member), member);
  }
}
