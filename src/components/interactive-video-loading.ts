import type { ReactiveController } from "lit";
import { timeoutErrorMessage } from "./media-errors";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";

/** How long a media source may take to become playable before it counts as failed. */
const LOAD_TIMEOUT_MS = 30000;

/** Hands a source to the player and tracks whether it became playable, failed, or took too long. */
export class LoadingController implements ReactiveController {
  failed = false;
  errorMessage: (() => string) | undefined = undefined;

  #timeout: number | null = null;

  constructor(private host: WebwriterInteractiveVideo) {
    host.addController(this);
  }

  hostDisconnected() {
    this.clearTimeout();
  }

  setupBase64(src: string) {
    this.host.videoBase64 = src;
    this.#start();
    this.host.videoPlayer.loadVideoBase64(src);
  }

  setupURL(src: string) {
    this.host.videoURL = src;
    this.#start();
    this.host.videoPlayer.loadVideoURL(src);
  }

  clearTimeout() {
    if (this.#timeout !== null) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }
  }

  /** Forgets an earlier failure. */
  reset() {
    this.failed = false;
    this.errorMessage = undefined;
  }

  /** Loads the current source again, e.g. after a network error. */
  async retry() {
    const { host } = this;
    const base64 = host.videoBase64;
    const url = host.videoURL;
    if (!base64 && !url) return;

    this.clearTimeout();
    this.reset();
    host.videoLoaded = false;
    host.updateContext();

    host.videoPlayer.clearVideo();
    await host.videoPlayer.updateComplete;

    if (base64) {
      this.setupBase64(base64);
    } else {
      this.setupURL(url);
    }
  }

  /** Discards the failed source so the author can pick another one, keeping interactions and chapters. The error message stays visible. */
  chooseDifferentSource() {
    const message = this.errorMessage;
    this.host.clearVideo(false);
    this.failed = true;
    this.errorMessage = message;
    this.host.updateContext();
  }

  handleCanPlay = () => {
    const { host } = this;
    this.clearTimeout();
    if (host.videoLoaded) return;
    host.videoLoaded = true;
    // A player that becomes playable after all (e.g. a slow embed) leaves the error view behind.
    this.reset();
    host.updateContext();
    // The elements have to be rendered before they are set up.
    setTimeout(() => {
      if (host.progressBar) host.progressBar.value = 0;
      if (host.videoPlayer) host.videoPlayer.volume = 1;
      if (host.videoControlsBar.volumeSlider) host.videoControlsBar.volumeSlider.value = 100;
      if (!host.chapterConfig || host.chapterConfig.length === 0) {
        host.chapterConfig = [{ title: `${host.msg("Chapter")} 1`, startTime: 0 }];
      }
      host.updateContext();
    }, 0);
  };

  handleError(error: string, message?: () => string) {
    const { host } = this;
    console.error("Error loading video:", error);
    this.clearTimeout();

    if (this.failed) return;

    host.videoLoaded = false;
    this.failed = true;
    this.errorMessage = message;
    host.interactions.hideAll();

    try {
      host.videoPlayer?.pause();
    } catch { }

    host.updateContext();
  }

  /** Starts the load timeout, so that a source which never becomes playable ends up in the error view instead of a dead player. */
  #start() {
    const { host } = this;
    host.videoLoaded = false;
    this.reset();
    host.updateContext();

    this.clearTimeout();
    this.#timeout = window.setTimeout(() => {
      this.#timeout = null;
      if (host.videoLoaded) return;
      this.handleError("Media did not become playable in time", timeoutErrorMessage(host.msg));
    }, LOAD_TIMEOUT_MS);
  }
}
