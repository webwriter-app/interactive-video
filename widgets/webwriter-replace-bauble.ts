import { html, css, PropertyValueMap, LitElement } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"

@customElement("webwriter-replace-bauble")
export class WwReplaceBauble extends LitElementWw {
    static styles = css`
        :host {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: grab;
            position: absolute;
        }
        
        :host(.dragging) {
            cursor: grabbing;
        }
    `;

    static nextId = 1;

    @property({ type: Number , attribute: true, reflect: true})
    id;

    @property({ type: Number, attribute: true, reflect: true})
    initialOffset;

    @property({ type: Number, attribute: true, reflect: true})
    offset;

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.style.left = `${this.initialOffset}px`;
    }

    updated(changedProperties) {
        changedProperties.forEach((_oldValue, property) => {
            if (property == 'offset') {
                this.style.left = `${this.offset}px`;
            }
        });
    }

    render() {
        return html`
            <p style="pointer-events: none;">${this.id}</p>
        `;
    }
}
