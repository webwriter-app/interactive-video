import { css } from 'lit';

export const style = css`

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
    width: 100%
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
    height:20px;
  }

  #controls-lower {
    bottom: 0;
    display: flex;
    flex-direction: row;
    width: 100%
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
  
  #interaction-button-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .icon-button {
    text-align: center;
    font-size: 2rem;
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
  `