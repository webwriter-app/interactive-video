import { provide, consume, createContext } from "@lit/context";
import { videoData } from "../types/videoData";

export const videoContext =
  createContext<InteractiveVideoContext>("videoContext");

export class InteractiveVideoContext {
  // ******* TEACHER OPTIONS *******
  /**
   * Teacher options for showing overlays, initially set to true.
   */
  showOverlay: boolean = true;

  /**
   * Teacher options declaring whether the video has chapters, initially set to false.
   */
  hasChapters: boolean = true;

  // ******* VIDEO PROPERTIES *******

  /**
   * Video file as a base64 string for offline storage.
   */
  videoBase64: string = "";

  /**
   * Video URL for online playback.
   */
  videoURL: string = "";

  /**
   * Indicates whether the video is currently playing.
   * This property is reflected as an attribute.
   */
  videoLoaded: boolean = false;

  // ******* CHAPTER PROPERTIES *******

  /**
   * Contains the current chapter configuration as a JSON string.
   */
  chapterConfig: string = '[{"title":"Chapter 1","startTime":0}]';

  // ******* INTERACTION PROPERTIES *******

  /**
   * sets the z-index of the overlay
   */
  overlayZIndex: Number = 50;

  /**
   * Indicates whether the interaction view is active.
   */
  selectedInteractionID: Number = -1;
}
