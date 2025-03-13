import { css } from "lit";

export default css`
  slot {
    display: block;
    height: 2em;
    background-color: red;
    margin-bottom: 10px;
    width: 100%;
  }

  slot::slotted(p) {
    width: 360px;
    height: 100%;
    display: block;
  }
`;
