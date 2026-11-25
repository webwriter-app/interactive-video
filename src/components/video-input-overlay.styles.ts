import { css } from "lit";

export default css`
  .overlay {
    position: absolute; /* To overlay the .page div */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(50, 50, 50, 0.8); /* Gray background with opacity */
    backdrop-filter: blur(1px);
    display: flex; /* Flexbox for centering */
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    z-index: 100;
    box-sizing: border-box;
  }

  #file-input-label:hover {
    color: blue;
  }

  #url-input::part(form-control-help-text) {
    color: lightgray;
    margin-top: 0.25em;
  }

  .error-message {
    background-color: #c74848;
    color: white;
    padding: .5em 1em;
    border-radius: 5px;
    font-size: 1rem;
  }

  .status-overlay {
    flex-direction: column;
    gap: 1em;
    padding: 1em;
    color: white;
    text-align: center;
  }

  .status-overlay sl-icon {
    font-size: 2.5rem;
  }

  .status-overlay .error-icon {
    color: #c74848;
  }

  .status-overlay p {
    margin: 0;
    max-width: 40em;
  }

  .status-overlay .status-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5em;
  }

  #youtube-disclaimer-dialog {
    --width: 40rem;
  }

  #youtube-disclaimer-dialog p {
    margin-top: 0;
  }

  #youtube-disclaimer-dialog p:last-of-type {
    margin-bottom: 0;
  }

  #youtube-disclaimer-dialog::part(base),
  #youtube-disclaimer-dialog::part(overlay) {
    position: absolute;
  }

  #youtube-disclaimer-dialog::part(panel) {
    max-width: calc(100% - 2rem);
    max-height: calc(100% - 2rem);
  }
`;
