import { css } from "lit";

export default css`
  :host * {
    box-sizing: border-box;
  }

  #widget {
    display: flex;
    //flex-direction: column;
    align-items: center;
    position: relative;
    border: 1px solid #e5e5e5;
  }

  #container-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
  }

  #container-vertical:hover #controls {
    opacity: 1;
    visibility: visible;
  }

  #container-video {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    min-height: 250px;
    background-color: black;
    width: 100%;
  }

  #video {
    width: 100%;
    object-fit: contain;
  }

  #controls {
    display: flex;
    /* opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease; */

    position: absolute;
    left: 0;
    bottom: 0;

    flex-direction: column;
    align-items: center; /* Prevent stretching */

    width: 100%;
    background-color: rgba(0, 0, 0, 0.8); /* Black background with opacity */
  }

  #controls * {
    box-sizing: border-box;
    width: 100%;
  }

  #progress-bar {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    --thumb-size: 18px;
    overflow: visible;
    --track-color-active: #e9e9e9;
    --track-color-inactive: #4d4d4d;
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
