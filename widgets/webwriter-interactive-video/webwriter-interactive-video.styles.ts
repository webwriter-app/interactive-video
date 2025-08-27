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
    height: 100%;
    width: 100%;
  }

  #container-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
    height: 100%;
  }

  #container-vertical:hover #controls {
    opacity: 1;
    visibility: visible;
  }

  #container-video-area {
    display: flex;
    flex-grow: 1;
    flex-shrink: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: black;
    width: 100%;
  }

  .fullscreen #container-video-area {
    height: 1px; // Hack to make it expand to full height
  }

  #container-video {
    width: 100%;
    height: fit-content;
    max-height: 100%;
    display: flex;
    flex-grow: 1;
    position: relative;
  }

  .fullscreen #container-video {
    width: fit-content;
    max-width: 100%;
  }

  #video {
    width: 100%;
    object-fit: contain;
  }

  .fullscreen #video {
    // width: unset; // Causes issues
    height: 100%;
  }

  #controls {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    /*opacity: 0;
     visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease; */

    position: relative;

    flex-direction: column;
    align-items: center; /* Prevent stretching */

    width: 100%;

    background-color: #2c2c2c;
  }

  #controls * {
    box-sizing: border-box;
    width: 100%;
  }

  #progress-bar {
    width: calc(100% - 20px);
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    --thumb-size: 18px;
    overflow: visible;
    --track-color-active: #e9e9e9;
    --track-color-inactive: #4d4d4d;
    --tooltip-offset: 21px;
  }

  #progress-bar::part(base) {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    display: flex;
    align-items: center;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
