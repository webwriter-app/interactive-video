import { LitElementWw } from "@webwriter/lit";
import {
  InteractiveVideoContext,
  videoContext,
} from "../../utils/interactive-video-context";
import { consume } from "@lit/context";
import { property, query, state } from "lit/decorators.js";
import styles from "./video-player.styles";
import { html } from "lit";
import { msg } from "@lit/localize";
import {
  mediaErrorMessage,
	youtubeErrorMessage,
  spotifyErrorMessage,
  tiktokErrorMessage,
  vimeoErrorMessage,
} from "../../utils/media-errors";

import YouTubeVideoElement from "youtube-video-element";
import VimeoVideoElement from "vimeo-video-element";
import TikTokVideoElement from "tiktok-video-element";
import SpotifyAudioElement from "spotify-audio-element";
import { WaveSurferAudioElement } from "../wavesurfer-audio-element/wavesurfer-audio-element";
import { SlSpinner } from "@shoelace-style/shoelace";

export enum PlayerType {
  Placeholder,
  HTMLVideo,
  HTMLAudio,
  YouTube,
  Vimeo,
  TikTok,
  Spotify
}

const VIDEO_EVENTS = [
  "play",
  "pause",
  "ended",
  "timeupdate",
  "volumechange",
  "seeking",
  "seeked",
  "ratechange",
  "durationchange",
  "progress",
  "loadeddata",
  "loadedmetadata",
  "canplay",
  "canplaythrough",
  "waiting",
  "stalled",
  "error"
];

const BUFFERING_START_EVENTS = ["waiting", "stalled"];
const BUFFERING_END_EVENTS = [
  "playing",
  "play",
  "pause",
  "canplay",
  "canplaythrough",
  "seeked",
  "ended",
  "error",
];
const BUFFERING_DELAY = 300;

// Taken from the youtube-video-element source code
export const youtubeRegex =	/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((\w|-){11})/;

