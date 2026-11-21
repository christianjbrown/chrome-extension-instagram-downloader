// Who is signed in, read from Instagram's own config module.
import { MEMBERS, MODULES } from "./instagramApi";
import { callMember, idAnswer } from "./members";
import type { ModuleRequire, ViewerIdSource } from "./ports";

export class PolarisViewerId implements ViewerIdSource {
  constructor(private readonly require: ModuleRequire) {}

  viewerId(): string {
    const config = this.require(MODULES.config);
    return idAnswer(callMember(config, MEMBERS.viewerId), MEMBERS.viewerId);
  }
}
