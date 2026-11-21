// Who is signed in, with the username from their profile.
import type { Input, Viewer } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import { VIEWER_PROCEDURE } from "../../shared/procedures/viewer";
import type { PageProcedure, ProfileQuery, ViewerIdSource } from "../ports";

type Name = typeof VIEWER_PROCEDURE;

export class ViewerProcedure implements PageProcedure<Name> {
  readonly name = VIEWER_PROCEDURE;

  constructor(
    private readonly viewer: ViewerIdSource,
    private readonly profiles: ProfileQuery,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input);
  }

  async handle(): Promise<Viewer> {
    const id = this.viewer.viewerId();
    const profile = await this.profiles.profile(id);
    return { id, username: profile.username };
  }
}
