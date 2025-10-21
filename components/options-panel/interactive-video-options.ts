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
  SlDialog,
  SlCheckbox,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

// CSS
import styles from "./interactive-video-options.styles";

// Icons
import movie from "@tabler/icons/outline/movie.svg";
import headphones from "@tabler/icons/outline/headphones.svg";
import timelineEvent from "@tabler/icons/outline/timeline-event.svg";
import trash from "@tabler/icons/outline/trash.svg";
import youtubeIcon from "@tabler/icons/filled/brand-youtube.svg";
import spotifyIcon from "@tabler/icons/filled/brand-spotify.svg";
import vimeoIcon from "@tabler/icons/filled/brand-vimeo.svg";
import tiktokIcon from "@tabler/icons/filled/brand-tiktok.svg";

// Util
import { formatTime, parseTime } from "../../utils/timeFormatter";
import type { WwVideoInteraction } from "../../widgets/webwriter-video-interaction/webwriter-video-interaction";
import { WebwriterInteractiveVideo } from "../../widgets/webwriter-interactive-video/webwriter-interactive-video";
import { msg } from "@lit/localize";

export class InteractiveVideoOptions extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  @property({ attribute: false })
  accessor videoContext: InteractiveVideoContext;

  @property({ type: Object, attribute: true, reflect: false })
  accessor selectedInteraction: WwVideoInteraction = undefined;

  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  @property({ type: String })
  accessor interactionXPos: string = "0";
  @property({ type: String })
  accessor interactionYPos: string = "0";
  @property({ type: String })
  accessor interactionWidth: string = "0";
  @property({ type: String })
  accessor interactionHeight: string = "0";

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

  //import CSS
  static styles = [styles];

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has("selectedInteraction")) {
      this.updateInteractionProperties();

      this.selectedInteraction?.addEventListener("positionChanged", () => {
        this.updateInteractionProperties();
      });
    }
  }

  private updateInteractionProperties() {
    if (this.selectedInteraction) {
      this.interactionXPos = String(Math.round(this.selectedInteraction.posX * 100) / 100 || 0);
      this.interactionYPos = String(Math.round(this.selectedInteraction.posY * 100) / 100 || 0);
      this.interactionWidth = String(Math.round(this.selectedInteraction.width / this.selectedInteraction.videoBaseWidth * 10000) / 100 || 0);
      this.interactionHeight = String(Math.round(this.selectedInteraction.height / this.selectedInteraction.videoBaseHeight * 10000) / 100 || 0);
    }
  }

  render() {
    const parent = this.parentNode; // Get parent
    const root = parent.getRootNode(); // Get shadowRoot or document

    if (this.videoContext?.selectedInteractionID !== -1) {
      if (root instanceof ShadowRoot) {
        const slot = root.querySelector("slot"); // Find the slot
        if (slot) {
          const assignedElements = slot.assignedElements();
          const hasVideoInteraction = assignedElements.some(
            (el) =>
              el.tagName.toLowerCase() ===
              "webwriter-video-interaction"
          );
          //
          if (hasVideoInteraction) {
            const interaction = assignedElements.filter(
              (interaction) =>
                String(interaction.id) ===
                String(this.videoContext?.selectedInteractionID)
            )[0] as WwVideoInteraction;

            this.selectedInteraction = interaction;
          }
          //
          else {
            // The parentNode's shadow root belongs to a WwVideoInteraction component
            const parentComponent = root.host;

            if (parentComponent.tagName.toLowerCase() === 'webwriter-video-interaction') {
              this.selectedInteraction = parentComponent as WwVideoInteraction;
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
              <div
                style="display:flex; flex-direction: column; gap: 10px;"
              >
                <div class="header">
                  ${this.isAudio() ? html`
                    <sl-icon src=${headphones}></sl-icon>
                    <p>${msg("Audio")}</p>
                  ` : html`
                    <sl-icon src=${movie}></sl-icon>
                    <p>${msg("Video")}</p>
                  `}
                </div>
                ${this.videoContext.videoDetails ? html`
                  <div class="video-details">
                    <p class="video-title" title=${this.videoContext?.videoDetails.title}>${this.videoContext?.videoDetails.title}</p>
                    <p class="video-author" title=${this.videoContext?.videoDetails.author}>${this.videoContext?.videoDetails.author}</p>
                    <div class="video-source">
                      ${this.renderSourceInfo()}
                    </div>
                  </div>
                  <sl-button
                    size="small"
                    @click=${() => {
                      this.dispatchEvent(new CustomEvent("showRemoveVideoDialog", {
                        bubbles: true,
                        composed: true,
                      }));
                    }}
                    >${this.isAudio() ? msg("Remove audio") : msg("Remove video")}</sl-button
                  >
                ` : null }
                <sl-switch
                  @sl-change=${this.handleShowOverlayChange}
                  class="temporary-teacher-options"
                  ?checked=${this.videoContext?.showOverlay}
                  >${msg("Show Popups")}</sl-switch
                >
                <sl-switch
                  @sl-change=${this
                    .handleEnableChaptersChange}
                  class="temporary-teacher-options"
                  ?checked=${this.videoContext?.hasChapters}
                  >${msg("Enable chapters")}</sl-switch
                >
                ${!["spotify", "tiktok"].includes(this.videoContext?.videoType) ? html`
                  <sl-switch
                    @sl-change=${this.handleAllowPlaybackRateChangeChage}
                    class="temporary-teacher-options"
                    ?checked=${this.videoContext?.allowPlaybackRateChange}
                    >${msg("Allow playback rate change")}</sl-switch
                  >
                ` : null }
                  
              </div>

              <!--  -->
              <div
                style="display:flex; flex-direction: column; gap: 10px; "
              >
                ${this.selectedInteraction !== undefined
                  ? html` <!--  -->
                      <div class="header">
                        <sl-icon
                          src=${timelineEvent}
                        ></sl-icon>
                        <p>${msg("Interaction")}</p>
                        <p style="margin-left: auto">
                          ID:
                          ${this.selectedInteraction
                            ?.id + 1}
                        </p>
                      </div>
                      <div
                        id="overlay-interaction-settings"
                      >
                        <sl-input
                          id="overlay-start-time-input"
                          label=${msg("Start Time")}
                          size="small"
                          value=${formatTime(
                            this.selectedInteraction
                              ?.startTime
                          )}
                          @sl-change=${this
                            .handleStartTimeInputChange}
                        ></sl-input>
                        <sl-input
                          id="overlay-end-time-input"
                          label=${msg("End Time")}
                          size="small"
                          value=${formatTime(
                            this.selectedInteraction
                              ?.endTime
                          )}
                          @sl-change=${this
                            .handleEndTimeInputChange}
                        ></sl-input>
                        <sl-switch
                          @sl-change=${(e: CustomEvent) => {
                            const target = e.target as SlSwitch;
                            this.selectedInteraction.noInitialPause = !target.checked;
                            this.selectedInteraction.hasPaused = false;
                            this.selectedInteraction.requestUpdate();
                          }}
                          class="temporary-teacher-options"
                          ?checked=${!this.selectedInteraction?.noInitialPause}
                          >${msg("Pause video when shown")}</sl-switch
                        >
                        <div>
                          <p
                            style="font-size: 17px; margin: 0px; padding: 0px; margin-bottom: 5px; font-size: 14px;"
                          >
                            ${msg(
                              "Background Color"
                            )}
                          </p>
                          <sl-color-picker
                            label=${msg(
                              "Overlay Color"
                            )}
                            id="color-picker"
                            size="small"
                            value=${getComputedStyle(
                              this
                                .selectedInteraction
                            ).backgroundColor}
                            @sl-change=${this
                              .handleOverlayColorChange}
                          ></sl-color-picker>
                        </div>
                        <sl-details
                          summary=${msg(
                            "Advanced Options"
                          )}
                        >
                          <div
                            style="display: flex; flex-direction: column; gap: 10px;"
                          >
                            <sl-input
                              label=${msg(
                                "X Position"
                              )}
                              id="overlay-x-position-input"
                              type="number"
                              min="0"
                              .max=${100 - Number(this.interactionWidth)}
                              .value=${this.interactionXPos}
                              @sl-input=${(e: CustomEvent) => {
                                const newValue = parseFloat((e.target as SlInput).value) || 0;
                                this.interactionXPos = String(newValue);
                                this.selectedInteraction.posX = newValue;
                              }}
                              size="small"
                            >
                            </sl-input>
                            <sl-input
                              label=${msg(
                                "Y Position"
                              )}
                              id="overlay-y-position-input"
                              type="number"
                              min="0"
                              .max=${100 - Number(this.interactionHeight)}
                              .value=${this.interactionYPos}
                              @sl-input=${(e: CustomEvent) => {
                                const newValue = parseFloat((e.target as SlInput).value) || 0;
                                this.interactionYPos = String(newValue);
                                this.selectedInteraction.posY = newValue;
                              }}
                              size="small"
                            >
                            </sl-input>
                            <sl-input
                              label=${msg(
                                "Width"
                              )}
                              id="overlay-width-input"
                              type="number"
                              min="10"
                              .max=${100 - Number(this.interactionXPos)}
                              .value=${this.interactionWidth}
                              @sl-input=${(e: CustomEvent) => {
                                const newValue = parseFloat((e.target as SlInput).value) || 0;
                                this.interactionWidth = String(newValue);
                                this.selectedInteraction.width = (newValue / 100 * this.selectedInteraction.videoBaseWidth) || 0;
                              }}
                              size="small"
                            >
                            </sl-input>
                            <sl-input
                              label=${msg(
                                "Height"
                              )}
                              id="overlay-height-input"
                              type="number"
                              min="10"
                              .max=${100 - Number(this.interactionYPos)}
                              .value=${this.interactionHeight}
                              @sl-input=${(e: CustomEvent) => {
                                const newValue = parseFloat((e.target as SlInput).value) || 0;
                                this.interactionHeight = String(newValue);
                                this.selectedInteraction.height = (newValue / 100 * this.selectedInteraction.videoBaseHeight) || 0;
                              }}
                              size="small"
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
                          <sl-icon
                            slot="prefix"
                            src=${trash}
                          ></sl-icon>
                          ${msg("Delete")}
                        </sl-button>
                      </div>`
                  : html` <!--  -->
                      <div class="header">
                        <sl-icon
                          src=${timelineEvent}
                        ></sl-icon>
                        <p>${msg("Interaction")}</p>
                      </div>
                      <p
                        style="padding: 0px; margin: 0px; font-size: 14px;"
                      >
                        ${msg(
                          "Select an interaction to view details"
                        )}
                      </p>`}
              </div>`
          : null}
      </div>
    `;
  }

  renderSourceInfo() {
    switch (this.videoContext.videoType) {
      case "youtube":
        return html`<sl-icon
          .src=${youtubeIcon}
        ></sl-icon>
        <p>YouTube</p>`;
      case "spotify":
        return html`<sl-icon
          .src=${spotifyIcon}
        ></sl-icon>
        <p>Spotify</p>`;
      case "vimeo":
        return html`<sl-icon
          .src=${vimeoIcon}
        ></sl-icon>
        <p>Vimeo</p>`;
      case "tiktok":
        return html`<sl-icon
          .src=${tiktokIcon}
        ></sl-icon>
        <p>TikTok</p>`;
      case "htmlvideo":
        return html`<sl-icon
          .src=${movie}
        ></sl-icon>
        <p>${msg("Video File")}</p>`;
      case "htmlaudio":
        return html`<sl-icon
          .src=${headphones}
        ></sl-icon>
        <p>${msg("Audio File")}</p>`;
      default:
        return null;
    }
  }

  isAudio() {
    return ["spotify", "htmlaudio"].includes(this.videoContext?.videoType);
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
      this.selectedInteraction.parentNode.removeChild(
        this.selectedInteraction
      );
    }
  }

  /**
   * Handles the change event when teacher options for showing Overlays is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowOverlayChange = (e: CustomEvent) => {
    const target = e.target as SlSwitch;
    this.dispatchEvent(
      new CustomEvent("setShowOverlay", {
        bubbles: true,
        composed: true,
        detail: { value: target.checked },
      })
    );

    this.requestUpdate();
  };

  /**
   * Handles the change event when teacher options for enabling chapters is triggered.
   *
   * @param e - The custom event object.
   */
  handleEnableChaptersChange = (e: CustomEvent) => {
    const target = e.target as SlSwitch;
    this.dispatchEvent(
      new CustomEvent("setHasChapters", {
        bubbles: true,
        composed: true,
        detail: { value: target.checked },
      })
    );

    if (
      target.checked &&
      this.videoContext.chapterConfig.length === 0
    ) {
      this.dispatchEvent(
        new CustomEvent("setChapterConfig", {
          bubbles: true,
          composed: true,
          detail: { value: [
            {
              title: `${msg("Chapter")} 1`,
              startTime: 0,
            },
          ]},
        })
      );
    } else if (!this.videoContext.hasChapters) {
      this.dispatchEvent(
        new CustomEvent("closeChaptersDrawer", {
          bubbles: true,
          composed: true,
        })
      );
    }

    this.requestUpdate();
  };

  handleAllowPlaybackRateChangeChage = (e: CustomEvent) => {
    const target = e.target as SlSwitch;
    this.dispatchEvent(
      new CustomEvent("setAllowPlaybackRateChange", {
        bubbles: true,
        composed: true,
        detail: { value: target.checked },
      })
    );

    this.requestUpdate();
  };

  /*


  */
  handleStartTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    // console.log(e);
    const newTime = parseTime(input.value);
    if (newTime !== null) {
      //update bauble time

      if (newTime < this.selectedInteraction.endTime) {
        this.selectedInteraction.startTime = newTime;
        this.selectedInteraction.setAttribute(
          "startTime",
          String(newTime)
        );

        input.value = formatTime(newTime);

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction
            .parentNode as WebwriterInteractiveVideo
        ).updateBaublePositions();

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction
            .parentNode as WebwriterInteractiveVideo
        ).videoPlayer.currentTime = this.selectedInteraction.startTime;
      } else {
        console.error("The Start Time must be before the End Time.");
        input.value = formatTime(this.selectedInteraction.startTime);
      }
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
      input.value = formatTime(this.selectedInteraction.startTime);
    }
  };

  /*


  */
  handleEndTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    // console.log(e);
    const newTime = parseTime(input.value);
    if (newTime !== null) {
      //update bauble time

      if (newTime > this.selectedInteraction.startTime) {
        this.selectedInteraction.endTime = newTime;
        this.selectedInteraction.setAttribute(
          "endTime",
          String(newTime)
        );

        input.value = formatTime(newTime);

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction
            .parentNode as WebwriterInteractiveVideo
        ).updateBaublePositions();

        // // change bauble positions to reflect new time and request an update
        (
          this.selectedInteraction
            .parentNode as WebwriterInteractiveVideo
        ).videoPlayer.currentTime = this.selectedInteraction.startTime;
      } else {
        console.error("The End Time must be after the Start Time.");
        input.value = formatTime(this.selectedInteraction.endTime);
      }
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
      input.value = formatTime(this.selectedInteraction.endTime);
    }
  };

  /**
   * Handles the change event when the overlay color is changed.
   *
   * @param e - The custom event containing the color picker target.
   */
  handleOverlayColorChange(e: CustomEvent) {
    const colorPicker = e.target as SlColorPicker;
    this.selectedInteraction.style.backgroundColor = String(
      colorPicker.value
    );
  }
}
