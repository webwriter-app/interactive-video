import { html, css, LitElement, PropertyValues } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { SlIcon } from "@shoelace-style/shoelace";

import styles from "./webwriter-video-interaction.styles";

import { InteractiveVideoOptions } from "../../components/options-panel/interactive-video-options";

/**
 * `webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
 * It extends `LitElementWw` and provides a slot for content insertion.
 */

import radiusBottomRight from "@tabler/icons/outline/radius-bottom-right.svg";
import gripHorizontal from "@tabler/icons/outline/grip-horizontal.svg";

export class WwVideoInteraction extends LitElementWw {
  /**
   * The styles for the webwriter-interactive-video component.
   */
  static styles = [styles];

  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  @property({ type: Number, attribute: true, reflect: true })
  accessor id;

  @property({ type: Number, attribute: true, reflect: true })
  accessor startTime;

  @property({ type: Number, attribute: true, reflect: true })
  accessor endTime;

  @property({ type: String, attribute: true, reflect: true })
  accessor initialPause = "false";

  @query("#bottomRight")
  accessor bottomRight: SlIcon;

  @query("#dragIcon")
  accessor dragIcon: SlIcon;

  // Create an observer instance linked to the callback function
  private mutationObserver: MutationObserver;

  //
  //
  //
  static get scopedElements() {
    return {
      "sl-icon": SlIcon,
      "interactive-video-options": InteractiveVideoOptions,
    };
  }

  /* 
  
  
  */
  constructor() {
    super();
    this.mutationObserver = new MutationObserver(this.mutationCallback);
  }

  /* 
  
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
    const slot = this.shadowRoot.querySelector("slot");
    const assignedElements = slot.assignedElements();

    if (assignedElements.length == 0) {
      const par = document.createElement("p");
      par.textContent = "Add something here...";
      this.appendChild(par);
    }
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
        ${this.isContentEditable
          ? html`<sl-icon
              id="dragIcon"
              style="position: sticky; top: 0; /* Keeps it at the top */"
              src=${gripHorizontal}
              @pointerdown="${this.startDragging}"
            >
            </sl-icon>`
          : null}

        <slot class="page"></slot>

        ${this.isContentEditable
          ? html` <sl-icon
              id="bottomRight"
              style="position: absolute; bottom: 5px; right: 5px; "
              src=${radiusBottomRight}
              @pointerdown=${this.startResizing}
            >
            </sl-icon>`
          : null}
      </div>

      <interactive-video-options
        style="user-select: none;"
        contenteditable=${this.isContentEditable}
        part="options"
        class="author-only"
      ></interactive-video-options>
    `;
  }

  //
  //
  //
  private mutationCallback = (mutationList: MutationRecord[]) => {
    mutationList.forEach(
      ({ type, removedNodes, addedNodes, attributeName, target }) => {
        //
        if (type === "childList") {
          // Check if there is at least one paragraph <p> element in the container
          const paragraphs = this.querySelectorAll("p");
          if (paragraphs.length === 0) {
            const par = document.createElement("p");
            par.textContent = "Add something here...";
            this.appendChild(par);
          }
        }
      }
    );
  };

  //
  //
  //
  startResizing(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.offsetWidth;
    const startHeight = this.offsetHeight;

    const parent = this.parentElement?.shadowRoot?.querySelector("#video");
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const rect = this.getBoundingClientRect();

    this.bottomRight.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const maxWidth = parentRect.width - (rect.left - parentRect.left);
      const maxHeight = parentRect.height - (rect.top - parentRect.top);

      const newWidth = Math.max(50, Math.min(startWidth + deltaX, maxWidth));
      const newHeight = Math.max(50, Math.min(startHeight + deltaY, maxHeight));

      this.style.width = `${newWidth}px`;
      this.style.height = `${newHeight}px`;
    };

    const onPointerUp = () => {
      this.bottomRight.releasePointerCapture(e.pointerId);
      this.bottomRight.removeEventListener("pointermove", onPointerMove);
      this.bottomRight.removeEventListener("pointerup", onPointerUp);
    };

    this.bottomRight.addEventListener("pointermove", onPointerMove);
    this.bottomRight.addEventListener("pointerup", onPointerUp);
  }

  //
  //
  //
  startDragging(e: PointerEvent) {
    if (e.target === this.bottomRight || e.target !== this.dragIcon) return;

    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = this.getBoundingClientRect();
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

      this.style.position = "absolute";
      this.style.left = `${clampedX}px`;
      this.style.top = `${clampedY}px`;
    };

    const onPointerUp = () => {
      this.dragIcon.releasePointerCapture(e.pointerId);
      this.dragIcon.removeEventListener("pointermove", onPointerMove);
      this.dragIcon.removeEventListener("pointerup", onPointerUp);
    };

    this.dragIcon.addEventListener("pointermove", onPointerMove);
    this.dragIcon.addEventListener("pointerup", onPointerUp);
  }
}
