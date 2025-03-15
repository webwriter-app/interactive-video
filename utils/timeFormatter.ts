/**
 * Formats the given time in seconds into a string representation of hours, minutes, and seconds.
 *
 * @param time - The time in seconds to format.
 * @returns A string representation of the formatted time in 'hh:mm:ss' or 'mm:ss' format for videos under an hour.
 */
export function formatTime(time: number): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}

/**
 * Parses a time string and returns the equivalent number of seconds.
 *
 * @param timeStr - The time string to parse.
 * @returns The number of seconds represented by the time string, or null if the time string is invalid.
 */
export function parseTime(timeStr: string): number | null {
  const parts = timeStr.toString().split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}
