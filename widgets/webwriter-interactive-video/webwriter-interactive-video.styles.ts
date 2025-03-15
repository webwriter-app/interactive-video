import { css } from "lit";

export default css`
  #container-vertical {
    display: flex;
    flex-direction: column;
  }

  #container-vertical > * {
    grid-area: stack;
  }

  #video {
    width: 100%;
    object-fit: contain;
  }

  #controls {
    position: relative;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    width: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Black background with opacity */
  }

  #progress-bar::part(input) {
    border-radius: 0px; /* No rounded corners */
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
