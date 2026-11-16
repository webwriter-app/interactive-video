import { html, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { LitElementWw } from "@webwriter/lit";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
import type { MsgFn } from "@lit/localize";
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";

import radiusBottomRight from "@tabler/icons/outline/radius-bottom-right.svg";
import gripHorizontal from "@tabler/icons/outline/grip-horizontal.svg";

import styles from "../components/webwriter-video-interaction.styles";
import { InteractiveVideoOptions } from "../components/interactive-video-options";

type Labelled = { msg: MsgFn };

/**
 * `webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
 * It extends `LitElementWw` and provides a slot for content insertion.
 */
@customElement("webwriter-video-interaction")
export class WebwriterVideoInteraction extends LitElementWw {
  static styles = [styles];

  static scopedElements = {
    "sl-icon": SlIcon,
    "interactive-video-options": InteractiveVideoOptions,
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

  /** The interaction id. Must be unique. HTMLElement types `id` as a string, the Number converter turns the attribute into a number at runtime. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor id: string;

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

  @state()
  private accessor isResizing = false;

  @state()
  private accessor resizingWidth = 0;

  @state()
  private accessor resizingHeight = 0;

  @query("#container")
  private accessor container: HTMLDivElement;

  @query("#bottomRight")
  private accessor bottomRight: SlIcon;

  @query("#dragIcon")
  private accessor dragIcon: SlIcon;

  private mutationObserver: MutationObserver;

  /**
   * Creates an instance of the webwriter-video-interaction component.
   */
  constructor() {
    super();
    this.mutationObserver = new MutationObserver(this.mutationCallback);
  }

  /**
   * Called when the component is removed from the DOM.
   * Cleans up event listeners and disconnects observers.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mutationObserver.disconnect();
  }

  /**
   * Called after the component's first update.
   * Sets up the mutation observer to monitor changes in the component's content.
   * @param _changedProperties - The properties that have changed.
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    // Options for the observer (which mutations to observe)
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    };
    // Start observing the target node for configured mutations
    this.mutationObserver.observe(this, config);

    //create an empty p element if container has no children
    const slot = this.shadowRoot?.querySelector("slot");

    if (slot && slot.assignedElements().length == 0) {
      const par = document.createElement("p");
      par.textContent = this.msg("Add something here...");
      this.appendChild(par);
    }
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

  private mutationCallback = (mutationList: MutationRecord[]) => {
    mutationList.forEach(
      ({ type, removedNodes, addedNodes, attributeName, target }) => {
        //
        if (type === "childList") {
          // Check if there is at least one paragraph <p> element in the container
          const paragraphs = this.querySelectorAll("p");
          if (paragraphs.length === 0) {
            const par = document.createElement("p");
            par.textContent = this.msg("Add something here...");
            this.appendChild(par);
          }
        }
      }
    );
  };

  /**
   * Initiates the resizing process when the user starts dragging the resize handle.
   * @param e - The pointer event that initiates the resizing.
   */
  private startResizing(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.container.offsetWidth;
    const startHeight = this.container.offsetHeight;

    const parent = this.parentElement?.shadowRoot?.querySelector("#video");
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const rect = this.container.getBoundingClientRect();

    this.bottomRight.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const scaleFactor = this.parentWidth / this.videoBaseWidth;

      const deltaX = (moveEvent.clientX - startX) / scaleFactor;
      const deltaY = (moveEvent.clientY - startY) / scaleFactor;

      const maxWidth = (parentRect.width - (rect.left - parentRect.left)) / scaleFactor;
      const maxHeight = (parentRect.height - (rect.top - parentRect.top)) / scaleFactor;

      const newWidth = Math.max(50, Math.min(startWidth + deltaX, maxWidth));
      const newHeight = Math.max(50, Math.min(startHeight + deltaY, maxHeight));

      this.resizingWidth = newWidth;
      this.resizingHeight = newHeight;

      this.isResizing = true;
    };

    const onPointerUp = () => {
      this.bottomRight.releasePointerCapture(e.pointerId);

      this.width = this.resizingWidth;
      this.height = this.resizingHeight;

      this.container.style.willChange = "auto";
      this.isResizing = false;

      this.bottomRight.removeEventListener("pointermove", onPointerMove);
      this.bottomRight.removeEventListener("pointerup", onPointerUp);

      this.dispatchEvent(
        new CustomEvent("positionChanged", {
          detail: { id: this.id },
          bubbles: true,
          composed: true,
        })
      );
    };

    this.container.style.willChange = "width, height";

    this.bottomRight.addEventListener("pointermove", onPointerMove);
    this.bottomRight.addEventListener("pointerup", onPointerUp);
  }

  /**
   * Initiates the dragging process when the user starts dragging the drag icon.
   * @param e - PointerEvent that initiates the dragging.
   */
  private startDragging(e: PointerEvent) {
    if (e.target === this.bottomRight || e.target !== this.dragIcon) return;

    e.preventDefault();

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

    const onPointerUp = () => {
      this.posX = (this.draggingPosX / parentRect.width) * 100;
      this.posY = (this.draggingPosY / parentRect.height) * 100;

      this.container.style.willChange = "auto";

      this.dragIcon.releasePointerCapture(e.pointerId);
      this.dragIcon.removeEventListener("pointermove", onPointerMove);
      this.dragIcon.removeEventListener("pointerup", onPointerUp);

      this.isDragging = false;
      
      this.dispatchEvent(
        new CustomEvent("positionChanged", {
          detail: { id: this.id },
          bubbles: true,
          composed: true,
        })
      );
    };

    this.container.style.willChange = "transform";

    this.dragIcon.addEventListener("pointermove", onPointerMove);
    this.dragIcon.addEventListener("pointerup", onPointerUp);
  }

  /**
   * Renders the component's template.
   * Provides a slot for inserting custom content.
   *
   * @returns The HTML template for the component.
   */
  render() {
    return html`
      <div 
        id="container"
        style="width: ${this.isResizing ? this.resizingWidth : this.width}px;
          height: ${this.isResizing ? this.resizingHeight : this.height}px;
          background-color: ${this.backgroundColor || "inherit"};
          transform: 
            translate(
              ${this.isDragging ? this.draggingPosX : (this.posX * this.parentWidth / 100)}px, 
              ${this.isDragging ? this.draggingPosY : (this.posY * this.parentHeight / 100)}px
            )
            scale(${this.parentWidth / this.videoBaseWidth});"
      >
        <div
          id="popup"
          style="overflow: scroll; height: 100%; display: flex; flex-direction: column; align-items: center; justify-items: center; "
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent("interactionClicked", {
                detail: { id: this.id },
                bubbles: true,
                composed: true,
              })
            )}
        >
          ${this.#permissions.editing
            ? html`<sl-icon
                id="dragIcon"
                style="position: sticky; top: 0; /* Keeps it at the top */"
                src=${gripHorizontal}
                @pointerdown="${this.startDragging}"
              >
              </sl-icon>`
            : null}

          <slot class="page"></slot>

          ${this.#permissions.editing
            ? html` <sl-icon
                id="bottomRight"
                style="position: absolute; bottom: 5px; right: 5px; "
                src=${radiusBottomRight}
                @pointerdown=${this.startResizing}
              >
              </sl-icon>`
            : null}
        </div>
      </div>

    `;
  }
}
