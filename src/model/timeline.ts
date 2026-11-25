export type Chapter = { title: string; startTime: number };

/** The last chapter that has started at the given time, if any. */
export function chapterAt(chapters: Chapter[], time: number): Chapter | null {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (time >= chapters[i].startTime) return chapters[i];
  }
  return null;
}

/** The id for an interaction that is added after the given ones. */
export function nextInteractionId(ids: number[]): number {
  return ids.length === 0 ? 0 : Math.max(...ids) + 1;
}

/** Moves an interaction's window to a new start and shortens it if it would end after the media. */
export function moveInteractionWindow(
  startTime: number,
  endTime: number,
  newStart: number,
  mediaDuration: number
): { startTime: number; endTime: number } {
  let duration = endTime - startTime;
  if (newStart + duration > mediaDuration) duration = mediaDuration - newStart;
  return { startTime: newStart, endTime: newStart + duration };
}

/** The media can only be heard, not seen. */
export function isAudioType(videoType: string): boolean {
  return ["spotify", "htmlaudio"].includes(videoType);
}
