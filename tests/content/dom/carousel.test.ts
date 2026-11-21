import { DotCarousel } from "../../../src/content/dom/carousel";

const carousel = new DotCarousel();

function dots(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("carouselSlide", () => {
  it("is undefined for a single picture", () => {
    expect(carousel.slide(dots("<img>"))).toBeUndefined();
    expect(carousel.isCarousel(dots("<img>"))).toBe(false);
  });

  it("reads the slide number from the active dot's label", () => {
    const container = dots(
      '<div><button aria-label="Go to slide 1"></button><button aria-current="step" aria-label="Go to slide 9"></button></div>',
    );
    expect(carousel.slide(container)).toBe(8);
    expect(carousel.isCarousel(container)).toBe(true);
  });

  it("falls back to the dot's position when the label has no number", () => {
    expect(
      carousel.slide(
        dots(
          '<div><button></button><button aria-current="step"></button></div>',
        ),
      ),
    ).toBe(1);
    expect(
      carousel.slide(
        dots('<div><button aria-current="step" aria-label=""></button></div>'),
      ),
    ).toBe(0);
  });

  it("copes with a dot that has no parent element", () => {
    const fragment = document.createDocumentFragment();
    const dot = document.createElement("button");
    dot.setAttribute("aria-current", "step");
    fragment.append(dot);
    expect(carousel.slide(fragment)).toBe(0);
  });
});
