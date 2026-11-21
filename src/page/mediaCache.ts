// Remembers every post, story and account Instagram sends the page, so most
// downloads need no extra request at all.
import { eachObject } from "./mediaShapes";
import type { MediaSink, Rememberer } from "./ports";

// Hands every object inside a response to each kind of object's own
// rememberer, so a new kind is a new rememberer and nothing here changes.
export class MediaCache implements MediaSink {
  constructor(private readonly rememberers: readonly Rememberer[]) {}

  ingest(root: unknown): void {
    eachObject(root, (value) => {
      for (const rememberer of this.rememberers) rememberer.remember(value);
    });
  }
}
