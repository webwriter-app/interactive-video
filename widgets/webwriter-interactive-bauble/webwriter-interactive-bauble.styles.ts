import { css } from "lit";

export default css`
  :host {
    width: 15px;
    height: 15px;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
    position: relative;
    font-size: 15px;
  }

  :host(.dragging) {
    cursor: grabbing;
  }
`;
