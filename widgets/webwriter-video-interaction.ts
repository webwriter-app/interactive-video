import { html, css } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"

/* In eigene Datei legen, editingConfig und export anpassen*/
@customElement('webwriter-video-interaction')
export class WwVideoInteraction extends LitElementWw {
  // Static property to hold the next ID
  static nextId = 0;

  // Instance property to hold this instance's ID
  @property({ type: Number })
  id;

  constructor() {
    super();
    this.id = WwVideoInteraction.nextId++;
  }

  @property({ type: Boolean, attribute: true, reflect: true })
  active = true;

  @property({type: Number})
  index;

  

  static readonly styles = css`
    slot {
      display: block;
      height: 1em;
      background-color: red;
    }
 `;



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