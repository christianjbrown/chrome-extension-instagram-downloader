import { sourceOf } from "../../../src/content/dom/mediaSource";

const make = (html: string): Element => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.firstElementChild!;
};

describe("sourceOf", () => {
  it("reads a picture's address and a video's poster", () => {
    expect(sourceOf(make('<img src="https://cdn/a.jpg">'))).toBe(
      "https://cdn/a.jpg",
    );
    expect(sourceOf(make('<video poster="https://cdn/b.jpg"></video>'))).toBe(
      "https://cdn/b.jpg",
    );
  });

  it("finds nothing on a video with no poster or on any other element", () => {
    expect(sourceOf(make("<video></video>"))).toBeUndefined();
    expect(sourceOf(make("<div></div>"))).toBeUndefined();
  });
});
