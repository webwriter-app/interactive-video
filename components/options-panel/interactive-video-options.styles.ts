import { css } from "lit";

export default css`
  #temporary-teacher-options-container {
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

  .interaction-button-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  #overlay-interaction-settings {
    display: flex;
    flex-direction: column;
    align-items: left;
    justify-content: center;

    gap: 20px;
  }

  sl-details {
    font-size: 14px;
  }
`;
