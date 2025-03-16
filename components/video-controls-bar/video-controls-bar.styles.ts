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
  }

  #controls-lower-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: auto;
    gap: 2px;
  }

  .icon-button {
    text-align: center;
    color: white;
    font-size: 1.3rem;
  }

  #time-stamp {
    color: white;
    user-select: none;
    font-size: 15px;
  }

  #current-chapter {
    color: white;
    font-size: 15px;
  }
`;
