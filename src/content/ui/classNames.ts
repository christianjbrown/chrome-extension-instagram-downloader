// The classes content.css styles. The script both adds them and looks for
// them to tell its own elements apart from Instagram's, so each is named once.
export const CLASS = {
  button: "igdl-button",
  download: "igdl-download",
  downloadAll: "igdl-download-all",
  gridLink: "igdl-grid-link",
  gridButton: "igdl-grid-button",
  postActions: "igdl-post-actions",
  profileToolbar: "igdl-profile-toolbar",
  storyToolbar: "igdl-story-toolbar",
  textButton: "igdl-text-button",
  iconPrefix: "igdl-icon-",
  panel: "igdl-panel",
  panelPartPrefix: "igdl-panel-",
  panelButton: "igdl-panel-button",
  toast: "igdl-toast",
} as const;

/** Several classes on one element, the way className takes them. */
export const classes = (...names: readonly string[]): string => names.join(" ");

/** A selector matching an element by one class. */
export const bySelector = (name: string): string => `.${name}`;
