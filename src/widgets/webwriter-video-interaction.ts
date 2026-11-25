import { html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { customElement, property, query, state } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
import type { MsgFn } from "@lit/localize";
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";

import x from "@tabler/icons/outline/x.svg";
import gripHorizontal from "@tabler/icons/outline/grip-horizontal.svg";

import styles from "../components/webwriter-video-interaction.styles";
import { formatTime } from "../model/time-format";

type Labelled = { msg: MsgFn };

/** The step of an arrow key, five times as large with Shift; null for other keys. */
function arrowDelta(e: KeyboardEvent): { x: number; y: number } | null {
  const step = e.shiftKey ? 5 : 1;
  switch (e.key) {
    case "ArrowLeft": return { x: -step, y: 0 };
    case "ArrowRight": return { x: step, y: 0 };
    case "ArrowUp": return { x: 0, y: -step };
    case "ArrowDown": return { x: 0, y: step };
    default: return null;
  }
}

/**
 * `webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
 * It extends `LitElementWw` and provides a slot for content insertion.
 * In edit mode the grip at the top moves the popup with a pointer or the arrow keys (1 %, or 5 % with Shift).
 * Closing a popup dismisses it for its current time window. Its timeline marker opens it again.
 * On paper the popup is printed as a block with its time span.
 *
 * @attr {string} id - The unique interaction ID.
 * @part interaction - The popup box.
 */
@customElement("webwriter-video-interaction")
export class WebwriterVideoInteraction extends LitElementWw {
  static styles = [styles];

  static scopedElements = {
    "sl-icon": SlIcon,
  };

  static options = {
    startTime: { type: "number" as const, control: "duration" as const, min: 0, step: 0.1, group: "timing", label: (widget: Labelled) => widget.msg("Start time") },
    endTime: { type: "number" as const, control: "duration" as const, min: 0, step: 0.1, group: "timing", label: (widget: Labelled) => widget.msg("End time") },
    noInitialPause: { type: "boolean" as const, group: "timing", label: (widget: Labelled) => widget.msg("Do not pause when shown") },
    posX: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("X position (%)"), min: 0, max: 100, step: 0.1, unit: "%" },
    posY: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Y position (%)"), min: 0, max: 100, step: 0.1, unit: "%" },
    width: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Width"), min: 10, step: 1, unit: "px" },
    height: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Height"), min: 10, step: 1, unit: "px" },
    backgroundColor: { type: "color" as const, group: "appearance", label: (widget: Labelled) => widget.msg("Overlay color") },
  };

  static optionGroups = {
    timing: { label: (widget: Labelled) => widget.msg("Interaction timing"), collapsible: true, advanced: false },
    position: { label: (widget: Labelled) => widget.msg("Position and size"), collapsible: true, advanced: true },
    appearance: { label: (widget: Labelled) => widget.msg("Appearance"), collapsible: true, advanced: true },
  };

  static actions = {
    deleteInteraction: {
      label: (widget: Labelled) => widget.msg("Delete interaction"),
      group: "timing",
      icon: "Delete",
      intent: "danger" as const,
      confirm: (widget: Labelled) => widget.msg("Delete this interaction?"),
    },
  };

  localize = localizer(this, {
    sourceLocale,
    targetLocales,
    load: (locale) => import(`../../localization/generated/${locale}.ts`),
    drawer: true,
  });
  public readonly msg = this.localize.msg;
  readonly #permissions = new Permissions(this);

  /** The tab index of the component. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  /** The interaction start time in seconds. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor startTime: number;

  /** The interaction end time in seconds. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor endTime: number;

  /** Whether the interaction should pause the video when shown. */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor noInitialPause = false;

  /** Whether the interaction has already paused the video. */
  @property({ type: Boolean })
  accessor hasPaused = false;

  /** The x position of the interaction as a percentage of the video width. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor posX: number;

  /** The y position of the interaction as a percentage of the video height. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor posY: number;

  /** The width of the interaction in pixels. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor width: number;

  /** The height of the interaction in pixels. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor height: number;

  /** The background color of the interaction overlay. */
  @property({ type: String, attribute: "background-color", reflect: true })
  accessor backgroundColor: string | undefined = undefined;

  /** The width of the parent video player. */
  @property({ type: Number, attribute: true })
  accessor parentWidth: number;

  /** The height of the parent video player. */
  @property({ type: Number, attribute: true })
  accessor parentHeight: number;

  /** The video width in non-full-screen mode. */
  @property({ type: Number, attribute: true })
  accessor videoBaseWidth = 800;

  /** The video height in non-full-screen mode. */
  @property({ type: Number, attribute: true })
  accessor videoBaseHeight = 450;

  @state()
  private accessor isDragging = false;

  @state()
  private accessor draggingPosX = 0;

  @state()
  private accessor draggingPosY = 0;

  /** @internal Whether the player currently shows the popup. */
  @state()
  accessor visible = false;

  @query("#container")
  private accessor container: HTMLDivElement;

  @query("#dragIcon")
  private accessor dragIcon: SlIcon;

  protected firstUpdated() {
    this.ensureParagraph();
  }

  private ensureParagraph() {
    if (this.childElementCount || this.textContent?.trim()) return;
    this.append(this.ownerDocument.createElement("p"));
  }

  deleteInteraction(): void {
    if (!this.isConnected) return;
    const video = this.closest("webwriter-interactive-video") as
      | (HTMLElement & { selectedInteractionId?: number; updateContext?: () => void })
      | null;
    if (video && video.selectedInteractionId === Number(this.id)) video.selectedInteractionId = -1;
    this.remove();
    video?.updateContext?.();
  }

  /** Moves the popup with the arrow keys on the grip, so that it can be placed without a pointer. */
  private moveByKey(e: KeyboardEvent) {
    const delta = arrowDelta(e);
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation();
    this.posX = Math.min(100, Math.max(0, (this.posX ?? 0) + delta.x));
    this.posY = Math.min(100, Math.max(0, (this.posY ?? 0) + delta.y));
    this.announcePositionChange();
  }

  private announcePositionChange() {
    this.dispatchEvent(new CustomEvent("positionChanged", { detail: { id: this.id }, bubbles: true, composed: true }));
  }

  /**
   * Initiates the dragging process when the user starts dragging the drag icon.
   * @param e - PointerEvent that initiates the dragging.
   */
  private startDragging(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = this.container.getBoundingClientRect();
    const parent = this.parentElement?.shadowRoot?.querySelector("#video");

    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();

    const offsetX = rect.left - parentRect.left;
    const offsetY = rect.top - parentRect.top;

    this.dragIcon.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const newX = offsetX + (moveEvent.clientX - startX);
      const newY = offsetY + (moveEvent.clientY - startY);

      const maxX = parentRect.width - rect.width;
      const maxY = parentRect.height - rect.height;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      this.draggingPosX = clampedX;
      this.draggingPosY = clampedY;
      
      this.isDragging = true;
    };

    const finish = (event: PointerEvent) => {
      this.dragIcon.removeEventListener("pointermove", onPointerMove);
      this.dragIcon.removeEventListener("pointerup", finish);
      this.dragIcon.removeEventListener("lostpointercapture", finish);
      this.container.style.willChange = "auto";
      if (this.isDragging && event.type === "pointerup") {
        this.posX = (this.draggingPosX / parentRect.width) * 100;
        this.posY = (this.draggingPosY / parentRect.height) * 100;
        this.announcePositionChange();
      }
      this.isDragging = false;
    };

    this.container.style.willChange = "transform";
    this.dragIcon.addEventListener("pointermove", onPointerMove);
    this.dragIcon.addEventListener("pointerup", finish);
    this.dragIcon.addEventListener("lostpointercapture", finish);
  }

  private handleClick() {
    if (!this.visible) return;
    this.dispatchEvent(new CustomEvent("interactionClicked", {
      detail: { id: this.id },
      bubbles: true,
      composed: true,
    }));
  }

  private closePopup() {
    this.dispatchEvent(new CustomEvent("interactionClosed", { bubbles: true, composed: true }));
  }

  /**
   * Renders the component's template.
   * Provides a slot for inserting custom content.
   *
   * @returns The HTML template for the component.
   */
  render() {
    const scale = this.parentWidth / this.videoBaseWidth;
    return html`
      <div
        id="container"
        part="interaction"
        ?hidden=${!this.visible}
        @click=${this.handleClick}
        style="width: ${this.width}px;
          height: ${this.height}px;
          background-color: ${this.backgroundColor || "inherit"};
          --popup-scale: ${scale || 1};
          transform:
            translate(
              ${this.isDragging ? this.draggingPosX : (this.posX * this.parentWidth / 100)}px,
              ${this.isDragging ? this.draggingPosY : (this.posY * this.parentHeight / 100)}px
            )
            scale(${scale});"
      >
        <div id="popup">
          <div class="popup-controls">
            ${this.#permissions.editing
              ? html`<sl-icon
                  id="dragIcon"
                  src=${gripHorizontal}
                  tabindex="0"
                  label=${this.msg("Move interaction")}
                  @pointerdown=${this.startDragging}
                  @keydown=${this.moveByKey}
                ></sl-icon>`
              : null}
            <button id="close-popup" type="button" aria-label=${this.msg("Close popup")} @click=${this.closePopup}>
              <sl-icon src=${x} aria-hidden="true"></sl-icon>
            </button>
          </div>
          <p class="print-time">${formatTime(this.startTime)} – ${formatTime(this.endTime)}</p>
          <div id="popup-content">
            <div class="page">
              <slot
                @slotchange=${this.ensureParagraph}
                style=${styleMap({ "--ww-placeholder": this.#permissions.editing ? JSON.stringify(this.msg("Popup")) : undefined })}
              ></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
