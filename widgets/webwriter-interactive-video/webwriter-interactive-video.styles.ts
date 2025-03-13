import { css } from "lit";

export default css`
  #container-vertical {
    position: relative;
    display: grid;
    grid-template-areas: "stack";
    width: 100%;
  }

  #container-vertical > * {
    grid-area: stack;
  }

  #video {
    width: 100%;
    object-fit: contain;
  }

  #controls {
    width: 98%;
    margin-left: 1%;
    margin-right: 1%;
    flex-direction: column;
    position: absolute;
    bottom: 0;
    justify-content: space-between;
  }

  #controls-upper {
    height: 20px;
  }

  #controls-lower {
    bottom: 0;
    display: flex;
    flex-direction: row;
    width: 100%;
  }

  #controls-lower-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  }

  #controls-lower-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: auto;
    gap: 2px;
  }

  #file-input-label:hover {
    color: blue;
  }

  #temporary-teacher-options-container {
    padding: 4px;
    border: 1px solid #ccc;
  }

  .temporary-teacher-options {
    margin-right: 10px;
  }

  #time-stamp {
    color: white;
    user-select: none;
  }

  #return-button {
    display: flex;
    justify-self: end;
  }

  #replace-timestamp {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  #current-chapter {
    color: white;
  }

  .interaction-button-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .icon-button {
    text-align: center;
    color: white;
    font-size: 2rem;
  }

  .chapter-list {
    list-style-type: none;
    padding: 0;
  }

  .chapter-item {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .chapter-item sl-input {
    margin-bottom: 0.5rem;
  }

  .chapter-item sl-button {
    margin-right: 0.5rem;
  }

  .chapter-info {
    margin-bottom: 0.5rem;
  }

  #add-button {
    color: hsl(200.4 98% 39.4%);
  }

  #return-button {
    position: absolute;
    bottom: 0;
    right: 0;
    visibility: hidden;
  }
`;
