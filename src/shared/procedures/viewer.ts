// Who is signed in.
import type { ProcedureOutput, Viewer } from "../bridge";
import { record, text } from "../schemas";

export const VIEWER_PROCEDURE = "viewer";

declare module "../bridge" {
  interface Procedures {
    viewer: { input: Record<string, never>; output: Viewer };
  }
}

export class ViewerOutput implements ProcedureOutput<typeof VIEWER_PROCEDURE> {
  readonly name = VIEWER_PROCEDURE;

  parse(value: unknown): Viewer {
    const raw = record(value, "viewer");
    return {
      id: text(raw.id, "viewer"),
      username: text(raw.username, "viewer"),
    };
  }
}
