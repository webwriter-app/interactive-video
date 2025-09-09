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
    height: 20px;
    display: flex;
    align-items: center;
    width: 100%;
  }

  #drop-area {
    width: 100%;
    padding: 4px 0;
  }
`;
