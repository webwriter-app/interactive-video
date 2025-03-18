import { css } from "lit";

export default css`
  #controls-lower {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: auto;
    background-color: #2c2c2c; /* Black background with opacity */
  }

  #controls-lower-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-right: 5px;
  }

  #controls-lower-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-right: auto;
    margin-left: 5px;
    gap: 2px;
  }

  .icon-button {
    text-align: center;
    color: white;
    font-size: 1.3rem;
  }

  .volume-button {
    text-align: center;
    color: white;
    font-size: 1.3rem;
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

  #chapters-button::part(base) {
    /* Set design tokens for height and border width */

    border: 1px solid transparent;

    border-radius: 8px;
    background-color: transparent;
    color: white;
    font-size: 14px;
  }

  #chapters-button::part(base):hover {
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
