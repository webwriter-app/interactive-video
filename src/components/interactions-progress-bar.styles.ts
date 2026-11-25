import { css } from "lit";

export default css`
  .interactions-progress-bar {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-items: center;

    width: calc(100% - 20px);
    margin: 0 10px;
  }

  #controls-upper {
    min-height: 20px;
  }

  .marker-row {
    position: relative;
    display: flex;
    align-items: center;
    height: 20px;
  }

  webwriter-interactive-bauble {
    position: absolute;
    cursor: pointer;
  }

  webwriter-interactive-bauble[data-editable] {
    cursor: grab;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }

  webwriter-interactive-bauble.dragging {
    z-index: 1;
    cursor: grabbing;
  }

  #marker-track {
    width: 100%;
    padding: 4px 0;
  }

  .chapter-mark {
    position: absolute;
    display: flex;
    margin-left: 1.5px;
    width: 15px;
    height: 15px;
    padding: 0;
    border: 0;
    background: none;
    color: #e9e9e9;
    font-size: 15px;
    cursor: pointer;
  }

  .chapter-mark::before {
    content: "";
    position: absolute;
    inset: -5px;
  }

  .chapter-mark:hover,
  .chapter-mark:focus-visible {
    color: var(--ww-theme-accent-1, #0084c6);
  }

  .chapter-mark:focus-visible,
  webwriter-interactive-bauble:focus-visible {
    outline: 2px solid var(--ww-theme-accent-1, #0084c6);
    outline-offset: 2px;
  }
`;
