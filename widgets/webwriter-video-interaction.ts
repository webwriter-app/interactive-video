import { html, css, LitElement } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"

@customElement('webwriter-video-interaction')
export class WwVideoInteraction extends LitElementWw {

  @property({ type: Number, attribute: true, reflect: true })
  id;


  constructor() {
    super();
  }

  
  @property({ type: Boolean, attribute: true, reflect: true })
  active = true;

  

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

  static shadowRootOptions = {...LitElement.shadowRootOptions, delegatesFocus: true };


  updated(changedProperties) {
    changedProperties.forEach((_oldValue, property) => {
      if (property == 'active') {
        this.style.display = this.active ? 'flex' : 'none';
      }
    });
  }
  

  render() {

    return html`
      <div id='interaction'>
        ${this.active? html``: html`<p> Choose Interaction </p>`}
        <slot>
          <p> Click any card to add an Interaction </p>
        </slot>
      </div>
    `;
  }
}