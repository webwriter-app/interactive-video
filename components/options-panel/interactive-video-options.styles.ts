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

    gap: 10px;
  }

  sl-details {
    font-size: 14px;
  }

  .video-details p {
    margin: 0;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .video-title {
    font-weight: 500;
  }

  .video-source {
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  #remove-video-dialog p {
    margin-top: 0;
  }
`;
