import { msg } from "@lit/localize";

export function youtubeErrorMessage(code: number): () => string {
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