import { html, css, LitElement } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import styles from "./webwriter-video-interaction.styles";

/**
 * `webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
 * It extends `LitElementWw` and provides a slot for content insertion.
 */

export class WwVideoInteraction extends LitElementWw {
  @property({ type: Number, attribute: true, reflect: true })
  accessor id;

  constructor() {
    super();
  }

  /**
   * Indicates whether the interaction is active.
   * When active, the element is displayed; otherwise, it is hidden.
   * This property is reflected as an attribute.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor active = true;

  /**
   * Shadow DOM options for the component.
   * Enables focus delegation to the shadow DOM.
   */
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Lifecycle method called when the component is updated.
   * Toggles the display style based on the `active` property.
   *
   * @param changedProperties - Map of changed properties with their previous values.
   */
  updated(changedProperties) {
    changedProperties.forEach((_oldValue, property) => {
      if (property == "active") {
        this.style.display = this.active ? "flex" : "none";
      }
    });
  }

  /**
   * Renders the component's template.
   * Provides a slot for inserting custom content.
   *
   * @returns The HTML template for the component.
   */
  render() {
    return html`
      <div id="interaction">
        <slot> </slot>
      </div>
    `;
  }
}
