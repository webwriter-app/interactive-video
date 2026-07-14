import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query, state } from "lit/decorators.js";

import {
  SlCheckbox,
  SlDialog,
  SlInput,
  SlIcon,
  SlButton,
} from "@shoelace-style/shoelace";
// @ts-ignore
import "@shoelace-style/shoelace/dist/themes/light.css";

//Tabler
import worldWWW from "@tabler/icons/outline/world-www.svg";
import file from "@tabler/icons/outline/file.svg";
import alertTriangle from "@tabler/icons/outline/alert-triangle.svg";
import videoOff from "@tabler/icons/outline/video-off.svg";

import styles from "./video-input-overlay.styles";
import { msg } from "@lit/localize";
import { youtubeRegex } from "../video-player/video-player";

const supportedTypes = ["video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/aac", "audio/flac", "audio/ogg"];

export class VideoInputOverlay extends LitElementWw {
  @property({ type: Boolean, attribute: "has-video" })
  accessor hasVideo: boolean = false;

  @property({ type: Boolean, attribute: "error" })
  accessor error: boolean = false;

  @property({ attribute: false })
  accessor errorMessage: (() => string) | undefined = undefined;

  @state()
  private accessor fileError: (() => string) | undefined = undefined;

  @query("#url-input")
  private accessor urlInput: SlInput;

  @query("#youtube-disclaimer-dialog")
  private accessor youtubeDisclaimerDialog: SlDialog;

  private pendingYoutubeURL: string | undefined = undefined;

  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */
  static get scopedElements() {
    return {
      "sl-checkbox": SlCheckbox,
      "sl-dialog": SlDialog,
      "sl-input": SlInput,
      "sl-icon": SlIcon,
      "sl-button": SlButton,
    };
  }

  //import CSS
  static styles = [styles];

  /*

  */

  firstUpdated() {}

  private get showErrorOverlay() {
    return this.error && (!this.isContentEditable || this.hasVideo);
  }

  render() {
    if (this.showErrorOverlay) {
      return this.renderErrorOverlay();
    }
    if (!this.isContentEditable) {
      return this.renderNoMediaOverlay();
    }
    return this.renderSelectionOverlay();
  }

  private renderErrorOverlay() {
    return html`
      <div class="overlay status-overlay">
        <sl-icon src=${alertTriangle} class="error-icon"></sl-icon>
        <p class="error-message">
          ${this.errorMessage?.() ??
          msg("The media could not be loaded. Please check the link and your internet connection, then try again.")}
        </p>
        <div class="status-actions">
          <sl-button variant="default" @click=${this.dispatchRetry}>
            ${msg("Try again")}
          </sl-button>
          ${this.isContentEditable
            ? html`
                <sl-button variant="primary" @click=${this.dispatchChooseDifferentSource}>
                  ${msg("Choose a different source")}
                </sl-button>
              `
            : null}
        </div>
      </div>
    `;
  }

  private renderNoMediaOverlay() {
    return html`
      <div class="overlay status-overlay">
        <sl-icon src=${videoOff}></sl-icon>
        <p>${msg("No media has been added here yet.")}</p>
      </div>
    `;
  }

  private renderSelectionOverlay() {
    return html` <div
      class="overlay"
      style="display: flex;
      flex-direction: column;"
      @dragover=${this.handleDragOverFileInputArea}
      @drop=${this.handleDropOnFileInputArea}
    >
      <sl-button
        variant="default"
        @click=${this.triggerFileInput}
      >
        <sl-icon slot="prefix" src=${file}></sl-icon>
        ${msg("Select video or audio file")}
        <input
          name="fileInput"
          id="fileInput"
          type="file"
          accept=${supportedTypes.join(",")}
          @change=${this.handleFileInput}
          style="display: none;"
        />
      </sl-button>

      <p style="color: lightgray">${msg("or")}</p>
      <sl-input
        id="url-input"
        placeholder=${msg("Enter video or audio URL")}
        help-text=${msg("Supported services: YouTube, Vimeo, TikTok, Spotify, direct video/audio links")}
        @sl-change=${this.handleUrlInput}
        style="width: 80%"
      >
        <sl-icon slot="prefix" src=${worldWWW}></sl-icon>
      </sl-input>

      <sl-dialog
        id="youtube-disclaimer-dialog"
        label=${msg("YouTube videos only play on a web server")}
        @sl-after-show=${this.handleYoutubeDisclaimerShow}
        @sl-after-hide=${this.handleYoutubeDisclaimerHide}
      >
        <p>
          ${msg("YouTube only plays embedded videos on pages that are served by a web server. This is a restriction imposed by YouTube, not by WebWriter.")}
        </p>
        <p>
          ${msg("As a result, this video will not load in WebWriter's preview mode and in documents opened directly from a device. To let your students watch it, publish the document to a web server (e.g. WebWriter Cloud) and share the link from there.")}
        </p>
        <p>
          <strong>${msg("If you want to distribute this document as a file rather than through a web server, use a different video source instead of YouTube.")}</strong>
        </p>
        <p>
          ${msg("Videos from other sources and uploaded video or audio files aren't affected by this.")}
        </p>
        <sl-button
          slot="footer"
          variant="text"
          @click=${this.rejectYoutubeDisclaimer}
        >
          ${msg("Choose a different source")}
        </sl-button>
        <sl-button
          slot="footer"
          variant="primary"
          @click=${this.acceptYoutubeDisclaimer}
        >
          ${msg("Use YouTube anyway")}
        </sl-button>
      </sl-dialog>
    </div>`;
  }

