// Who is signed in, read from Instagram's own config module.
import { MODULES } from "./instagramApi";
import type { ModuleRequire, ViewerIdSource } from "./ports";

export class PolarisViewerId implements ViewerIdSource {
  constructor(private readonly require: ModuleRequire) {}

  viewerId(): string {
    const config = this.require(MODULES.config) as {
      getViewerId(): string | number;
    };
    return String(config.getViewerId());
  }
}
