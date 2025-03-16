import { css } from "lit";

export default css`
  .chapter-list {
    list-style-type: none;
    padding: 0;
  }

  .chapter-item {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .chapter-item sl-input {
    margin-bottom: 0.5rem;
  }

  .chapter-item sl-button {
    margin-right: 0.5rem;
  }

  .chapter-info {
    margin-bottom: 0.5rem;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
