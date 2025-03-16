import { css } from "lit";

export default css`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;

    cursor: grab;
  }

  #bauble {
    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 8px;
    border-radius: 15px;
    width: 10px;
    height: 10px;
    background-color: white;
  }

  #bauble:hover {
    background-color: #0084c6;
    color: white;
  }

  :host(.dragging) {
    cursor: grabbing;
  }
`;
