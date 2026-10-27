export function element<T extends Element>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing interface element: ${selector}`);
  return result;
}

let previousFocus: HTMLElement | null = null;
export function closeDialogs() {
  document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((dialog) => dialog.close());
}

export function openDialog(id: string) {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  closeDialogs();
  element<HTMLDialogElement>(`#${id}`).showModal();
  document.body.classList.add("dialog-open");
}

export function setupDialogs() {
  for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog")) {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        document.body.classList.remove("dialog-open");
        if (previousFocus?.isConnected) previousFocus.focus();
      }
    });
  }
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    target?.closest("[data-close]")?.closest("dialog")?.close();
    if (target?.closest("[data-review]")) openDialog("review-dialog");
  });
}
