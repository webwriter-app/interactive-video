import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import { SlSwitch, SlIcon } from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

//CSS
import styles from "./interactive-video-options.styles";

import movie from "@tabler/icons/outline/movie.svg";

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
      "sl-switch": SlSwitch,
      "sl-icon": SlIcon,
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
        <div class="header">
          <sl-icon src=${movie}></sl-icon>
          <p>Options</p>
        </div>
        <sl-switch
          checked
          @sl-change=${this.handleShowOverlayChange}
          class="temporary-teacher-options"
          ?checked=${this.videoContext.showOverlay}
          >Show Interactions</sl-switch
        >
      </div>
    `;
  }

  /**
   * Handles the change event when teacher options for showing Overlays is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowOverlayChange = (e: CustomEvent) => {
    const target = e.target as SlSwitch;
    this.videoContext.showOverlay = target.checked;

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  };
}
