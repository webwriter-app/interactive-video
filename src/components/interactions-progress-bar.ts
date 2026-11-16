import { html, css } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { widgetPermissions } from "@webwriter/lit/permissions";
import { query } from "lit/decorators.js";

import {
  videoContext,
  InteractiveVideoContext,
} from "./interactive-video-context";

import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.component.js";
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import "@shoelace-style/shoelace/dist/themes/light.css";
import type { VideoPlayer } from "./video-player";

import type { WebwriterVideoInteraction } from "../widgets/webwriter-video-interaction";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";

import { WwInteractiveBauble } from "./webwriter-interactive-bauble";

import { consume } from "@lit/context";

import add from "@tabler/icons/outline/timeline-event-plus.svg";
import bookmark from "@tabler/icons/filled/bookmark.svg";

//CSS
import styles from "./interactions-progress-bar.styles";

export class InteractionsProgressBar extends LitElementWw {
  readonly #permissions = widgetPermissions(this);
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @query("#drop-area")
  accessor dropArea: HTMLDivElement;

  @query("#controls-upper")
  accessor upperControls: HTMLDivElement;

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

  private resizeObserver: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => {
      this.updateBaublePositions();
    });
    this.updateComplete.then(() => {
      this.resizeObserver.observe(this);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this);
    }
  }

  render() {
    return html`
      <div class="interactions-progress-bar">
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
                style=${this.#permissions.editing
                  ? "cursor: grab; position: absolute;"
                  : "cursor: pointer; position: absolute;"}
                offset=${this.calculateOffset(
                  interaction.startTime
                )}
                @dragstart=${this.handleBaubleDragStart}
                @dragend=${this.handleBaubleDragEnd}
                draggable=${this.#permissions.editing ? "true" : "false"}
                @click=${this.handleBaubleClick}
                id=${interaction.id}
              >
              </webwriter-interactive-bauble>`;
            })}
            ${this.videoContext.hasChapters ? this.videoContext.chapterConfig.map(
              ({ title, startTime }) => {
                return html`<sl-icon
                  src=${bookmark}
                  style="
                    width: 15px; 
                    height: 15px; 
                    color: #E9E9E9; 
                    position: absolute; 
                    left: ${this.calculateOffset(startTime)}px;
                  "
                  @mouseover=${(e: MouseEvent) => ((e.target as HTMLElement).style.color = "#0084C6")}
                  @mouseleave=${(e: MouseEvent) => ((e.target as HTMLElement).style.color = "#E9E9E9")}
                  @click=${() => {
                    this.dispatchEvent(
                      new CustomEvent("jumpToChapter", {
                        detail: { startTime: startTime },
                        bubbles: true,
                        composed: true,
                      })
                    );
                  }}
                ></sl-icon>`;
              }
            ) : null}
          </div>
        </div>
      </div>
    `;
  }

  /** The video player of the widget; the progress bar sits next to it in the widget's shadow tree. */
  private get videoPlayer(): VideoPlayer | null {
    return this.parentNode?.parentNode?.querySelector<VideoPlayer>("#video") ?? null;
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
    e.dataTransfer?.setData("id", (e.target as WwInteractiveBauble).id);
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

    const videoElement = this.videoPlayer;
    if (!videoElement) return;

    this.dispatchEvent(
      new CustomEvent("changeInteractionStartTime", {
        detail: {
          newTime: Math.floor(
            videoElement.duration * (distanceFromLeft / rect.width) * 1000
          ) / 1000,
          index: parseInt(e.dataTransfer?.getData("id") ?? ""),
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
        )[0];

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
  calculateOffset(time: number): number | undefined {
    if (!this.videoContext.videoLoaded) return;

    const videoElement = this.videoPlayer;
    if (!videoElement) return;

    return (
      (time / videoElement.duration) *
      (this.getBoundingClientRect().width - 38) + 19 /* Padding of 10 on each side + 18px slider thumb */
      - 9 /* Half the width of the bauble (18px / 2 = 9px) */
    );
  }
}
