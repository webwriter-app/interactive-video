import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlCheckbox,
  SlInput,
  SlIcon,
  SlButton,
} from "@shoelace-style/shoelace";
import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

//Tabler
import worldWWW from "@tabler/icons/outline/world-www.svg";
import file from "@tabler/icons/outline/file.svg";

export class VideoInputOverlay extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

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

  /*

  */
  static get styles() {
    return css`
      .overlay {
        position: absolute; /* To overlay the .page div */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(
          0,
          0,
          0,
          0.8
        ); /* Black background with opacity */
        display: flex; /* Flexbox for centering */
        justify-content: center; /* Center horizontally */
        align-items: center; /* Center vertically */
        z-index: 100;
      }

      #file-input-label:hover {
        color: blue;
      }
    `;
  }

  firstUpdated() {}

  render() {
    return html` <div
      class="overlay"
      style="display: flex;
      flex-direction: column;"
    >
      <sl-button
        variant="default"
        style="width: 80%"
        @click=${this.triggerFileInput}
        @dragover=${this.handleDragOverFileInputArea}
        @drop=${this.handleDropOnFileInputArea}
      >
        <sl-icon slot="prefix" src=${file}></sl-icon>
        Click to Select or Drop a Video File
        <input
          name="fileInput"
          id="fileInput"
          type="file"
          accept="video/*"
          @change=${this.handleFileInput}
          style="display: none;"
        />
      </sl-button>

      <p style="color: gray">OR</p>
      <sl-input
        id="url-input"
        placeholder="Enter video URL"
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
    const supportedTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (supportedTypes.includes(file.type)) {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        if (result) {
          this.videoContext.videoBase64 = result;

          this.dispatchEvent(
            new CustomEvent("setupVideo", {
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
      this.videoContext.videoURL = url;

      this.dispatchEvent(
        new CustomEvent("setupVideo", {
          detail: { src: url },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}
