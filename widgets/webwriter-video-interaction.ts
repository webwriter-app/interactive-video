import { html, css, LitElement } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"


/**
 * `webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
 * It extends `LitElementWw` and provides a slot for content insertion.
 */
@customElement('webwriter-video-interaction')
export class WwVideoInteraction extends LitElementWw {

  @property({ type: Number, attribute: true, reflect: true })
  id;


  constructor() {
    super();
  }

  /**
   * Indicates whether the interaction is active.
   * When active, the element is displayed; otherwise, it is hidden.
   * This property is reflected as an attribute.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  active = true;

  
  /**
   * CSS styles for the component.
   * Defines the appearance of the slot and its slotted content.
   */
  static readonly styles = css`
    slot {
      display: block;
      height: 2em;
      background-color: red;
      margin-bottom: 10px;
      width: 100%;
    }

    slot::slotted(p) {
      width: 360px;
      height: 100%;
      display: block;
    }
 `;

  /**
   * Shadow DOM options for the component.
   * Enables focus delegation to the shadow DOM.
   */
  static shadowRootOptions = {...LitElement.shadowRootOptions, delegatesFocus: true };

  /**
   * Lifecycle method called when the component is updated.
   * Toggles the display style based on the `active` property.
   * 
   * @param changedProperties - Map of changed properties with their previous values.
   */
  updated(changedProperties) {
    changedProperties.forEach((_oldValue, property) => {
      if (property == 'active') {
        this.style.display = this.active ? 'flex' : 'none';
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
      <div id='interaction'>
        <slot>
          
        </slot>
      </div>
    `;
  }
}