import { html, css, PropertyValueMap, LitElement } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"


@customElement("webwriter-overlay-visualizer")
export class WwOverlayVisualizer extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 10px;
      background-color: rgba(0, 123, 255, 0.5);
      position: absolute;
      border-radius: 5px;
    }
  `;

  @property({ type: Number }) startOffset = 0;
  @property({ type: Number }) endOffset = 0;

  render() {
    return html``;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('startOffset') || changedProperties.has('endOffset')) {
      this.style.left = `${this.startOffset}px`;
      this.style.width = `${this.endOffset - this.startOffset}px`;
    }
  }
}