import type { Viewer } from "../../shared/bridge";
import type { CurrentViewer, OwnProfile } from "./ports";

// A profile is your own when its username is the signed-in account's.
export class SignedInProfile implements OwnProfile {
  constructor(private readonly viewers: CurrentViewer) {}

  async viewerOn(username: string): Promise<Viewer | undefined> {
    const viewer = await this.viewers.current();
    return viewer?.username === username ? viewer : undefined;
  }
}
