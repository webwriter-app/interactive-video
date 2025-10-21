import { LitElementWw } from "@webwriter/lit";
import {
  InteractiveVideoContext,
  videoContext,
} from "../../utils/interactive-video-context";
import { consume } from "@lit/context";
import { property, query } from "lit/decorators.js";
import styles from "./video-player.styles";
import { html } from "lit";

import YouTubeVideoElement from "youtube-video-element";
import VimeoVideoElement from "vimeo-video-element";
import TikTokVideoElement from "tiktok-video-element";
import SpotifyAudioElement from "spotify-audio-element";
import { WaveSurferAudioElement } from "../wavesurfer-audio-element/wavesurfer-audio-element";

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

  static get scopedElements() {
    return {
      "youtube-video": YouTubeVideoElement,
      "vimeo-video": VimeoVideoElement,
      "tiktok-video": TikTokVideoElement,
      "spotify-audio": SpotifyAudioElement,
      "wavesurfer-audio": WaveSurferAudioElement,
    };
  }

  //import CSS
  static styles = [styles];

  render() {
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

  loadVideoBase64(base64: string) {
    // check if base64 is video or audio
    const isVideo = base64.startsWith("data:video");
    const isAudio = base64.startsWith("data:audio");
    if (!isVideo && !isAudio) {
      this.dispatchEvent(
        new CustomEvent("loadingerror", { detail: { error: "Invalid base64 string" } })
      );
      return;
    }

    this.playerType = isVideo ? PlayerType.HTMLVideo : PlayerType.HTMLAudio;
    this.dispatchControlsVisible(true, true);
    this.performUpdate();
    if (this.videoElement) {(
      this.videoElement as YouTubeVideoElement).addEventListener("error", (e) => {
        this.dispatchEvent(
          new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
        );
      });
      this.videoElement.src = base64;
      this.videoElement.load();
    } else {
      console.warn("Video element not found");
    }
  }

  loadVideoURL(url: string) {
    // Taken from the youtube-video-element source code
    const youtubeRegex =
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((\w|-){11})/;
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
        (this.videoElement as YouTubeVideoElement).addEventListener("error", (e) => {
          this.dispatchEvent(
            new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
          );
        });
        (this.videoElement as YouTubeVideoElement).config = {
          disablekb: 1,
        };
        (this.videoElement as YouTubeVideoElement).src = url;

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
        console.warn("Video element not found");
      }
    }

    // SPOTIFY
    else if (spotifyRegex.test(url)) {
      console.log("Loading Spotify URL:", url);
      url = "https://open.spotify.com/" + url.match(spotifyRegex)[1] + "/" + url.match(spotifyRegex)[2];
      this.playerType = PlayerType.Spotify;
      this.dispatchControlsVisible(false, false);
      this.performUpdate();
      if (this.videoElement) {
        (this.videoElement as SpotifyAudioElement).addEventListener("error", (e) => {
          this.dispatchEvent(
            new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
          );
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
        console.warn("Video element not found");
      }
    } 

    // VIMEO
    else if  (vimeoRegex.test(url)) {
      console.log("Loading Vimeo URL:", url);
      this.playerType = PlayerType.Vimeo;
      this.dispatchControlsVisible(true, true);
      this.performUpdate();
      if (this.videoElement) {
        (this.videoElement as VimeoVideoElement).addEventListener("error", (e) => {
          this.dispatchEvent(
            new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
          );
        });
        (this.videoElement as VimeoVideoElement).config = {
          dnt: true,
        };
        (this.videoElement as VimeoVideoElement).src = url;

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
        console.warn("Video element not found");
      }
    }

    // TIKTOK
    else if  (tiktokRegex.test(url)) {
      console.log("Loading TikTok URL:", url);
      this.playerType = PlayerType.TikTok;
      this.dispatchControlsVisible(false, false);
      this.performUpdate();
      if (this.videoElement) {
        (this.videoElement as TikTokVideoElement).addEventListener("error", (e) => {
          this.dispatchEvent(
            new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
          );
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
        };
        (this.videoElement as TikTokVideoElement).src = url;

        fetch(tiktokOEmbedURL + encodeURIComponent(url))
          .then(response => response.json())
          .then((data) => {
            this.dispatchEvent(
              new CustomEvent("setvideodetails", { 
                bubbles: true, composed: true,
                detail: { title: data.title, author: data.author_name }
              })
            );
          })
          .catch(error => {
            console.warn("Error fetching TikTok video details:", error);
          });
      } else {
        console.warn("Video element not found");
      }
    }
    
    // DIRECT VIDEO OR AUDIO URL
    else {
      console.log("Loading direct media URL:", url);

      fetch(url, { method: 'HEAD' })
        .then(response => {
          const contentType = response.headers.get("Content-Type");
          if (contentType) {
            if (contentType.startsWith("video/")) {
              this.playerType = PlayerType.HTMLVideo;
            } else if (contentType.startsWith("audio/")) {
              this.playerType = PlayerType.HTMLAudio;
              this.dispatchControlsVisible(true, true);
              this.performUpdate();
            } else {
              this.dispatchEvent(
                new CustomEvent("loadingerror", { detail: { error: "URL is not a valid video or audio file" } })
              );
              return;
            }
            
            this.dispatchControlsVisible(true, true);
            this.performUpdate();
            if (this.videoElement) {
              (this.videoElement as HTMLVideoElement).addEventListener("error", (e) => {
                this.dispatchEvent(
                  new CustomEvent("loadingerror", { detail: { error: (e as ErrorEvent).message } })
                );
              });
              this.videoElement.src = url;
              this.videoElement.load();
            } else {
              console.warn("Video element not found");
            }
          }
        })
        .catch(error => {
          console.warn("Error fetching media URL:", error);
          this.dispatchEvent(
            new CustomEvent("loadingerror", { detail: { error: "Error fetching media URL" } })
          );
        });
    }
  }

  clearVideo() {
    this.playerType = PlayerType.Placeholder;
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
      this.videoElement.volume = value;
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
      });
    }
  }

  private dispatchControlsVisible(volumeVisible: boolean, playbackRateVisible: boolean) {
    this.dispatchEvent(new CustomEvent("setvolumecontrolsvisible", { detail: { visible: volumeVisible } }));
    this.dispatchEvent(new CustomEvent("setplaybackratecontrolsvisible", { detail: { visible: playbackRateVisible } }));
  }
}
