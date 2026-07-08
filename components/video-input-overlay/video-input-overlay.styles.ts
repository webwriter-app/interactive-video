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
`;
