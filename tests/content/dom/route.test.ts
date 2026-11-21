import {
  PostPath,
  ProfilePath,
  StoryPath,
} from "../../../src/content/dom/pathMatchers";
import { PathRouteParser } from "../../../src/content/dom/route";

const parser = new PathRouteParser([
  new StoryPath(),
  new PostPath(),
  new ProfilePath(),
]);

it.each([
  ["/", { kind: "other" }],
  ["/p/abc/", { kind: "post", shortcode: "abc" }],
  ["/reel/abc/", { kind: "post", shortcode: "abc" }],
  ["/tv/abc/", { kind: "post", shortcode: "abc" }],
  ["/alice/p/abc/", { kind: "post", shortcode: "abc" }],
  ["/alice/reel/abc/", { kind: "post", shortcode: "abc" }],
  ["/p/", { kind: "other" }],
  ["/alice/", { kind: "profile", username: "alice" }],
  ["/alice/tagged/", { kind: "other" }],
  ["/explore/", { kind: "other" }],
  ["/stories/", { kind: "other" }],
  ["/stories/alice/", { kind: "story", username: "alice", mediaId: undefined }],
  ["/stories/alice/123/", { kind: "story", username: "alice", mediaId: "123" }],
  ["/stories/highlights/", { kind: "other" }],
  ["/stories/highlights/987/", { kind: "highlight", highlightId: "987" }],
])("reads %s", (path, route) => {
  expect(parser.parse(path)).toEqual(route);
});
