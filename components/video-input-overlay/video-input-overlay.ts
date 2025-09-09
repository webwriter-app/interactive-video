import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlCheckbox,
  SlInput,
  SlIcon,
  SlButton,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import { consume } from "@lit/context";

//Tabler
import worldWWW from "@tabler/icons/outline/world-www.svg";
import file from "@tabler/icons/outline/file.svg";

import styles from "./video-input-overlay.styles";
import { msg } from "@lit/localize";

const supportedTypes = ["video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/aac", "audio/flac", "audio/ogg"];

export class VideoInputOverlay extends LitElementWw {
  @property({ type: Boolean, attribute: "error" })
  accessor error: boolean = false;

  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */
  static get scopedElements() {
    return {
      "sl-checkbox": SlCheckbox,
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

  render() {
    return html` <div
      class="overlay"
      style="display: flex;
      flex-direction: column;"
      @dragover=${this.handleDragOverFileInputArea}
      @drop=${this.handleDropOnFileInputArea}
    >
      ${this.error
        ? html`<p class="error-message">
            ${msg("Error loading video. Please try again.")}
          </p>`
        : null}
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
    </div>`;
  }

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
      };
      reader.readAsDataURL(file);
    }
    //
    else {
      console.error("Unsupported file type:", file.type);
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
    if (url) {
      this.dispatchEvent(
        new CustomEvent("setupVideoURL", {
          detail: { src: url },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}
