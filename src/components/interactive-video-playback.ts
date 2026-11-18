import { computed, signal } from "@webwriter/lit";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.component.js";
import playerPlay from "@tabler/icons/filled/player-play.svg";
import playerPause from "@tabler/icons/filled/player-pause.svg";
import { PlayerType, type SpotifyApiElement } from "./video-player";
import { chapterAt } from "../model/timeline";
import { formatTime } from "../model/time-format";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";

/** Playback commands and the handlers for the player's events, kept in step with the controls. */
export class PlaybackController {
  rate = 1;
  /** Whether the progress bar is being dragged; the bar then follows the pointer, not the media. */
  scrubbing = false;

  readonly #time = signal(0);
  readonly #chapter = signal("");
  /** The values that the widget publishes to other widgets. */
  readonly signals = {
    time: computed(() => this.#time.get()),
    chapter: computed(() => this.#chapter.get()),
  };

  constructor(private host: WebwriterInteractiveVideo) {}

  play() {
    this.host.videoPlayer.play();
  }

  pause() {
    this.host.videoPlayer.pause();
  }

  /** Toggles playback; a media that has ended starts again from the beginning. */
  toggle() {
    const { videoPlayer } = this.host;
    if (!this.host.videoLoaded) return;

    if (videoPlayer.ended) {
      videoPlayer.currentTime = 0;
      this.play();
    } else if (videoPlayer.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /** Skips by the given seconds, forward when positive. */
  skip(amount: number) {
    const { videoPlayer } = this.host;
    videoPlayer.currentTime = Math.min(Math.max(videoPlayer.currentTime + amount, 0), videoPlayer.duration);
  }

  setVolume(percent: number) {
    this.host.videoPlayer.volume = percent / 100;
  }

  toggleMute() {
    this.host.videoPlayer.muted = !this.host.videoPlayer.muted;
  }

  changeRate(value: number | string) {
    const rate = Number.parseFloat(String(value));
    this.host.videoPlayer.playbackRate = rate;
    this.rate = rate;
    this.host.requestUpdate();
  }

  /** Publishes the position and the chapter. */
  publishTime(time: number) {
    this.#time.set(time);
    this.#chapter.set(this.host.hideChapters ? "" : chapterAt(this.host.chapterConfig, time)?.title ?? "");
  }

  /** Keeps the controls that show the current chapter in step with the current time. */
  updateCurrentChapter() {
    const { host } = this;
    host.videoControlsBar.currentChapter = host.hideChapters ? null : chapterAt(host.chapterConfig, host.videoPlayer.currentTime);
  }

  handlePlay() {
    this.host.videoControlsBar.playButton.setAttribute("src", `${playerPause}`);
    this.#animatePlayButton();
  }

  handlePause() {
    this.host.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    this.#animatePlayButton();
  }

  /**
   * Called inconsistently by the player. It sets `lastTimeUpdate`, whose change renders the widget again
   * and with that shows the interactions that are due.
   */
  handleTimeUpdate = () => {
    const { host } = this;
    if (this.scrubbing) return;

    const time = host.videoPlayer.currentTime;
    host.lastTimeUpdate = time;
    this.publishTime(time);
    host.progressBar.value = time;
    host.videoControlsBar.handleTimeUpdate(time);
    this.updateCurrentChapter();

    if (time >= host.videoPlayer.duration) {
      host.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    }
  };

  handleProgressChange = (e: CustomEvent) => {
    const { host } = this;
    host.interactions.showPopups();
    const currentTime = (e.target as SlRange).value;

    if (host.videoPlayer.playerType === PlayerType.Spotify && currentTime === 0) {
      (host.videoPlayer.videoElement as SpotifyApiElement).api?.restart();
    }
    host.videoPlayer.currentTime = currentTime;
    host.videoControlsBar.handleTimeUpdate(Math.floor(currentTime));
  };

  /** Sets up what does not have to wait for the media to load fully. */
  handleDurationChange = () => {
    const { host } = this;
    // The elements have to be rendered before they are set up.
    setTimeout(() => {
      const duration = host.videoPlayer.duration;
      if (host.progressBar) {
        host.progressBar.max = duration;
        host.progressBar.tooltipFormatter = (value: number) => formatTime(Math.floor(value));
      }

      if (host.videoControlsBar.timeStamp && duration) {
        host.videoControlsBar.handleDurationUpdate(Math.floor(duration));
      }

      host.updateBaublePositions();
      host.requestUpdate();

      if (host.videoDetails && !host.videoDetails.duration) {
        host.videoDetails = { ...host.videoDetails, duration: Math.floor(duration) };
        host.updateContext();
      }
    }, 0);
  };

  #animatePlayButton() {
    const { playButton } = this.host.videoControlsBar;
    playButton.classList.add("scale-animation");
    setTimeout(() => playButton.classList.remove("scale-animation"), 300);
  }
}
