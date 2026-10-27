export interface ButtonSpec {
  readonly label: string;
  readonly className: string;
  readonly onClick: () => void;
}

// Buttons sit inside Instagram's own links, so a click must not reach them.
export function createButton(
  document: Document,
  spec: ButtonSpec,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = spec.className;
  button.title = spec.label;
  button.setAttribute("aria-label", spec.label);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    spec.onClick();
  });
  return button;
}

export function createTextButton(
  document: Document,
  spec: ButtonSpec,
): HTMLButtonElement {
  const button = createButton(document, spec);
  button.textContent = spec.label;
  return button;
}
