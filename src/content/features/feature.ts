/** Something that adds its buttons to the page; run again whenever it changes. */
export interface Feature {
  scan(): void;
}

/** Where the page is, read at click time. */
export interface PageView {
  readonly document: Document;
  pathname(): string;
}
