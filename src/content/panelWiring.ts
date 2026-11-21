// Builds the progress panel from its lines and bars, listed top to bottom,
// each with the class content.css styles it by.
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
  const line = (className: string) => new DomPanelLine(document, className);
  // Bars stay hidden until something reports a fraction.
  const bar = (className: string) => new DomPanelBar(document, className);
  const lines = {
    title: line("igdl-panel-title"),
    overall: line("igdl-panel-overall"),
    overallBar: bar("igdl-panel-overall-bar"),
    heading: line("igdl-panel-heading"),
    detail: line("igdl-panel-detail"),
    accountBar: bar("igdl-panel-account-bar"),
    note: line("igdl-panel-note"),
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
