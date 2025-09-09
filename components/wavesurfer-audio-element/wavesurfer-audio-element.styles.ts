import { css } from "lit";

export default css`
	:host {
		position: absolute;
		inset: 0;
		z-index: 0;

		display: flex;
		align-items: center;
		background-color: rgb(44, 44, 44);
	}

	#wrapper {
		height: 50%;
	}

	#wavesurfer {
		height: 100%;
	}

	#wrapper,
	#wavesurfer {
		width: 100%;
	}

  #loading-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(44, 44, 44, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 1.2em;
    z-index: 2;
  }
`;
