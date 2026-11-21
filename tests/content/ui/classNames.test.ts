import css from "../../../static/content.css?raw";
import { BUTTON_LOOKS } from "../../../src/content/buttonLooks";
import { bySelector, CLASS, classes } from "../../../src/content/ui/classNames";

const styled = (name: string): boolean => css.includes(bySelector(name));

describe("class names", () => {
  it("names only classes content.css styles", () => {
    const { iconPrefix, panelPartPrefix, ...whole } = CLASS;
    for (const name of Object.values(whole)) expect(styled(name)).toBe(true);
    expect(styled(iconPrefix)).toBe(true);
    expect(styled(panelPartPrefix)).toBe(true);
  });

  it("has an icon drawn for every labelled button's look", () => {
    for (const { icon } of Object.values(BUTTON_LOOKS))
      expect(styled(`${CLASS.iconPrefix}${icon}`)).toBe(true);
  });

  it("joins classes the way className takes them", () => {
    expect(classes(CLASS.button, CLASS.download)).toBe(
      "igdl-button igdl-download",
    );
  });
});
