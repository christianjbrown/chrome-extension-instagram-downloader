// Who is signed in.
import type { ProcedureOutput } from "../bridge";
import { record, text } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    viewer: { input: Record<string, never>; output: Viewer };
  }
}

export const VIEWER_PROCEDURE = {
  name: "viewer",
  parse: (value) => {
    const raw = record(value, "viewer");
    return {
      id: text(raw.id, "viewer"),
      username: text(raw.username, "viewer"),
    };
  },
} as const satisfies ProcedureOutput<"viewer">;
