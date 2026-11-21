// One post, story or slide, by its id.
import type { ProcedureOutput } from "../bridge";
import type { MediaCheck } from "../checks";
import type { InstagramMedia } from "../media";

export const MEDIA_PROCEDURE = "media";

declare module "../bridge" {
  interface Procedures {
    media: { input: { mediaId: string }; output: InstagramMedia };
  }
}

export class MediaOutput implements ProcedureOutput<typeof MEDIA_PROCEDURE> {
  readonly name = MEDIA_PROCEDURE;

  constructor(private readonly check: MediaCheck) {}

  parse(value: unknown): InstagramMedia {
    return this.check.media(value);
  }
}
