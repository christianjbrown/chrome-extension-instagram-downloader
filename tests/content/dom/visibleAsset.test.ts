import { largestVisibleAsset } from "../../../src/content/dom/visibleAsset";

function element(html: string, boxes: Partial<DOMRect>[]): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("img, video").forEach((node, index) => {
    const box = {
      top: 0,
      bottom: 300,
      width: 300,
      height: 300,
      ...boxes[index],
    };
    node.getBoundingClientRect = () => box as DOMRect;
  });
  return container;
}

describe("largestVisibleAsset", () => {
  it("names the largest picture or video poster on screen", () => {
    const container = element(
      '<img src="https://cdn/a.jpg"><video poster="https://cdn/b.jpg"></video><img src="https://cdn/c.jpg">',
      [{}, { width: 400, height: 400 }, {}],
    );
    expect(largestVisibleAsset(container, 800)).toBe("b.jpg");
  });

  it("prefers the image's chosen source", () => {
    const container = element('<img src="https://cdn/a.jpg">', [{}]);
    Object.defineProperty(container.querySelector("img"), "currentSrc", {
      value: "https://cdn/hd.jpg",
    });
    expect(largestVisibleAsset(container, 800)).toBe("hd.jpg");
  });

  it("ignores small, off-screen and poster-less elements", () => {
    const container = element(
      '<img src="https://cdn/small.jpg"><img src="https://cdn/above.jpg"><img src="https://cdn/below.jpg"><video></video>',
      [
        { width: 50 },
        { top: -400, bottom: -100 },
        { top: 900, bottom: 1200 },
        {},
      ],
    );
    expect(largestVisibleAsset(container, 800)).toBeUndefined();
  });
});
