import { html, css } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"

@customElement("webwriter-interactive-bauble")
export class WwInteractiveBauble extends LitElementWw {
    static styles = css`
        :host {
            display: block;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: red;
        }
    `;

    @property({ type: Number })
    id;

    render() {
        return html`
            <p>${this.id}</p>
        `;
    }
}
