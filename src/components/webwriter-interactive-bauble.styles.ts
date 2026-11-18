import { css } from "lit";

export default css`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;
  }

  :host([draggable="true"]) {
    touch-action: none;
  }

  :host::before {
    content: "";
    position: absolute;
    inset: -3px;
  }

  #bauble {
    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 12px;
    border-radius: 15px;
    width: 18px;
    height: 18px;
    background-color: #e9e9e9;
  }

  #bauble:hover {
    background-color: var(--ww-theme-accent-1, #0084c6);
    color: white;
  }

  :host(:focus-visible) #bauble {
    background-color: var(--ww-theme-accent-1, #0084c6);
    color: white;
  }

  :host(.dragging) {
    cursor: grabbing;
  }
`;
