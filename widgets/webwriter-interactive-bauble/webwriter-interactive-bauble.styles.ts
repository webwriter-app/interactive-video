import { css } from "lit";

export default css`
  :host {
    width: 20px;
    height: 20px;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    position: relative;
  }

  :host(.dragging) {
    cursor: grabbing;
  }
`;
