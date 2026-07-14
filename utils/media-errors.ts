import { msg } from "@lit/localize";

/**
 * Maps the error code of an `HTMLMediaElement` to a message explaining the error to the author.
 * @param code - The `MediaError` code of the media element, if any.
 */
export function mediaErrorMessage(code?: number): () => string {
  switch (code) {
    case 1: // MEDIA_ERR_ABORTED
      return () => msg("Loading the media was aborted. Please try again.");
    case 2: // MEDIA_ERR_NETWORK
      return () =>
        msg("The media could not be loaded because of a network error. Please check your internet connection, then try again.");
    case 3: // MEDIA_ERR_DECODE
      return () => msg("The media file is damaged or uses a format your browser cannot play.");
    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
      return () =>
        msg("The media could not be loaded. The link may be broken, or the format isn't supported by your browser.");
    default:
      return () => msg("The media could not be loaded. Please check the link and your internet connection, then try again.");
  }
}

/**
 * Maps the error code of a YouTube iframe to a message explaining the error to the author.
 * @param code - The error code returned by the YouTube iframe API, if any.
 */
export function youtubeErrorMessage(code?: number): () => string {
  switch (code) {
    case 2:
      return () => msg("This YouTube link is invalid. Please check the link and try again.");
    case 100:
      return () => msg("This YouTube video doesn't exist or is private.");
    case 101:
    case 150:
      return () => msg("The owner of this YouTube video doesn't allow it to be embedded. Please use a different video.");
    case 153:
      return () => msg("YouTube refuses to play this video here because the page doesn't identify itself to YouTube. This happens in WebWriter's preview mode or in documents opened directly from your device. Publish this document to a web server (e.g. WebWriter Cloud) and open it from there.");
    default:
      return () => msg("The YouTube video could not be loaded. Please check the link and your internet connection, then try again.");
  }
}

/**
 * Message shown when an embedded Vimeo video fails to load.
 */
export function vimeoErrorMessage(): () => string {
  return () =>
    msg("The Vimeo video could not be loaded. It may not exist, may be private, or may not allow being embedded.");
}

/**
 * Message shown when an embedded TikTok video fails to load.
 */
export function tiktokErrorMessage(): () => string {
  return () =>
    msg("The TikTok video could not be loaded. It may not exist, may be private, or may not allow being embedded.");
}

/**
 * Message shown when an embedded Spotify track fails to load.
 */
export function spotifyErrorMessage(): () => string {
  return () =>
    msg("The Spotify track could not be loaded. It may not exist or may not be available in your region.");
}

/**
 * Message shown when a media source takes too long to become playable.
 */
export function timeoutErrorMessage(): () => string {
  return () =>
    msg("The media took too long to load. Please check the link and your internet connection, then try again.");
}
