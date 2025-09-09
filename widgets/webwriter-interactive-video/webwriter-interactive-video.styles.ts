import { css } from "lit";

export default css`
  :host {
    overflow-y: hidden !important; /* Prevent scrollbars */
  }

  :host * {
    box-sizing: border-box;
  }

  #widget {
    display: flex;
    align-items: center;
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  #widget.fullscreen.controls-hidden, 
  #widget.fullscreen.controls-hidden * {
    cursor: none;
  }

  #container-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .fullscreen #container-vertical {
    display: block;
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
    height: 100%;
  }

  #container-video {
    display: flex;
    position: relative;
  }

  #video {
    width: 100%;
    height: 100%;
  }

  #controls {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;

    position: relative;

    flex-direction: column;
    align-items: center; /* Prevent stretching */

    width: 100%;

    background-color: #2c2c2c;
    
    transition: filter 0.25s ease, visibility 0.25s ease;
  }

  .fullscreen #controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    background: rgba(44, 44, 44, 0.7);
  }

  .fullscreen #controls.hide {
    filter: opacity(0);
    visibility: hidden;
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

  #confirm-delete-dialog {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 10;
    transform: translateX(0px);
  }

  #remove-video-dialog {
    pointer-events: all;
  }

  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
`;
