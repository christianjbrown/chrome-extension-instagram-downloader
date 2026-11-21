// The headers that make a REST call look like Instagram's own, read from
// Instagram's own modules at call time.
import { HEADERS, MODULES } from "./instagramApi";
import type { ModuleRequire, HeaderSource } from "./ports";

export class InstagramHeaders implements HeaderSource {
  constructor(private readonly require: ModuleRequire) {}

  headers(): Record<string, string> {
    const config = this.require(MODULES.config) as { getIGAppID(): string };
    const claim = this.require(MODULES.claim) as { getWWWClaim(): string };
    return {
      [HEADERS.appId]: config.getIGAppID(),
      [HEADERS.claim]: claim.getWWWClaim(),
    };
  }
}
