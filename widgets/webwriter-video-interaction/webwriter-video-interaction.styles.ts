import { css } from "lit";

export default css`
  :host {
    position: absolute !important; /* override WebWriter's default widget positioning */
    background-color: white;
  }

  #container {
    position: absolute;
    background-color: inherit;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 1);
    transform-origin: top left;
  }

  .page {
    display: flex;
    flex-direction: column;
    gap: 10px; /* Adjust the value to your desired spacing */
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
    max-height: 100%;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
