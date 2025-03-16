import { css } from "lit";

export default css`
  #temporary-teacher-options-container {
    padding: 4px;
  }

  .temporary-teacher-options {
    margin-right: 10px;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