  private dispatchRetry = () => {
    this.dispatchEvent(
      new CustomEvent("retryLoad", { bubbles: true, composed: true })
    );
  };

  private dispatchChooseDifferentSource = () => {
    this.dispatchEvent(
      new CustomEvent("chooseDifferentSource", { bubbles: true, composed: true })
    );
  };

  triggerFileInput() {
    const fileInput =
      this.shadowRoot?.getElementById("fileInput") ||
      document.getElementById("fileInput");
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handles the drag over event for the file input area.
   * @param e - The drag event.
   */
  handleDragOverFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handles the drop event on the file input area.
   *
   * @param e - The drag event.
   */
  handleDropOnFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Handles the file input event.
   *
   * @param e - The event object.
   */
  handleFileInput(e: Event) {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  /**
   * Handles the selected file and reads its contents as a data URL.
   * @param file - The file to be handled.
   */
  handleFile(file: File) {
    if (supportedTypes.includes(file.type)) {
      this.fileError = undefined;
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        if (result) {
          this.dispatchEvent(
            new CustomEvent("setupVideoBase64", {
              detail: { src: result },
              bubbles: true,
              composed: true,
            })
          );
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        this.fileError = () => msg("This file could not be read. Please try again or choose a different file.");
      };
      reader.readAsDataURL(file);
    }
    //
    else {
      console.error("Unsupported file type:", file.type);
      this.fileError = () => msg("This file type isn't supported. Please choose an MP4 or WebM video, or an MP3, WAV, AAC, FLAC or OGG audio file.");
    }
  }

  /**
   * Handles the input event for the URL input field.
   *
   * @param e - The CustomEvent object representing the input event.
   */
  handleUrlInput(e: CustomEvent) {
    const input = e.target as SlInput;
    const url = input.value;
    if (!url) {
      return;
    }
    if (youtubeRegex.test(url)) {
      this.pendingYoutubeURL = url;
      this.youtubeDisclaimerDialog.show();
      return;
    }
    this.dispatchVideoURL(url);
  }

  /**
   * Handles the event when the YouTube disclaimer dialog is shown.
   */
  private handleYoutubeDisclaimerShow() {
    this.ownerDocument.documentElement.classList.remove("sl-scroll-lock");
  }

  /**
   * Handles the event when the YouTube disclaimer dialog is accepted by the user.
   */
  private acceptYoutubeDisclaimer() {
    const url = this.pendingYoutubeURL;
    this.pendingYoutubeURL = undefined;
    this.youtubeDisclaimerDialog.hide();
    if (url) {
      this.dispatchVideoURL(url);
    }
  }

  /**
   * Discards the YouTube video the disclaimer was shown for.
   */
  private rejectYoutubeDisclaimer() {
    this.youtubeDisclaimerDialog.hide();
  }

  /**
   * Resets the URL input when the disclaimer is dismissed without being accepted,
   * be it via the "Choose a different source" button, the close button or the keyboard.
   */
  private handleYoutubeDisclaimerHide() {
    if (!this.pendingYoutubeURL) {
      return;
    }
    this.pendingYoutubeURL = undefined;
    this.urlInput.value = "";
    this.urlInput.focus();
  }

  private dispatchVideoURL(url: string) {
    this.fileError = undefined;
    this.dispatchEvent(
      new CustomEvent("setupVideoURL", {
        detail: { src: url },
        bubbles: true,
        composed: true,
      })
    );
  }
}
