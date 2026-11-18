import { css } from "lit";

export default css`
  :host {
    position: absolute !important; /* override WebWriter's default widget positioning */
    background-color: white;
    font-family: var(--ww-font-family, inherit);
  }

  .print-time {
    display: none;
  }

  #dragIcon,
  #bottomRight {
    touch-action: none;
  }

  #dragIcon:focus-visible,
  #bottomRight:focus-visible {
    outline: 2px solid var(--ww-theme-accent-1, #0284c7);
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    #dragIcon,
    #bottomRight {
      font-size: 1.6rem;
    }
  }

  #container {
    position: absolute;
    background-color: inherit;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 1);
    transform-origin: top left;
  }

  .page {
    display: flex;
    flex-direction: column;
    gap: 10px; /* Adjust the value to your desired spacing */
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
    max-height: 100%;
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
      width: auto !important;
      height: auto !important;
      transform: none !important;
      box-shadow: none;
      background: none !important;
    }

    #popup {
      overflow: visible !important;
      height: auto !important;
    }

    #dragIcon,
    #bottomRight {
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
