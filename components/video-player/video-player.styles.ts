import { css } from "lit";

export default css`
  video,
  youtube-video,
  vimeo-video,
  tiktok-video,
  wavesurfer-audio,
  #thumbnail-container {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  youtube-video.fullscreen,
  tiktok-video.fullscreen {
    pointer-events: none;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: #2c2c2c;
  }

  #thumbnail-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    z-index: 0;
  }

  #thumbnail-container.landscape #thumbnail {
    width: 100%;
    height: 100%;
    box-shadow: none;
  }

  #thumbnail {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    z-index: 2;
    box-shadow: 0 0 2em rgba(0, 0, 0, 0.3);
  }

  #thumbnail-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(20px);
    transform: scale(1.1);
    z-index: 1;
  }
`;
