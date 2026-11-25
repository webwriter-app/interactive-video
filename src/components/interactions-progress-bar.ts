import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";

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
import type { WebwriterVideoInteraction } from "../widgets/webwriter-video-interaction";

import { WwInteractiveBauble } from "./webwriter-interactive-bauble";

import { consume } from "@lit/context";

import bookmark from "@tabler/icons/filled/bookmark.svg";

//CSS
import styles from "./interactions-progress-bar.styles";

const thumbSize = 18;

type BaubleDrag = {
  marker: WwInteractiveBauble;
  interaction: WebwriterVideoInteraction;
  pointerId: number;
  startX: number;
  grabOffset: number;
  moved: boolean;
};

export class InteractionsProgressBar extends LitElementWw {
  readonly #permissions = widgetPermissions(this);
  private readonly msg = widgetMsg(this);
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @query("#marker-track")
  accessor markerTrack: HTMLDivElement;

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
  #drag?: BaubleDrag;
  #suppressClick = false;

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
    this.#endDrag();
  }

  protected updated() {
    if (this.#drag && !this.#drag.marker.isConnected) this.#endDrag();
  }

  render() {
    const interactions = ((this.getRootNode() as ShadowRoot).host as WebwriterInteractiveVideo).videoInteractions;
    const chapters = this.videoContext.hasChapters ? this.videoContext.chapterConfig : [];
    return html`
      <div class="interactions-progress-bar">
        <div id="marker-track">
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
              ${repeat(interactions, (interaction) => interaction, (interaction) => html`<webwriter-interactive-bauble
                offset=${ifDefined(this.calculateOffset(interaction.startTime))}
                ?data-editable=${this.#permissions.editing}
                role="button"
                tabindex="0"
                aria-label=${this.msg("Interaction") + " " + (Number(interaction.id) + 1)}
                @click=${this.handleBaubleClick}
                @keydown=${this.handleBaubleKey}
                @pointerdown=${this.handleBaublePointerDown}
                @pointermove=${this.handleBaublePointerMove}
                @pointerup=${this.handleBaublePointerUp}
                @lostpointercapture=${this.cancelBaubleDrag}
                @pointercancel=${this.cancelBaubleDrag}
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
    if (this.#suppressClick && event.detail > 0) {
      this.#suppressClick = false;
      return;
    }
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
    if (event.key === "Escape" && this.#drag?.marker === bauble) {
      event.preventDefault();
      event.stopPropagation();
      this.#endDrag();
      return;
    }
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
    this.#retime(bauble.id, newTime);
    this.updateComplete.then(() => this.focusBauble(bauble.id));
  }

  handleBaublePointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || this.#drag) return;
    this.#suppressClick = false;
    if (!this.#permissions.editing || !this.videoPlayer?.duration) return;

    const marker = event.currentTarget as WwInteractiveBauble;
    const interaction = this.#interaction(marker.id);
    if (!interaction) return;
    const rect = marker.getBoundingClientRect();
    this.#drag = {
      marker,
      interaction,
      pointerId: event.pointerId,
      startX: event.clientX,
      grabOffset: event.clientX - rect.left - rect.width / 2,
      moved: false,
    };
    // Untrusted test events can have no active browser pointer.
    try { marker.setPointerCapture(event.pointerId); } catch { /* No active pointer. */ }
  }

  handleBaublePointerMove(event: PointerEvent) {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId || event.currentTarget !== drag.marker) return;
    if (!drag.moved && Math.abs(event.clientX - drag.startX) < 6) return;

    const time = this.#timeAt(event.clientX - drag.grabOffset);
    const offset = time === undefined ? undefined : this.calculateOffset(time);
    if (offset === undefined) return;

    drag.moved = true;
    drag.marker.classList.add("dragging");
    drag.marker.style.translate = `${offset - drag.marker.offset}px`;
  }

  handleBaublePointerUp(event: PointerEvent) {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId || event.currentTarget !== drag.marker) return;
    this.#endDrag();
    if (!drag.moved || !this.#permissions.editing || this.#interaction(drag.interaction.id) !== drag.interaction) return;

    const newTime = this.#timeAt(event.clientX - drag.grabOffset);
    if (newTime !== undefined) this.#retime(drag.interaction.id, newTime);
  }

  cancelBaubleDrag(event: PointerEvent) {
    if (event.pointerId === this.#drag?.pointerId && event.currentTarget === this.#drag.marker) this.#endDrag();
  }

  #endDrag() {
    const drag = this.#drag;
    if (!drag) return;
    this.#drag = undefined;
    this.#suppressClick = drag.moved;
    drag.marker.classList.remove("dragging");
    drag.marker.style.removeProperty("translate");
    if (drag.marker.hasPointerCapture(drag.pointerId)) drag.marker.releasePointerCapture(drag.pointerId);
  }

  #timeAt(clientX: number) {
    const duration = this.videoPlayer?.duration;
    const rect = this.markerTrack.getBoundingClientRect();
    const width = this.markerTrack.clientWidth;
    if (!duration || !Number.isFinite(duration) || !rect.width || width <= thumbSize) return;
    const x = (clientX - rect.left) * (width / rect.width) - thumbSize / 2;
    const fraction = Math.min(1, Math.max(0, x / (width - thumbSize)));
    return Math.min(duration, Math.round(duration * fraction * 1000) / 1000);
  }

  #interaction(id: string) {
    return ((this.getRootNode() as ShadowRoot).host as WebwriterInteractiveVideo).videoInteractions.find(
      (interaction) => Number(interaction.id) === Number(id)
    );
  }

  #retime(id: string, newTime: number) {
    this.dispatchEvent(
      new CustomEvent("changeInteractionStartTime", {
        detail: { newTime, index: Number(id) },
        bubbles: true,
        composed: true,
      })
    );
    this.updateBaublePositions();
  }

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
    if (!duration || !Number.isFinite(duration) || !this.markerTrack) return;

    // Align each marker's center with the 18px slider thumb.
    return (time / duration) * (this.markerTrack.clientWidth - thumbSize);
  }
}
