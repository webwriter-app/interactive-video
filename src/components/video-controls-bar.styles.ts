import { css } from "lit";

export default css`
  #controls-lower {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: auto;
  }

  #controls-lower-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-right: 5px;
    flex-shrink: 0;
  }

  #controls-lower-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-right: auto;
    margin-left: 5px;
    gap: 2px;
    min-width: 0; /* allow shrinking */
  }

  #controls-lower-left #play,
  #controls-lower-left #time-stamp {
    flex-shrink: 0;
  }

  #chapters-button {
    min-width: 0;
    flex-shrink: 1;
  }

  #chapters-button::part(base) {
    min-width: 0;
  }

  #chapters-button::part(label) {
    min-width: 0;
    overflow: hidden;
  }

  .chapter-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .icon-button {
    text-align: center;
    color: white;
    font-size: 1.3rem;
  }

  .volume-control {
    display: flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
    justify-content: center;
  }

  .volume-button {
    text-align: center;
    color: white;
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  #volume-slider {
    transition: width 0.2s ease, opacity 0.2s ease, margin 0.2s ease;
  }

  .volume-control.narrow {
    overflow: hidden;
  }

  .volume-control.narrow #volume-slider {
    width: 0;
    opacity: 0;
    margin: 0;
    pointer-events: none;
  }

  .volume-control.narrow.expanded #volume-slider {
    width: 80px;
    opacity: 1;
    pointer-events: auto;
  }

  .volume-button::part(base) {
    padding: 0px;
  }

  #volume-slider {
    --track-color-active: #e9e9e9;
    --track-color-inactive: #4d4d4d;
    width: 80px;
  }

  #volume-slider {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    --thumb-size: 18px;
    overflow: visible;
    --track-color-active: #e9e9e9;
    --track-color-inactive: #4d4d4d;
  }

  #volume-slider::part(base) {
    height: 6px !important; /* Force a consistent height */
    min-height: 6px;
    max-height: 6px;
    display: flex;
    align-items: center;
  }

  #time-stamp {
    color: white;
    user-select: none;
    font-size: 15px;
  }

  #chapters-button::part(base), #add-button::part(base) {
    /* Set design tokens for height and border width */

    border: 1px solid transparent;

    border-radius: 8px;
    background-color: transparent;
    color: white;
    font-size: 14px;
  }

  #chapters-button::part(base):hover, #add-button::part(base):hover {
    color: #0084c6;
  }

  .scale-animation {
    transform: scale(1.3);
    transition: transform 0.3s ease; /* Adjust duration and timing as needed */
  }

  .scale-animation:hover {
    transform: scale(1.3);
  }
`;
