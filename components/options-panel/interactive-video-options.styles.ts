import { css } from "lit";

export default css`
  #temporary-teacher-options-container {
    padding: 4px;
    overflow: visible;
  }

  .temporary-teacher-options {
    margin-right: 10px;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }

  .author-only .header p {
    margin: 0px;
    font-weight: 500;
    font-size: 15px;
    box-sizing: border-box;
    color: #52525b;
  }

  .author-only .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: center;
    border-bottom: 2px solid #52525b;
    gap: 7px;
    padding-bottom: 10px;
  }
`;
