import { css } from "lit";

export default css`
  :host * {
    box-sizing: border-box;
  }

  #container-vertical {
    display: flex;
    flex-direction: column;
  }

  #container-video {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  #video {
    width: 100%;
    object-fit: contain;
  }

  #controls {
    display: flex;
    flex-direction: column;
    align-items: center; /* Prevent stretching */

    width: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Black background with opacity */
  }

  #controls * {
    box-sizing: border-box;
    width: 100%;
  }

  #progress-bar {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
  }

  #progress-bar::part(base) {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    display: flex;
    align-items: center;
  }

  #progress-bar::part(input) {
    border-radius: 0px; /* No rounded corners */
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
