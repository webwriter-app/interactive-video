import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import { SlCheckbox } from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

//CSS
import styles from "./interactive-video-options.styles";

export class InteractiveVideoOptions extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  @property({ attribute: false })
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
    };
  }

  /*

  */
  //import CSS
  static styles = [styles];

  /*

  */
  firstUpdated() {}
  /*

  */
  render() {
    return html`
      <div
        style="display:flex; flex-direction: column; gap: 10px; "
        id="temporary-teacher-options-container"
        class="author-only"
      >
        <sl-checkbox
          @sl-change=${this.handleShowInteractionsChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          ?checked=${this.videoContext.showInteractions}
          >Show Interactions</sl-checkbox
        >
        <sl-checkbox
          checked
          @sl-change=${this.handleShowOverlayChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          ?checked=${this.videoContext.showOverlay}
          >Show Overlays</sl-checkbox
        >
        <sl-checkbox
          @sl-change=${this.handleHasChaptersChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          ?checked=${this.videoContext.hasChapters}
          >Has Chapters</sl-checkbox
        >
      </div>
    `;
  }

  /**
   * Handles the change event when the "hasChapters" checkbox is toggled.
   * @param e - The custom event object.
   */
  handleHasChaptersChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.videoContext.hasChapters = target.checked;

    if (
      this.videoContext.hasChapters &&
      JSON.parse(this.videoContext.chapterConfig).length === 0
    ) {
      this.videoContext.chapterConfig = JSON.stringify([
        {
          title: "Chapter 1",
          startTime: 0,
        },
      ]);
    } else if (!this.videoContext.hasChapters) {
      this.videoContext.chapterConfig = JSON.stringify([{}]);
    }

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handles the change event when teacher options for showing Overlays is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowOverlayChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.videoContext.showOverlay = target.checked;

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handles the change event when teacher options for showing interactions is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowInteractionsChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.videoContext.showInteractions = target.checked;

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  };
}
