export type Size = { width: number; height: number };

/** Used until the media reports its own proportions. */
export const DEFAULT_ASPECT_RATIO = 16 / 9;

/** The width that interactions are authored against, whatever the real size of the player. */
const BASE_WIDTH = 800;

/** The largest area of the given proportions that fits into the container; the container's width limits it unless it is fullscreen. */
export function fitVideoArea(aspectRatio: number, container: Size, fullscreen: boolean): Size {
  if (fullscreen) {
    if (container.height * aspectRatio > container.width) {
      return { width: container.width, height: container.width / aspectRatio };
    }
    return { width: container.height * aspectRatio, height: container.height };
  }
  if (aspectRatio > 1) {
    return { width: container.width, height: container.width / aspectRatio };
  }
  return { width: container.width * aspectRatio, height: container.width };
}

/** The size of the player that interactions are positioned against. */
export function baseVideoSize(aspectRatio: number): Size {
  if (aspectRatio > 1) {
    return { width: BASE_WIDTH, height: BASE_WIDTH / aspectRatio };
  }
  return { width: BASE_WIDTH * aspectRatio, height: BASE_WIDTH };
}