export class VideoPlayer extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @property({ type: Number })
  accessor playerType: number = PlayerType.Placeholder;

  @property({ type: Boolean, attribute: true })
  accessor isFullscreen: boolean = false;

  @query("video, wavesurfer-audio, youtube-video, vimeo-video, tiktok-video, spotify-audio")
  accessor videoElement: HTMLVideoElement | WaveSurferAudioElement | YouTubeVideoElement | VimeoVideoElement | TikTokVideoElement | SpotifyAudioElement;

  @query("#thumbnail")
  accessor thumbnailElement: HTMLImageElement;

  @query("#thumbnail-background")
  accessor thumbnailBackgroundElement: HTMLImageElement;

  @query("#thumbnail-container")
  accessor thumbnailContainerElement: HTMLDivElement;

  @state()
  private accessor buffering: boolean = false;

  private youtubeLoadTimer?: number;
  private vimeoMessageListener?: (e: MessageEvent) => void;
  private bufferingTimer?: number;

  static get scopedElements() {
    return {
      "youtube-video": YouTubeVideoElement,
      "vimeo-video": VimeoVideoElement,
      "tiktok-video": TikTokVideoElement,
      "spotify-audio": SpotifyAudioElement,
      "wavesurfer-audio": WaveSurferAudioElement,
      "sl-spinner": SlSpinner,
    };
  }

  //import CSS
  static styles = [styles];

  render() {
    return html`${this.renderMedia()}${this.buffering ? html`<div class="buffering-overlay"><sl-spinner></sl-spinner></div>` : null}`;
  }

  private renderMedia() {
    if (this.playerType === PlayerType.Placeholder) {
      return html`<div class="placeholder"></div>`;
    }
    if (this.playerType === PlayerType.HTMLVideo) {
      return html`<video></video>`;
    }
    if (this.playerType === PlayerType.HTMLAudio) {
      return html`<wavesurfer-audio></wavesurfer-audio>`;
    }
    if (this.playerType === PlayerType.YouTube) {
      return html`<youtube-video class=${this.isFullscreen ? "fullscreen" : ""}></youtube-video>`;
    }
    if (this.playerType === PlayerType.Vimeo) {
      return html`<vimeo-video></vimeo-video>`;
    }
    if (this.playerType === PlayerType.TikTok) {
      return html`<tiktok-video class=${this.isFullscreen ? "fullscreen" : ""}></tiktok-video>`;
    }
    if (this.playerType === PlayerType.Spotify) {
      return html`<spotify-audio></spotify-audio><div id="thumbnail-container"><img id="thumbnail"/><img id="thumbnail-background"/></div>`;
    }
  }

  /**
   * Reports a loading error
   * @param error - Technical description of the error, for the console
   * @param message - Localized message explaining the error to the user
   */
  private failLoad(error: string, message?: () => string) {
    this.setBuffering(false);
    this.dispatchEvent(
      new CustomEvent("loadingerror", { detail: { error, message } })
    );
  }

  private setBuffering(value: boolean) {
    if (value) {
      if (this.paused) return;
      if (this.buffering || this.bufferingTimer !== undefined) return;
      this.bufferingTimer = window.setTimeout(() => {
        this.bufferingTimer = undefined;
        this.buffering = true;
      }, BUFFERING_DELAY);
    } else {
      clearTimeout(this.bufferingTimer);
      this.bufferingTimer = undefined;
      this.buffering = false;
    }
  }

  private failMissingElement() {
    this.failLoad(
      "Media element not found",
      () => msg("The media player could not be started. Please try again.")
    );
  }

  loadVideoBase64(base64: string) {
    // check if base64 is video or audio
    const isVideo = base64.startsWith("data:video");
    const isAudio = base64.startsWith("data:audio");
    if (!isVideo && !isAudio) {
      this.failLoad(
        "Invalid base64 string",
        () => msg("This file could not be loaded. It is damaged or isn't a video or audio file.")
      );
      return;
    }

    this.playerType = isVideo ? PlayerType.HTMLVideo : PlayerType.HTMLAudio;
    this.dispatchControlsVisible(true, true);
    this.performUpdate();
    if (this.videoElement) {
      const videoElement = this.videoElement as HTMLVideoElement;
      videoElement.addEventListener("error", () => {
        const code = videoElement.error?.code;
        this.failLoad(`Media element error #${code}`, mediaErrorMessage(code));
      });
      videoElement.src = base64;
      videoElement.load();
    } else {
      this.failMissingElement();
    }
  }

  loadVideoURL(url: string) {
    const youtubeOEmbedURL = "https://www.youtube.com/oembed?url=";
    // Taken from the spotify-audio-element source code and adapted to support local URLs
    const spotifyRegex = /open\.spotify\.com\/(?:[a-z\-]+\/)?(\w+)\/(\w+)/i;
    const spotifyOEmbedURL = "https://open.spotify.com/oembed?url=";
    // Taken from the vimeo-video-element source code
    const vimeoRegex = /vimeo\.com\/(?:video\/|event\/)?(\d+)(?:\/([\w-]+))?/;
    const vimeoOEmbedURL = "https://vimeo.com/api/oembed.json?url=";
    // Taken from the tiktok-video-element source code
    const tiktokRegex = /tiktok\.com\/(?:player\/v1\/|share\/video\/|@[^/]+\/video\/)([0-9]+)/;
    const tiktokOEmbedURL = "https://www.tiktok.com/oembed?url=";

    // YOUTUBE
    if (youtubeRegex.test(url)) {
      console.log("Loading YouTube URL:", url);
      this.playerType = PlayerType.YouTube;
      this.dispatchControlsVisible(true, true);
      this.performUpdate();
      if (this.videoElement) {
        const videoElement = this.videoElement as YouTubeVideoElement;
        const youtubeId = url.match(youtubeRegex)[1];
        const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
        
        clearTimeout(this.youtubeLoadTimer);

        const fail = (error: string, message: () => string) => {
          clearTimeout(this.youtubeLoadTimer);
          this.failLoad(error, message);
        };

        videoElement.addEventListener("error", () => {
          const code = videoElement.error?.code;
          fail(`YouTube iframe player error #${code}`, youtubeErrorMessage(code));
        });
        videoElement.addEventListener("loadcomplete", () => clearTimeout(this.youtubeLoadTimer), { once: true });
        this.youtubeLoadTimer = window.setTimeout(
          () => fail("YouTube player did not initialise", youtubeErrorMessage(NaN)),
          10000
        );

        videoElement.config = { disablekb: 1 };
        videoElement.src = embedUrl;

        fetch(youtubeOEmbedURL + encodeURIComponent(url))
          .then(response => response.json())
          .then((data) => {
            this.dispatchEvent(
              new CustomEvent("setvideodetails", { bubbles: true, composed: true, detail: { title: data.title, author: data.author_name } })
            );
          })
          .catch(error => {
            console.warn("Error fetching YouTube video details:", error);
          });
      } else {
        this.failMissingElement();
      }
    }

    // SPOTIFY
    else if (spotifyRegex.test(url)) {
      console.log("Loading Spotify URL:", url);
      const spotifyType = url.match(spotifyRegex)[1].toLowerCase();
      if (spotifyType === "playlist" || spotifyType === "album" || spotifyType === "artist" || spotifyType === "show" || spotifyType === "user") {
        this.failLoad(
          `Unsupported Spotify source type: ${spotifyType}`,
          () => msg("Spotify albums and playlists aren't supported. Please use a link to a single track or episode.")
        );
        return;
      }
      url = "https://open.spotify.com/" + url.match(spotifyRegex)[1] + "/" + url.match(spotifyRegex)[2];
      this.playerType = PlayerType.Spotify;
      this.dispatchControlsVisible(false, false);
      this.performUpdate();
      if (this.videoElement) {
        (this.videoElement as SpotifyAudioElement).addEventListener("error", () => {
          this.failLoad("Spotify player error", spotifyErrorMessage());
        });
        (this.videoElement as SpotifyAudioElement).src = url;

        fetch(spotifyOEmbedURL + encodeURIComponent(url))
          .then(response => response.json())
          .then((data) => {
            this.dispatchEvent(
              new CustomEvent("setvideodetails", { bubbles: true, composed: true, detail: { title: data.title } })
            );

            const thumbnailURL = data.thumbnail_url;
            const thumbnailWidth = data.thumbnail_width;
            const thumbnailHeight = data.thumbnail_height;
            
            if (this.thumbnailContainerElement) {
              if (thumbnailWidth / thumbnailHeight === 16 / 9) {
                this.thumbnailContainerElement.classList.add("landscape");
                this.thumbnailBackgroundElement.src = "";
              } else if (this.thumbnailBackgroundElement) {
                this.thumbnailContainerElement.classList.remove("landscape");
                this.thumbnailBackgroundElement.src = thumbnailURL;
              }
            }
            if (this.thumbnailElement) {
              this.thumbnailElement.src = thumbnailURL;
            }
          })
          .catch(error => {
            console.warn("Error fetching Spotify video details:", error);
          });
      } else {
        this.failMissingElement();
      }
    } 

    // VIMEO
    else if  (vimeoRegex.test(url)) {
      console.log("Loading Vimeo URL:", url);
      this.playerType = PlayerType.Vimeo;
      this.dispatchControlsVisible(true, true);
      this.performUpdate();
      if (this.videoElement) {
        const videoElement = this.videoElement as VimeoVideoElement;
        this.clearVimeoMessageListener();

        const fail = (error: string) => {
          this.clearVimeoMessageListener();
          this.failLoad(error, vimeoErrorMessage());
        };

        this.vimeoMessageListener = (e: MessageEvent) => {
          if (e.origin !== "https://player.vimeo.com") return;
          let data: any;
          try {
            data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          } catch {
            return;
          }
          if (data?.event === "error") {
            fail(`Vimeo player error: ${data.data?.name ?? data.data?.message ?? "unknown"}`);
          }
        };
        window.addEventListener("message", this.vimeoMessageListener);

        videoElement.addEventListener("error", () => {
          fail("Vimeo player error");
        });
        videoElement.addEventListener("loadcomplete", () => {
          this.clearVimeoMessageListener();
        }, { once: true });

        videoElement.config = {
          dnt: true,
        };
        videoElement.src = url;

        fetch(vimeoOEmbedURL + encodeURIComponent(url))
          .then(response => response.json())
          .then((data) => {
            this.dispatchEvent(
              new CustomEvent("setvideodetails", { 
                bubbles: true, composed: true, 
                detail: { title: data.title, author: data.author_name, duration: data.duration } 
              })
            );
          })
          .catch(error => {
            console.warn("Error fetching Vimeo video details:", error);
          });
      } else {
        this.failMissingElement();
      }
    }

    // TIKTOK
    else if  (tiktokRegex.test(url)) {
      console.log("Loading TikTok URL:", url);
      this.playerType = PlayerType.TikTok;
      this.dispatchControlsVisible(false, false);
      this.performUpdate();
      if (this.videoElement) {
        (this.videoElement as TikTokVideoElement).addEventListener("error", () => {
          this.failLoad("TikTok player error", tiktokErrorMessage());
        });
        (this.videoElement as TikTokVideoElement).config = {
          fullscreen_button: false,
          progress_bar: false,
          play_button: true,
          volume_control: false,
          timestamp: false,
          music_info: false,
          description: false,
          rel: false,
          autoplay: true,
          muted: true,
        } as TikTokVideoElement["config"];
        (this.videoElement as TikTokVideoElement).src = url;

        fetch(tiktokOEmbedURL + encodeURIComponent(url))
          .then(response => {
            if (!response.ok) {
              throw new Error(`oEmbed responded with status ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            this.dispatchEvent(
              new CustomEvent("setvideodetails", { 
                bubbles: true, composed: true,
                detail: { title: data.title, author: data.author_name }
              })
            );
            this.dispatchEvent(new Event("canplay", { bubbles: true, composed: true }));
          })
          .catch(error => {
            console.warn("Error fetching TikTok video details:", error);
            this.failLoad(`TikTok oEmbed request failed: ${error}`, tiktokErrorMessage());
          });
      } else {
        this.failMissingElement();
      }
    }
    
    // DIRECT VIDEO OR AUDIO URL
    else {
      console.log("Loading direct media URL:", url);

      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            this.failLoad(
              `Media URL responded with status ${response.status}`,
              () => msg("The media could not be loaded. The link may be broken or the file may no longer exist.")
            );
            return;
          }

          const contentType = response.headers.get("Content-Type") ?? "";
          if (contentType.startsWith("video/")) {
            this.playerType = PlayerType.HTMLVideo;
          } else if (contentType.startsWith("audio/")) {
            this.playerType = PlayerType.HTMLAudio;
          } else {
            this.failLoad(
              "URL is not a valid video or audio file",
              () => msg("This link doesn't point to a video or audio file. Please check the link, or use a link to a supported service.")
            );
            return;
          }
          
          this.dispatchControlsVisible(true, true);
          this.performUpdate();
          if (this.videoElement) {
            const videoElement = this.videoElement as HTMLVideoElement;
            videoElement.addEventListener("error", () => {
              const code = videoElement.error?.code;
              this.failLoad(`Media element error #${code}`, mediaErrorMessage(code));
            });
            videoElement.src = url;
            videoElement.load();
          } else {
            this.failMissingElement();
          }
        })
        .catch(error => {
          console.warn("Error fetching media URL:", error);
          this.failLoad(
            "Error fetching media URL",
            () => msg("The media could not be loaded. Please check the link and your internet connection, then try again.")
          );
        });
    }
  }

  clearVideo() {
    clearTimeout(this.youtubeLoadTimer);
    this.clearVimeoMessageListener();
    this.setBuffering(false);
    this.playerType = PlayerType.Placeholder;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.youtubeLoadTimer);
    this.setBuffering(false);
    this.clearVimeoMessageListener();
  }

  private clearVimeoMessageListener() {
    if (this.vimeoMessageListener) {
      window.removeEventListener("message", this.vimeoMessageListener);
      this.vimeoMessageListener = undefined;
    }
  }

  get aspectRatio() {
    if (this.videoElement && this.playerType === PlayerType.HTMLVideo && this.videoElement instanceof HTMLVideoElement && this.videoElement.videoWidth && this.videoElement.videoHeight) {
      return this.videoElement.videoWidth / this.videoElement.videoHeight;
    }
    if (this.videoElement && this.playerType === PlayerType.YouTube && (this.videoElement as any).api && (this.videoElement as any).api.playerInfo && (this.videoElement as any).api.playerInfo.videoContentRect) {
      const api = (this.videoElement as any).api;
      return api.playerInfo.videoContentRect.width / api.playerInfo.videoContentRect.height;
    }
    return 16 / 9; // Default aspect ratio
  }

  /** HTMLVideoElement-like API */

  get volume() {
    return this.videoElement?.volume ?? 1;
  }
  set volume(value: number) {
    if (this.videoElement && this.playerType !== PlayerType.Spotify && this.playerType !== PlayerType.TikTok) {
      this.videoElement.volume = this.playerType === PlayerType.Vimeo ? value : value ** 2;
    }
  }

  get muted() {
    return this.videoElement?.muted ?? false;
  }
  set muted(value: boolean) {
    if (this.videoElement) {
      this.videoElement.muted = value;
    }
  }

  get currentTime() {
    return this.videoElement?.currentTime ?? 0;
  }
  set currentTime(value: number) {
    if (this.videoElement) {
      this.videoElement.currentTime = value;
    }
  }

  get duration() {
    if (this.videoElement && this.videoElement.duration && !isNaN(this.videoElement.duration) && isFinite(this.videoElement.duration)) {
      return this.videoElement.duration;
    }
    if (this.videoContext && this.videoContext.videoDetails && this.videoContext.videoDetails.duration && !isNaN(this.videoContext.videoDetails.duration) && isFinite(this.videoContext.videoDetails.duration)) {
      return this.videoContext.videoDetails.duration;
    }
    return 0;
  }

  get playbackRate() {
    return this.videoElement?.playbackRate ?? 1;
  }
  set playbackRate(value: number) {
    if (this.videoElement) {
      this.videoElement.playbackRate = value;
    }
  }

  get paused() {
    return this.videoElement?.paused ?? true;
  }

  get ended() {
    return this.videoElement?.ended ?? false;
  }

  play() {
    this.videoElement?.play().catch((error) => {
      console.warn("Error playing video:", error);
    });
  }

  pause() {
    this.videoElement?.pause();
  }

  protected updated(
    _changedProperties: Map<PropertyKey | symbol, unknown>
  ): void {
    if (_changedProperties.has("playerType")) {
      this.addVideoEventListeners();
      this.dispatchEvent(
        new CustomEvent("setvideotype", { bubbles: true, composed: true, detail: { type: PlayerType[this.playerType].toLowerCase() } })
      );
    }
  }

  private addVideoEventListeners() {
    if (!this.videoElement) return;

    this.setBuffering(false);
    BUFFERING_START_EVENTS.forEach((eventName) => {
      this.videoElement.addEventListener(eventName, () => this.setBuffering(true));
    });
    BUFFERING_END_EVENTS.forEach((eventName) => {
      this.videoElement.addEventListener(eventName, () => this.setBuffering(false));
    });

    VIDEO_EVENTS.forEach((eventName) => {
      this.videoElement.addEventListener(eventName, () => {
        // console.log(`Video event: ${eventName}`);
        this.dispatchEvent(
          new Event(eventName, { bubbles: true, composed: true })
        );
      });
    });

    if (this.playerType === PlayerType.YouTube) {
      this.videoElement.addEventListener("loadcomplete", () => {        
        this.dispatchEvent(
          new Event("canplay", { bubbles: true, composed: true })
        );
      }, { once: true } );
    }
    else if (this.playerType === PlayerType.Vimeo) {
      this.videoElement.addEventListener("durationchange", () => {
        this.dispatchEvent(
          new Event("canplay", { bubbles: true, composed: true })
        );
      }, { once: true } );
    }
    else if (this.playerType === PlayerType.Spotify) {
      this.videoElement.addEventListener("durationchange", () => {
        this.dispatchEvent(
          new Event("canplay", { bubbles: true, composed: true })
        );
      }, { once: true } );
      this.videoElement.addEventListener("waiting", () => {
        this.play();
      });
    } 
    else if (this.playerType === PlayerType.TikTok) {
      (this.videoElement as any).loadComplete.then(() => {
        this.dispatchEvent(
          new Event("canplay", { bubbles: true, composed: true })
        );
        this.muted = true;
        this.play();
        this.videoElement.addEventListener("play", () => {
          this.pause();
          this.currentTime = 0;
          this.muted = false;
        }, { once: true } );
      })
      .catch((error: unknown) => {
        console.warn("Error loading TikTok video:", error);
        this.failLoad("TikTok player did not initialise", tiktokErrorMessage());
      });
    }
  }

  private dispatchControlsVisible(volumeVisible: boolean, playbackRateVisible: boolean) {
    this.dispatchEvent(new CustomEvent("setvolumecontrolsvisible", { detail: { visible: volumeVisible } }));
    this.dispatchEvent(new CustomEvent("setplaybackratecontrolsvisible", { detail: { visible: playbackRateVisible } }));
  }
}
