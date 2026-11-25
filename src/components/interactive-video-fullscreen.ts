import type { ReactiveController } from "lit";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";

const HIDE_CONTROLS_DELAY_MS = 3000;

/** Fullscreen state of the widget, and the controls that fade out while the pointer rests. */
export class FullscreenController implements ReactiveController {
  active = false;
  controlsVisible = true;

  #controlsHovered = false;
  #timeout: number | null = null;
  #abort = new AbortController();
  #session: AbortController | null = null;

  constructor(private host: WebwriterInteractiveVideo) {
    host.addController(this);
  }

  hostConnected() {
    this.#abort = new AbortController();
    document.addEventListener("fullscreenchange", this.update, { signal: this.#abort.signal });
  }

  hostDisconnected() {
    this.#abort.abort();
    this.#session?.abort();
    this.#session = null;
    this.#clearTimer();
  }

  toggle() {
    if (this.active) {
      document.exitFullscreen();
    } else {
      this.host.requestFullscreen();
    }
  }

  /** Reads the fullscreen state again and repositions what depends on the player's size. */
  update = () => {
    const host = this.host;
    this.active = document.fullscreenElement === host || host.classList.contains("ww-fullscreen");
    host.updateBaublePositions();
    host.videoControlsBar.updateFullscreenIcon(this.active);

    if (this.active) {
      this.#scheduleHide();
      if (!this.#session) {
        this.#session = new AbortController();
        const { signal } = this.#session;
        host.addEventListener("mousemove", this.#handleMouseMove, { signal });
        host.controlsElement.addEventListener("mouseenter", () => { this.#controlsHovered = true; }, { signal });
        host.controlsElement.addEventListener("mouseleave", () => { this.#controlsHovered = false; }, { signal });
      }
    } else {
      this.#session?.abort();
      this.#session = null;
      this.#controlsHovered = false;
      this.controlsVisible = true;
    }
    host.requestUpdate();
  };

  #handleMouseMove = () => {
    this.#show();
    this.#scheduleHide();
  };

  #scheduleHide() {
    this.#clearTimer();
    this.#timeout = window.setTimeout(() => {
      if (this.#controlsHovered || !this.active) return;
      this.controlsVisible = false;
      this.host.videoPlayer.focus();
      this.host.requestUpdate();
    }, HIDE_CONTROLS_DELAY_MS);
  }

  #clearTimer() {
    if (this.#timeout !== null) clearTimeout(this.#timeout);
    this.#timeout = null;
  }

  #show() {
    if (!this.active) return;
    this.controlsVisible = true;
    this.host.requestUpdate();
  }
}
