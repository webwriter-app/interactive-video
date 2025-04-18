import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import {
  SlIconButton,
  SlRange,
  SlDropdown,
  SlMenu,
  SlMenuItem,
  SlButton,
  SlIcon,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import { WwVideoInteraction } from "../../widgets/webwriter-video-interaction/webwriter-video-interaction.component";
import { WebwriterInteractiveVideo } from "../../widgets/webwriter-interactive-video/webwriter-interactive-video.component";

import { WwInteractiveBauble } from "../webwriter-interactive-bauble/webwriter-interactive-bauble";

import { consume } from "@lit/context";

import add from "@tabler/icons/outline/timeline-event-plus.svg";
import bookmark from "@tabler/icons/filled/bookmark.svg";

//CSS
import styles from "./interactions-progress-bar.styles";

export class InteractionsProgressBar extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @query("#drop-area")
  accessor dropArea;

  @query("#controls-upper")
  accessor upperControls: HTMLDivElement;

  /**
   * Query for the add interactions button.
   */
  @query("#add-button")
  accessor addButton: SlIconButton;

  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */
  static get scopedElements() {
    return {
      "webwriter-interactive-bauble": WwInteractiveBauble,
      "sl-icon-button": SlIconButton,
      "sl-range": SlRange,
      "sl-dropdown": SlDropdown,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
    };
  }

  //import CSS
  static styles = [styles];

  /*

  */

  //TODO: On resize, the offset of baubles need to be recalculated

  render() {
    return html`
      <div class="interactions-progress-bar">
        <sl-button
          variant="default"
          size="small"
          id="add-button"
          @click=${this.handleAddClick}
          ?disabled=${!this.isContentEditable}
        >
          <sl-icon
            slot="prefix"
            src=${add}
            style="height: 20px; width: 20px;"
          ></sl-icon>
          Add Popup
        </sl-button>

        <div
          id="drop-area"
          @drop=${this.handleBaubleDroppedOnDropArea}
          @dragover=${this.handleBaubleDraggedOverDropArea}
          @dragleave=${this.handleBaubleLeaveDropArea}
        >
          <div id="controls-upper">
            ${Array.from(
              (
                (this.getRootNode() as ShadowRoot)
                  .host as WebwriterInteractiveVideo
              ).videoInteractions
            ).map((interaction) => {
              return html`<webwriter-interactive-bauble
                contenteditable=${this.isContentEditable}
                style=${this.isContentEditable
                  ? "cursor: grab; position: absolute;"
                  : "cursor: pointer; position: absolute;"}
                offset=${this.calculateOffset(
                  (interaction as WwVideoInteraction).startTime
                )}
                @dragstart=${this.handleBaubleDragStart}
                @dragend=${this.handleBaubleDragEnd}
                draggable=${this.isContentEditable ? "true" : "false"}
                @click=${this.handleBaubleClick}
                id=${(interaction as WwVideoInteraction).id}
              >
              </webwriter-interactive-bauble>`;
            })}
            ${Array.from(JSON.parse(this.videoContext.chapterConfig)).map(
              ({ title, startTime }) => {
                return html`
                  ${startTime !== 0
                    ? html` <div
                        style="
                          width: 1px; 
                          height: 15px; 
                          background-color: #E9E9E9; 
                          position: absolute; 
                          offset: ${this.calculateOffset(startTime)}px;
                        "
                      ></div>`
                    : null}
                `;
              }
            )}
            ${Array.from(JSON.parse(this.videoContext.chapterConfig)).map(
              ({ title, startTime }) => {
                return html`
                  ${startTime !== 0
                    ? html` <sl-icon
                        src=${bookmark}
                        style="
                          width: 15px; 
                          height: 15px; 
                          color: #E9E9E9; 
                          position: absolute; 
                          left: ${this.calculateOffset(startTime)}px;
                        "
                        @mouseover=${(e) => (e.target.style.color = "#0084C6")}
                        @mouseleave=${(e) => (e.target.style.color = "#E9E9E9")}
                        @click=${() => {
                          this.dispatchEvent(
                            new CustomEvent("jumpToChapter", {
                              detail: { startTime: startTime },
                              bubbles: true,
                              composed: true,
                            })
                          );
                        }}
                      ></sl-icon>`
                    : null}
                `;
              }
            )}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handles the click event on a bauble element.
   *
   * @param event - The MouseEvent object representing the click event.
   * @remarks
   * This function is called when a bauble is clicked. It checks if the control key is pressed and if so, it sets the video time to the bauble's start time.
   * Otherwise, it calls the clickEventHelper function to handle the click event.
   * 
   *  
   * 
   *  
          
   */
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;

    this.dispatchEvent(
      new CustomEvent("interactionBaubleClicked", {
        detail: { id: clickedElement.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles the drag start event for a bauble.
   *
   * @param e - The drag event.
   */
  handleBaubleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("id", (e.target as WwInteractiveBauble).id);
  };

  /**
   * Handles the event when a bauble is dropped on the drop area.
   *
   * @param e - The DragEvent object representing the drop event.
   * @remarks
   * Dropping a bauble on the drop area changes the corresponding interactions starttime to whatever the bauble was dropped at
   */
  handleBaubleDroppedOnDropArea(e: DragEvent) {
    const rect = this.dropArea.getBoundingClientRect();
    const distanceFromLeft = e.clientX - rect.left;

    const videoElement = this.parentNode.parentNode.querySelector(
      "#video"
    ) as HTMLVideoElement;

    this.dispatchEvent(
      new CustomEvent("changeInteractionStartTime", {
        detail: {
          newTime: Math.floor(
            videoElement.duration * (distanceFromLeft / rect.width)
          ),
          index: parseInt(e.dataTransfer.getData("id")),
        },
        bubbles: true,
        composed: true,
      })
    );

    this.dropArea.style.background = "none";

    this.updateBaublePositions();
  }

  /**
   * Handles the event when a bauble is dragged over the drop area.
   * Changes the background color of the drop area to a semi-transparent gray.
   *
   * @param e - The DragEvent object representing the drag event.
   */
  handleBaubleDraggedOverDropArea(e: DragEvent) {
    this.dropArea.style.background = "rgba(0.5,0.5,0.5,0.5)";
  }

  /**
   * Handles the event when a bauble is dragged out of the drop area.
   * Resets the background of the drop area.
   *
   * @param e - The DragEvent object representing the drag event.
   */
  handleBaubleLeaveDropArea(e: DragEvent) {
    this.dropArea.style.background = "none";
  }

  /**
   * Handles the drag end event for the bauble.
   *
   * @param e - The drag event.
   */
  handleBaubleDragEnd = (e: DragEvent) => {
    this.dropArea.style.background = "none";
  };

  /**
   * Updates the positions of the baubles in the widget.
   */
  updateBaublePositions() {
    if (!this.upperControls) return;
    const children = this.upperControls.children;
    Array.from(children).forEach((child: Element) => {
      if (child instanceof WwInteractiveBauble) {
        const id = parseInt(child.id);

        const slottedInteraction = (
          (this.getRootNode() as ShadowRoot).host as WebwriterInteractiveVideo
        ).videoInteractions.filter(
          (interaction) => Number(interaction.id) === Number(id)
        )[0] as WwVideoInteraction;

        if (slottedInteraction) {
          const newOffset = this.calculateOffset(slottedInteraction.startTime);
          if (newOffset !== undefined) {
            child.setAttribute("offset", `${newOffset}`);
          }
        }
      }
    });
    this.requestUpdate();
  }

  /**
   * Calculates the offset based on the given time.
   *
   * @param time - The time in seconds.
   * @returns The calculated offset.
   */
  calculateOffset(time: number): number {
    if (!this.videoContext.videoLoaded) return;

    console.log(time);

    const videoElement = this.parentNode.parentNode.querySelector(
      "#video"
    ) as HTMLVideoElement;

    return (
      (time / videoElement.duration) *
      0.97 *
      videoElement.getBoundingClientRect().width
    );
  }

  /**
   * Handles the click event for the add button.
   */
  handleAddClick = () => {
    if (!this.videoContext.videoLoaded) return;

    this.dispatchEvent(
      new CustomEvent("addInteraction", {
        bubbles: true,
        composed: true,
      })
    );
  };
}
