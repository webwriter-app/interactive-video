import { html, css } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.js'
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.js'
import SlCard from '@shoelace-style/shoelace/dist/components/card/card.js'
import SlIconButton from '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.js'
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.js'
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'

/* In eigene Datei legen, editingConfig und export anpassen*/
@customElement('webwriter-video-interaction')
export class WwVideoInteraction extends LitElementWw {


  @property({ type: Boolean, attribute: true, reflect: true })
  active = true;

  @property({ type: Number, attribute: true, reflect: true })
  startTime = 0;

  @property({ type: Number, attribute: true, reflect: true })
  endTime = 0;

  @property({ type: Number, attribute: true, reflect: true })
  counter = 0;

  @property({ type: String, attribute: true, reflect: true })
  interactionType;



  @query('#drawer-content')
  drawerContent;

  @query('replace-interaction-settings')
  replace

  @query('overlay-interaction-settings')
  overlay;

  static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-menu': SlMenu,
      'sl-menu-item': SlMenuItem,
      'sl-dropdown': SlDropdown,
      'sl-input': SlInput,

    }
  }

  static readonly styles = css`
    #drawer-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }`;



  updated(changedProperties) {
    changedProperties.forEach((_oldValue, property) => {
      if (property == 'active') {
        this.drawerContent.style.display = this.active ? 'flex' : 'none';
      }
    });
  }

  interactionTypeSelectionHandler = (e: CustomEvent) => {
    if (e.detail.item.value == 1) {
      this.replace.hidden = false;
      this.overlay.hidden = true;
    } else {
        this.replace.hidden = true;
        this.overlay.hidden = false;
    }
  }


  render() {

    return html`
    <div id='drawer-content'>
      <sl-dropdown label='Interaction Type' id='interaction-type-dropdown' @sl-select=${this.interactionTypeSelectionHandler}>
        <sl-button slot='trigger' id='interaction-type-button' caret>Interaction Type</sl-button>
        <sl-menu>
          <sl-menu-item value='1'>Replace</sl-menu-item>
          <sl-menu-item value='2'>Overlay</sl-menu-item>
        </sl-menu>
      </sl-dropdown>
      <div id='interaction-settings-container'>
        <div id='overlay-interaction-settings' hidden>
          <sl-input label='Start Time'>${this.startTime}</sl-input>
          <sl-input label='End Time'>${this.endTime}</sl-input>
          <!-- This should accept a Text input and overlay it onto the widget -->
        </div>
        <div id='replace-interaction-settings' hidden>
          <sl-input label='Timestamp'></sl-input>
          <p> Choose Interaction </p>
          <slot></slot>
        </div>
      </div>
    </div>
    `;
  }
}