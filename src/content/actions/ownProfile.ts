import type { Viewer } from "../../shared/bridge";
import type { CurrentViewer, OwnProfile } from "./ports";

const isNamed = (viewer: Viewer | undefined, username: string): boolean =>
  viewer?.username === username;

// A profile is your own when its username is the signed-in account's.
export class SignedInProfile implements OwnProfile {
  constructor(private readonly viewers: CurrentViewer) {}

  async viewerOn(username: string): Promise<Viewer | undefined> {
    const viewer = await this.viewers.current();
    return isNamed(viewer, username) ? viewer : undefined;
  }
}
