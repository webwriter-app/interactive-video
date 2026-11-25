import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

import { LitElementWw } from "@webwriter/lit";
import { widgetPermissions } from "@webwriter/lit/permissions";
import { widgetMsg } from "@webwriter/lit/localize";
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

import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";

import { WwInteractiveBauble } from "./webwriter-interactive-bauble";

import { consume } from "@lit/context";

import bookmark from "@tabler/icons/filled/bookmark.svg";

//CSS
import styles from "./interactions-progress-bar.styles";

export class InteractionsProgressBar extends LitElementWw {
  readonly #permissions = widgetPermissions(this);
  private readonly msg = widgetMsg(this);
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @query("#drop-area")
  accessor dropArea: HTMLDivElement;

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
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
  }

  render() {
    const interactions = ((this.getRootNode() as ShadowRoot).host as WebwriterInteractiveVideo).videoInteractions;
    const chapters = this.videoContext.hasChapters ? this.videoContext.chapterConfig : [];
    return html`
      <div class="interactions-progress-bar">
        <div
          id="drop-area"
          @drop=${this.handleBaubleDroppedOnDropArea}
          @dragover=${this.handleBaubleDraggedOverDropArea}
          @dragleave=${this.handleBaubleLeaveDropArea}
        >
          <div id="controls-upper">
            ${chapters.length ? html`<div class="marker-row">
              ${chapters.map(({ startTime, title }) => html`<button
                type="button"
                class="chapter-mark"
                style="left: ${this.calculateOffset(startTime) ?? 0}px;"
                aria-label=${this.msg("Skip to Chapter") + ": " + title}
                @click=${() => {
                  this.dispatchEvent(new CustomEvent("jumpToChapter", {
                    detail: { startTime },
                    bubbles: true,
                    composed: true,
                  }));
                }}
              ><sl-icon src=${bookmark}></sl-icon></button>`)}
            </div>` : null}
            ${interactions.length ? html`<div class="marker-row">
              ${interactions.map((interaction) => html`<webwriter-interactive-bauble
                offset=${ifDefined(this.calculateOffset(interaction.startTime))}
                @dragstart=${this.handleBaubleDragStart}
                @dragend=${this.handleBaubleDragEnd}
                draggable=${this.#permissions.editing ? "true" : "false"}
                role="button"
                tabindex="0"
                aria-label=${this.msg("Interaction") + " " + (Number(interaction.id) + 1)}
                @click=${this.handleBaubleClick}
                @keydown=${this.handleBaubleKey}
                @pointerdown=${this.handleBaublePointerDown}
                id=${interaction.id}
              ></webwriter-interactive-bauble>`)}
            </div>` : null}
          </div>
        </div>
      </div>
    `;
  }

  /** The video player of the widget; the progress bar sits next to it in the widget's shadow tree. */
  private get videoPlayer(): VideoPlayer | null {
    return this.parentNode?.parentNode?.querySelector<VideoPlayer>("#video") ?? null;
  }

  /** Opens the popup represented by the activated timeline marker. */
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.currentTarget as WwInteractiveBauble;

    this.dispatchEvent(
      new CustomEvent("interactionBaubleClicked", {
        detail: { id: clickedElement.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Enter and Space open the interaction, in edit mode the arrow keys move its start time by one second. */
  handleBaubleKey(event: KeyboardEvent) {
    const bauble = event.currentTarget as WwInteractiveBauble;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      bauble.click();
      return;
    }
    if (!this.#permissions.editing || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    const duration = this.videoPlayer?.duration;
    const interaction = this.#interaction(bauble.id);
    if (!duration || !interaction) return;
    event.preventDefault();
    event.stopPropagation();
    const step = (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 5 : 1);
    const newTime = Math.min(duration, Math.max(0, interaction.startTime + step));
    this.dispatchEvent(
      new CustomEvent("changeInteractionStartTime", {
        detail: { newTime, index: parseInt(bauble.id) },
        bubbles: true,
        composed: true,
      })
    );
    this.updateBaublePositions();
    this.updateComplete.then(() => this.focusBauble(bauble.id));
  }

  /**
   * Moves a bauble by touch or pen, where the browser starts no drag and drop. A mouse keeps using drag and drop.
   * The bauble is moved to where the finger is lifted.
   */
  handleBaublePointerDown(event: PointerEvent) {
    if (!this.#permissions.editing || event.pointerType === "mouse" || !event.isPrimary) return;
    const bauble = event.currentTarget as WwInteractiveBauble;
    const duration = this.videoPlayer?.duration;
    if (!duration) return;
    const startX = event.clientX;
    let moved = false;
    try { bauble.setPointerCapture(event.pointerId); } catch { /* the pointer ended already */ }
    const timeAt = (clientX: number) => {
      const rect = this.dropArea.getBoundingClientRect();
      return Math.floor(duration * Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 1000) / 1000;
    };
    const onMove = (e: PointerEvent) => {
      if (!moved && Math.abs(e.clientX - startX) < 6) return;
      moved = true;
      const offset = this.calculateOffset(timeAt(e.clientX));
      if (offset !== undefined) bauble.style.left = `${offset}px`;
    };
    const finish = (e: PointerEvent) => {
      bauble.removeEventListener("pointermove", onMove);
      bauble.removeEventListener("pointerup", finish);
      bauble.removeEventListener("pointercancel", finish);
      if (bauble.hasPointerCapture?.(e.pointerId)) bauble.releasePointerCapture(e.pointerId);
      if (!moved) return;
      if (e.type === "pointerup") {
        this.dispatchEvent(
          new CustomEvent("changeInteractionStartTime", {
            detail: { newTime: timeAt(e.clientX), index: parseInt(bauble.id) },
            bubbles: true,
            composed: true,
          })
        );
      }
      this.updateBaublePositions();
    };
    bauble.addEventListener("pointermove", onMove);
    bauble.addEventListener("pointerup", finish);
    bauble.addEventListener("pointercancel", finish);
  }

  #interaction(id: string) {
    return ((this.getRootNode() as ShadowRoot).host as WebwriterInteractiveVideo).videoInteractions.find(
      (interaction) => Number(interaction.id) === Number(id)
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
  handleBaubleDraggedOverDropArea() {
    this.dropArea.style.background = "rgba(0.5,0.5,0.5,0.5)";
  }

  /**
   * Handles the event when a bauble is dragged out of the drop area.
   * Resets the background of the drop area.
   *
   * @param e - The DragEvent object representing the drag event.
   */
  handleBaubleLeaveDropArea() {
    this.dropArea.style.background = "none";
  }

  /**
   * Handles the drag end event for the bauble.
   *
   * @param e - The drag event.
   */
  handleBaubleDragEnd = () => {
    this.dropArea.style.background = "none";
  };

  updateBaublePositions() {
    this.requestUpdate();
  }

  focusBauble(id: string) {
    const bauble = this.shadowRoot?.getElementById(String(id));
    bauble?.focus();
  }

  /**
   * Calculates the offset based on the given time.
   *
   * @param time - The time in seconds.
   * @returns The calculated offset.
   */
  calculateOffset(time: number): number | undefined {
    if (!this.videoContext.videoLoaded) return;

    const duration = this.videoPlayer?.duration;
    if (!duration || !Number.isFinite(duration) || !this.dropArea) return;

    // Align each marker's center with the 18px slider thumb.
    return (time / duration) * (this.dropArea.getBoundingClientRect().width - 18);
  }
}
