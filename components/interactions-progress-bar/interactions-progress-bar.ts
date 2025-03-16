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

import { videoData } from "../../types/videoData";

import { WwInteractiveBauble } from "../../widgets/webwriter-interactive-bauble/webwriter-interactive-bauble.component";

import { consume } from "@lit/context";

import add from "@tabler/icons/outline/timeline-event-plus.svg";

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
          @drop=${this.handleBaubleDroppedOnAdd}
          ?disabled=${!this.isContentEditable}
        >
          <sl-icon
            slot="prefix"
            src=${add}
            style="height: 20px; width: 20px;"
          ></sl-icon>
          Add Interaction
        </sl-button>

        <div
          id="drop-area"
          @drop=${this.handleBaubleDroppedOnDropArea}
          @dragover=${this.handleBaubleDraggedOverDropArea}
          @dragleave=${this.handleBaubleLeaveDropArea}
        >
          <div id="controls-upper">
            ${Array.from(this.videoContext.videoInteractionData.entries()).map(
              ([key, value]) => {
                return value.isReplace
                  ? html` <!--  -->
                      <webwriter-interactive-bauble
                        style="border-radius: 50%;"
                        offset=${this.calculateOffset(value.startTime)}
                        @dragstart=${this.handleBaubleDragStart}
                        @dragend=${this.handleBaubleDragEnd}
                        draggable="true"
                        @click=${this.handleBaubleClick}
                        id=${key}
                      >
                      </webwriter-interactive-bauble>`
                  : html` <!--  -->
                      <webwriter-interactive-bauble
                        style=""
                        offset=${this.calculateOffset(value.startTime)}
                        @dragstart=${this.handleBaubleDragStart}
                        @dragend=${this.handleBaubleDragEnd}
                        draggable="true"
                        @click=${this.handleBaubleClick}
                        id=${key}
                      >
                      </webwriter-interactive-bauble>`;
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
   */
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;

    console.log("test");
    const videoElement = this.parentNode.parentNode.querySelector(
      "#video"
    ) as HTMLVideoElement;

    videoElement.currentTime = this.videoContext.videoInteractionData.get(
      clickedElement.id
    ).startTime;

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
    e.dataTransfer.setData(
      "previousActive",
      `${this.videoContext.activeElement}`
    );
    //this.changeActiveElement((e.target as WwInteractiveBauble).id);

    this.dispatchEvent(
      new CustomEvent("changeAddToTrash", {
        bubbles: true,
        composed: true,
      })
    );
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
      new CustomEvent("changeInteractionTime", {
        detail: {
          newTime: Math.floor(
            videoElement.duration * (distanceFromLeft / rect.width)
          ),
          index: parseInt(e.dataTransfer.getData("id")),
          isReplace: this.videoContext.videoInteractionData.get(
            parseInt(e.dataTransfer.getData("id"))
          ).isReplace,
        },
        bubbles: true,
        composed: true,
      })
    );

    this.dropArea.style.background = "none";

    this.dispatchEvent(
      new CustomEvent("changeTrashToAdd", {
        bubbles: true,
        composed: true,
      })
    );

    // this.changeActiveElement(
    //   parseInt(e.dataTransfer.getData("previousActive"))
    // );
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
    // this.changeActiveElement(
    //   parseInt(e.dataTransfer.getData("previousActive"))
    // );
    this.dispatchEvent(
      new CustomEvent("changeTrashToAdd", {
        bubbles: true,
        composed: true,
      })
    );

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
        const data = this.videoContext.videoInteractionData.get(id);
        if (data) {
          const newOffset = this.calculateOffset(data.startTime);
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

    const videoElement = this.parentNode.parentNode.querySelector(
      "#video"
    ) as HTMLVideoElement;

    console.log(videoElement);

    console.log(
      (time / videoElement.duration) *
        0.95 *
        videoElement.getBoundingClientRect().width
    );

    return (
      (time / videoElement.duration) *
      0.95 *
      videoElement.getBoundingClientRect().width
    );
  }

  /**
   * Handles the click event for the add button.
   */
  handleAddClick = () => {
    if (!this.videoContext.videoLoaded) return;

    this.dispatchEvent(
      new CustomEvent("toggleInteractionsDrawer", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handles the event when a bauble is dropped on the "add" button.
   * This deletes the object. When the drag event starts the add button turns into a trash can.
   * @param e - The DragEvent object representing the drop event.
   *
   */
  handleBaubleDroppedOnAdd(e: DragEvent) {
    // this.dropArea.style.background = "none";
    // this.deleteElement();
    // this.changeActiveElement(
    //   parseInt(e.dataTransfer.getData("previousActive"))
    // );
    // this.changeTrashToAdd();
    //TODO:
  }
}
