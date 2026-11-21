// One post, story or slide, by its id.
import type { ProcedureOutput } from "../bridge";
import type { InstagramMedia } from "../media";
import { media } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    media: { input: { mediaId: string }; output: InstagramMedia };
  }
}

export const MEDIA_PROCEDURE = {
  name: "media",
  parse: media,
} as const satisfies ProcedureOutput<"media">;
