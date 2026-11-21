// Builds the progress panel from its lines and bars, listed top to bottom.
import { panelPartClass } from "./ui/classNames";
import { DomPanelView } from "./ui/domPanelView";
import { DomPanelBar } from "./ui/panelBar";
import { DomPanelLine } from "./ui/panelLine";
import { ProgressPanel, type PanelLines } from "./ui/progressPanel";
import type { PanelWording, RunPanel, TextButtons, WaitLine } from "./ui/ports";

export function progressPanel(
  document: Document,
  buttons: TextButtons,
  waits: WaitLine,
  wording: PanelWording,
): RunPanel {
  const line = (part: string) =>
    new DomPanelLine(document, panelPartClass(part));
  // Bars stay hidden until something reports a fraction.
  const bar = (part: string) => new DomPanelBar(document, panelPartClass(part));
  const lines = {
    title: line("title"),
    overall: line("overall"),
    overallBar: bar("overall-bar"),
    heading: line("heading"),
    detail: line("detail"),
    accountBar: bar("account-bar"),
    note: line("note"),
  } satisfies PanelLines;
  const parts = [
    lines.title,
    lines.overall,
    lines.overallBar,
    lines.heading,
    lines.detail,
    lines.accountBar,
    lines.note,
  ];
  return new ProgressPanel(
    new DomPanelView(document, buttons, parts),
    lines,
    waits,
    wording,
  );
}
