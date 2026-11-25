import { css } from "lit";

export default css`
  :host {
    position: absolute !important; /* override WebWriter's default widget positioning */
    background-color: white;
    font-family: var(--ww-font-family, inherit);
  }

  @media screen {
    :host {
      /* WebWriter measures the rendered shadow box for a contents host. */
      display: contents !important;
    }
  }

  .print-time {
    display: none;
  }

  #dragIcon {
    cursor: grab;
    touch-action: none;
    user-select: none;
    grid-column: 2;
    justify-self: center;
  }

  #close-popup {
    grid-column: 3;
    justify-self: end;
    display: grid;
    place-items: center;
    --close-size: calc(28px / min(1, var(--popup-scale, 1)));
    width: var(--close-size);
    height: var(--close-size);
    font-size: calc(var(--close-size) * 0.6);
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  #close-popup:hover {
    background: rgb(0 0 0 / 10%);
  }

  #dragIcon:focus-visible,
  #close-popup:focus-visible {
    outline: 2px solid var(--ww-theme-accent-1, #0284c7);
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    #dragIcon {
      font-size: 1.6rem;
    }
  }

  #container {
    position: absolute;
    inset: 0 auto auto 0;
    background-color: inherit;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 1);
    transform-origin: top left;
  }

  #popup {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .popup-controls {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 4px;
  }

  #popup-content {
    overflow: auto;
    padding: 0 20px 16px;
  }

  .page slot {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  ::slotted(p:empty) {
    min-block-size: 1lh;
  }

  @media print {
    :host {
      position: static !important;
      display: block;
      break-inside: avoid;
      margin-bottom: 0.75rem;
      border: 1px solid currentColor;
      border-radius: 8px;
      background: none;
    }

    #container {
      position: static !important;
      display: block;
      width: auto !important;
      height: auto !important;
      transform: none !important;
      box-shadow: none;
      background: none !important;
    }

    #popup {
      height: auto;
    }

    #popup-content {
      overflow: visible;
    }

    .popup-controls {
      display: none;
    }

    .print-time {
      display: block;
      align-self: flex-start;
      padding: 8px 20px 0;
      font-size: 0.85em;
    }
  }
`;
