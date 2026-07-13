import { css } from "lit";

export default css`
  .overlay {
    position: absolute; /* To overlay the .page div */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(50, 50, 50, 0.8); /* Gray background with opacity */
    display: flex; /* Flexbox for centering */
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    z-index: 100;
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
    margin: 2em 2em 0;
    font-size: 1rem;
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
