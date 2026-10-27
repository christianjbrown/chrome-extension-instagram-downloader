import { carouselSlide, isCarousel } from "../../../src/content/dom/carousel";

function dots(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("carouselSlide", () => {
  it("is undefined for a single picture", () => {
    expect(carouselSlide(dots("<img>"))).toBeUndefined();
    expect(isCarousel(dots("<img>"))).toBe(false);
  });

  it("reads the slide number from the active dot's label", () => {
    const container = dots(
      '<div><button aria-label="Go to slide 1"></button><button aria-current="step" aria-label="Go to slide 9"></button></div>',
    );
    expect(carouselSlide(container)).toBe(8);
    expect(isCarousel(container)).toBe(true);
  });

  it("falls back to the dot's position when the label has no number", () => {
    expect(
      carouselSlide(
        dots(
          '<div><button></button><button aria-current="step"></button></div>',
        ),
      ),
    ).toBe(1);
    expect(
      carouselSlide(
        dots('<div><button aria-current="step" aria-label=""></button></div>'),
      ),
    ).toBe(0);
  });

  it("copes with a dot that has no parent element", () => {
    const fragment = document.createDocumentFragment();
    const dot = document.createElement("button");
    dot.setAttribute("aria-current", "step");
    fragment.append(dot);
    expect(carouselSlide(fragment)).toBe(0);
  });
});
