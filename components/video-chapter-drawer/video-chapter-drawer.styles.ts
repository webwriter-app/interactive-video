import { css } from "lit";

export default css`
  #chapters-drawer::part(panel) {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
  }

  .chapter-list {
    list-style-type: none;
    padding: 0;
  }

  .chapter-item {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
  }

  .chapter-item sl-input {
    margin-bottom: 0.5rem;
  }

  .chapter-item sl-button {
    margin-right: 0.5rem;
  }

  .chapter-info {
    margin-bottom: 0.5rem;
    display: flex;
    flex-direction: column;
  }

  .chapter-info p {
    padding: 0px;
    margin: 0px;
    font-size: 15px;
    margin-right: auto;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
