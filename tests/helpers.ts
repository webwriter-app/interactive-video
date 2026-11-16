import snippet from "../snippets/Mondlandung.html";
import "../src/widgets/webwriter-interactive-video";
import "../src/widgets/webwriter-video-interaction";
import type { WebwriterInteractiveVideo } from "../src/widgets/webwriter-interactive-video";

export { snippet };

// The widget's observers resize what they observe, which makes the browser report "ResizeObserver loop completed with
// undelivered notifications" as an uncaught error that Mocha counts as a failure. Delivering the entries in the next frame avoids it.
const NativeResizeObserver = window.ResizeObserver;
window.ResizeObserver = class extends NativeResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => { requestAnimationFrame(() => callback(entries, observer)); });
  }
};

export async function until<T>(test: () => T | Promise<T>, what: string, ms = 20000): Promise<NonNullable<T>> {
  const end = Date.now() + ms;
  for (;;) {
    let value: T | undefined;
    try { value = await test(); } catch {}
    if (value) return value as NonNullable<T>;
    if (Date.now() > end) throw new Error("timeout waiting for " + what);
    await new Promise((r) => setTimeout(r, 25));
  }
}

export function key(target: EventTarget, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

let holder: HTMLDivElement | undefined;

/** Mounts the widget from HTML in edit mode (contenteditable and designMode) or read mode. */
export async function mount(html: string = snippet, edit = false): Promise<WebwriterInteractiveVideo> {
  holder ??= document.body.appendChild(document.createElement("div"));
  holder.innerHTML = html;
  const widget = holder.querySelector("webwriter-interactive-video") as any;
  if (edit) {
    for (const element of holder.querySelectorAll("webwriter-interactive-video, webwriter-video-interaction")) element.setAttribute("contenteditable", "");
    document.designMode = "on";
  } else document.designMode = "off";
  await customElements.whenDefined("webwriter-interactive-video");
  await until(() => widget.videoLoaded && widget.videoPlayer?.duration > 0, "media to load");
  await widget.updateComplete;
  return widget;
}

/** Mounts an empty widget without media. */
export async function mountEmpty(): Promise<any> {
  holder ??= document.body.appendChild(document.createElement("div"));
  holder.innerHTML = "<webwriter-interactive-video></webwriter-interactive-video>";
  const widget = holder.querySelector("webwriter-interactive-video") as any;
  await widget.updateComplete;
  return widget;
}

export function cleanup() {
  document.designMode = "off";
  getSelection()?.removeAllRanges();
  holder?.remove();
  holder = undefined;
}

export const bar = (w: any) => w.shadowRoot.querySelector("video-controls-bar");
export const blocks = (w: Element) => [...w.querySelectorAll(':scope > script[type="application/json"]')] as HTMLScriptElement[];
export const mainBlock = (w: Element) => blocks(w).find((b) => !b.hasAttribute("data-video-chapters"))!;
export const settle = async (w: any) => { await w.updateComplete; await new Promise((r) => setTimeout(r, 50)); await w.updateComplete; };
