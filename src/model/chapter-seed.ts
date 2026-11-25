/** A second data block that seeds the chapters of a snippet once. The widget takes it over into its own block and removes it. */
export const chapterSeedSelector = ':scope > script[type="application/json"][slot="data"]:not([src])[data-video-chapters]';

export function readChapterSeed(host: HTMLElement): { title: string; startTime: number }[] | undefined {
  try {
    const value = JSON.parse(host.querySelector(chapterSeedSelector)?.textContent ?? "");
    return Array.isArray(value?.chapterConfig) ? value.chapterConfig : undefined;
  } catch {
    return undefined;
  }
}
