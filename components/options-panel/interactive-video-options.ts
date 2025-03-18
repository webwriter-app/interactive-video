import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlSwitch,
  SlIcon,
  SlColorPicker,
  SlDetails,
  SlInput,
  SlButton,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

//CSS
import styles from "./interactive-video-options.styles";
//Icons
import movie from "@tabler/icons/outline/movie.svg";
import timelineEvent from "@tabler/icons/outline/timeline-event.svg";
import trash from "@tabler/icons/outline/trash.svg";

//Util
import { formatTime, parseTime } from "../../utils/timeFormatter";
import { WwVideoInteraction } from "../../widgets/webwriter-video-interaction/webwriter-video-interaction.component";
import { WebwriterInteractiveVideo } from "../../widgets/webwriter-interactive-video/webwriter-interactive-video.component";

export class InteractiveVideoOptions extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  @property({ attribute: false })
  accessor videoContext: InteractiveVideoContext;

  @property({ type: Object, attribute: true, reflect: false })
  accessor selectedInteraction: WwVideoInteraction = undefined;

  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

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
      "sl-input": SlInput,
      "sl-details": SlDetails,
      "sl-color-picker": SlColorPicker,
      "sl-button": SlButton,
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
    const parent = this.parentNode; // Get parent
    const root = parent.getRootNode(); // Get shadowRoot or document

    if (this.videoContext?.selectedInteractionID !== -1) {
      console.log("test");
      if (root instanceof ShadowRoot) {
        const slot = root.querySelector("slot"); // Find the slot
        if (slot) {
          const assignedElements = slot.assignedElements();
          const hasVideoInteraction = assignedElements.some(
            (el) => el.tagName.toLowerCase() === "webwriter-video-interaction"
          );
          //
          if (hasVideoInteraction) {
            const interaction = assignedElements.filter(
              (interaction) =>
                interaction.id ===
                String(this.videoContext?.selectedInteractionID)
            )[0] as WwVideoInteraction;

            this.selectedInteraction = interaction;
          }
          //
          else {
            // The parentNode's shadow root belongs to a WwVideoInteraction component
            const parentComponent = root.host;

            if (parentComponent instanceof WwVideoInteraction) {
              this.selectedInteraction = parentComponent;
            }
          }
        }
      }
    } else {
      this.selectedInteraction = undefined;
    }

    return html`
      <div
        style="display:flex; flex-direction: column; gap: 30px; "
        id="temporary-teacher-options-container"
        class="author-only"
      >
        ${this.videoContext?.videoLoaded
          ? html` <!--  -->
              <div style="display:flex; flex-direction: column; gap: 10px;">
                <div class="header">
                  <sl-icon src=${movie}></sl-icon>
                  <p>Video</p>
                </div>
                <sl-switch
                  @sl-change=${this.handleShowOverlayChange}
                  class="temporary-teacher-options"
                  ?checked=${this.videoContext?.showOverlay}
                  >Show Popups</sl-switch
                >
              </div>

              <!--  -->
              <div style="display:flex; flex-direction: column; gap: 10px; ">
                ${this.selectedInteraction !== undefined
                  ? html` <!--  -->
                      <div class="header">
                        <sl-icon src=${timelineEvent}></sl-icon>
                        <p>Interaction</p>
                        <p style="margin-left: auto">
                          ID: ${this.selectedInteraction?.id}
                        </p>
                      </div>
                      <div id="overlay-interaction-settings">
                        <sl-input
                          id="overlay-start-time-input"
                          label="Start Time"
                          size="small"
                          value=${formatTime(
                            this.selectedInteraction?.startTime
                          )}
                          @sl-change=${this.handleStartTimeInputChange}
                        ></sl-input>
                        <sl-input
                          id="overlay-end-time-input"
                          label="End Time"
                          size="small"
                          value=${formatTime(this.selectedInteraction?.endTime)}
                          @sl-change=${this.handleEndTimeInputChange}
                        ></sl-input>
                        <div>
                          <p
                            style="font-size: 17px; margin: 0px; padding: 0px; margin-bottom: 5px; font-size: 14px;"
                          >
                            Background Color
                          </p>
                          <sl-color-picker
                            label="Overlay Color"
                            id="color-picker"
                            size="small"
                            value=${getComputedStyle(this.selectedInteraction)
                              .backgroundColor}
                            @sl-change=${this.handleOverlayColorChange}
                          ></sl-color-picker>
                        </div>
                        <sl-details summary="Advanced Options">
                          <div
                            style="display: flex; flex-direction: column; gap: 10px;"
                          >
                            <sl-input
                              label="X Position"
                              id="overlay-x-position-input"
                              type="number"
                              value=${parseInt(
                                getComputedStyle(this.selectedInteraction).left,
                                10
                              ) || 0}
                              size="small"
                            >
                            </sl-input>
                            <sl-input
                              label="Y Position"
                              id="overlay-y-position-input"
                              type="number"
                              value=${parseInt(
                                getComputedStyle(this.selectedInteraction).top,
                                10
                              ) || 0}
                              size="small"
                            >
                            </sl-input>
                            <sl-input
                              label="Width"
                              id="overlay-width-input"
                              type="number"
                              size="small"
                              value=${parseInt(
                                getComputedStyle(this.selectedInteraction)
                                  .width,
                                10
                              ) || 0}
                            >
                            </sl-input>
                            <sl-input
                              label="Height"
                              id="overlay-height-input"
                              type="number"
                              size="small"
                              value=${parseInt(
                                getComputedStyle(this.selectedInteraction)
                                  .height,
                                10
                              ) || 0}
                            >
                            </sl-input>
                          </div>
                        </sl-details>
                        <sl-button
                          slot="footer"
                          style="margin-left: auto; width: 100px"
                          variant="danger"
                          outline
                          @click=${this.deleteElement}
                        >
                          <sl-icon slot="prefix" src=${trash}></sl-icon>
                          Delete
                        </sl-button>
                      </div>`
                  : html` <!--  -->
                      <div class="header">
                        <sl-icon src=${timelineEvent}></sl-icon>
                        <p>Interaction</p>
                      </div>
                      <p style="padding: 0px; margin: 0px; font-size: 14px;">
                        Select an interaction to view details
                      </p>`}
              </div>`
          : null}
      </div>
    `;
  }

  //
  //
  //
  deleteElement() {
    if (this.selectedInteraction) {
      this.dispatchEvent(
        new CustomEvent("updateContext", {
          bubbles: true,
          composed: true,
        })
      );
      this.selectedInteraction.parentNode.removeChild(this.selectedInteraction);
    }
  }

  /**
   * Handles the change event when teacher options for showing Overlays is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowOverlayChange = (e: CustomEvent) => {
    console.log("sl-switch");
    const target = e.target as SlSwitch;
    this.videoContext = { ...this.videoContext, showOverlay: target.checked };

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
    this.requestUpdate();
  };

  /*


  */
  handleStartTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    console.log(e);
    const newTime = parseTime(input.value);
    if (newTime !== null) {
      //update bauble time

      if (newTime < this.selectedInteraction.endTime) {
        this.selectedInteraction.startTime = newTime;
        this.selectedInteraction.setAttribute("startTime", String(newTime));

        input.value = formatTime(newTime);

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction.parentNode as WebwriterInteractiveVideo
        ).updateBaublePositions();

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction.parentNode as WebwriterInteractiveVideo
        ).videoElement.currentTime = this.selectedInteraction.startTime;
      } else {
        console.error("The Start Time must be before the End Time.");
        input.value = formatTime(this.selectedInteraction.startTime);
      }
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
    }
  };

  /*


  */
  handleEndTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    console.log(e);
    const newTime = parseTime(input.value);
    if (newTime !== null) {
      //update bauble time

      if (newTime > this.selectedInteraction.startTime) {
        this.selectedInteraction.endTime = newTime;
        this.selectedInteraction.setAttribute("endTime", String(newTime));

        input.value = formatTime(newTime);

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction.parentNode as WebwriterInteractiveVideo
        ).updateBaublePositions();

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction.parentNode as WebwriterInteractiveVideo
        ).videoElement.currentTime = this.selectedInteraction.startTime;
      } else {
        console.error("The End Time must be after the Start Time.");
        input.value = formatTime(this.selectedInteraction.endTime);
      }
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
    }
  };

  /**
   * Handles the change event when the overlay color is changed.
   *
   * @param e - The custom event containing the color picker target.
   */
  handleOverlayColorChange(e: CustomEvent) {
    const colorPicker = e.target as SlColorPicker;
    this.selectedInteraction.style.backgroundColor = String(colorPicker.value);
  }
}
