import { css } from "lit";

export default css`
  .interactions-progress-bar {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-items: center;

    width: 100%;
  }

  #add-button {
    position: absolute;
    top: -35;

    margin-bottom: 10px;
    margin-right: 10px;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) #add-button {
    display: none;
  }

  #add-button::part(base) {
    /* Set design tokens for height and border width */
    --sl-input-height-medium: 48px;
    border: none;

    border-radius: 8px;
    background-color: #2c2c2c; /* Black background with opacity */
    color: white;
    font-size: 12px;
  }

  #add-button::part(base):hover {
    color: #0084c6;
  }

  #controls-upper {
    height: 20px;
    display: flex;
    align-items: center;
    background-color: #2c2c2c; /* Black background with opacity */
    width: 100%;
  }

  #drop-area {
    width: 100%;
  }
`;
