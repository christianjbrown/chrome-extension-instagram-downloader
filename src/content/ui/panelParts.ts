// The lines and bars of the progress panel, top to bottom.
import { CLASS } from "./classNames";

// Bars stay hidden until something reports a fraction.
export const PANEL_PARTS = [
  "title",
  "overall",
  "overall-bar",
  "heading",
  "detail",
  "account-bar",
  "note",
] as const;

export type PanelPart = (typeof PANEL_PARTS)[number];

const barSuffix = "-bar";

export const isBar = (part: PanelPart): boolean => part.endsWith(barSuffix);

export const partClass = (part: PanelPart): string =>
  `${CLASS.panelPartPrefix}${part}`;
