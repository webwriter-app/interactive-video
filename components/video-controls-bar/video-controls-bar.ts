import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlIconButton,
  SlRange,
  SlDropdown,
  SlMenu,
  SlMenuItem,
  SlButton,
  SlIcon,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { consume } from "@lit/context";

//Tabler
import playerPlay from "@tabler/icons/filled/player-play.svg";
import list from "@tabler/icons/outline/list.svg";
import add from "@tabler/icons/outline/timeline-event-plus.svg";

import volumeDown from "@tabler/icons/outline/volume-2.svg";
import volumeUp from "@tabler/icons/outline/volume.svg";
import volumeMute from "@tabler/icons/outline/volume-3.svg";
import volumeOff from "@tabler/icons/outline/volume-off.svg";

import fullscreenEnter from "@tabler/icons/outline/arrows-maximize.svg";
import fullscreenExit from "@tabler/icons/outline/arrows-minimize.svg";

import brandSpeedtest from "@tabler/icons/outline/brand-speedtest.svg";

import { formatTime, parseTime } from "../../utils/timeFormatter";

import styles from "./video-controls-bar.styles";
import { msg } from "@lit/localize";

export class VideoControlsBar extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @property({ type: Boolean, attribute: true, reflect: true })
  accessor volumeHidden: boolean = false;

  @property({ type: Boolean, attribute: true, reflect: true })
  accessor playbackRateHidden: boolean = false;

  @property({ type: Number, attribute: true, reflect: true })
  accessor currentTime: number = 0;

  @property({ type: Number, attribute: true, reflect: true })
  accessor videoDuration: number = 0;

  @property({ type: Number })
  accessor playbackRate: number = 1;

  @property({ type: Object }) 
  accessor currentChapter;

  /**
   * Query for the mute button.
   */
  @query("#mute-volume-button")
  accessor muteButton: SlIconButton;

  /**
   * Query for the add interactions button.
   */
  @query("#add-button")
  accessor addButton: SlButton;

  /**
   * Query for the volume slider.
   */
  @query("#volume-slider")
  accessor volumeSlider: SlRange;

  @query("#playback-rate-options")
  accessor playbackRateOptions: SlMenu;

  /**
   * Query for the fullscreen button.
   */
  @query("#fullscreen-button")
  accessor fullscreenButton: SlIconButton;

  /**
   * Query for the play button
   */
  @query("#play")
  accessor playButton: SlIconButton;

  /**
   * Query for the videos time stamp.
   */
  @query("#time-stamp")
  accessor timeStamp;

  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */
  static get scopedElements() {
    return {
      "sl-icon-button": SlIconButton,
      "sl-range": SlRange,
      "sl-dropdown": SlDropdown,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
    };
  }

  //import CSS
  static styles = [styles];

  private boundKeydownHandler;

  constructor() {
    super();
    this.boundKeydownHandler = this.keydownHandler.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.boundKeydownHandler, true);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.boundKeydownHandler, true);
  }

  /**
   * Renders the lower controls for the webwriter interactive video widget.
   *
   * @remarks
   * This function renders the lower controls for the interactive video widget, including the play button, time stamp, volume slider, and fullscreen button.
   * If the video has chapters, it also renders a chapters button.
   * If the content is editable, it renders an add button for adding interactive elements.
   */
  render() {
    return html` <!--  -->
      <div id="controls-lower">
        <div id="controls-lower-left">
          <sl-icon-button
            class="icon-button"
            id="play"
            @click=${this.handlePlayClick}
            src="${playerPlay}"
          ></sl-icon-button>
          <p id="time-stamp">
            ${formatTime(this.currentTime) + 
              (this.isValidDuration() ? (" / " + formatTime(this.videoDuration)) : 
              ((this.videoContext.videoDetails && this.isValidDuration(this.videoContext.videoDetails.duration)) ? (" / " + formatTime(this.videoContext.videoDetails.duration)) : ""))}
          </p>
          ${this.videoContext.hasChapters
            ? html` <sl-button
                id="chapters-button"
                @click=${this.toggleChaptersDrawer}
              >
                <sl-icon
                  style="height: 20px; width: 20px;"
                  slot="prefix"
                  src=${list}
                ></sl-icon>
                ${this.renderCurrentChapter()}
              </sl-button>`
            : null}
        </div>
        <!-- contains the volume slider and other controls -->
        <div id="controls-lower-right">
          ${this.isContentEditable ? html`
          <sl-button
            id="add-button"
            @click=${this.handleAddClick}
          >
            <sl-icon
              slot="prefix"
              src=${add}
              style="height: 20px; width: 20px;"
            ></sl-icon>
            ${msg("Add Popup")}
          </sl-button>` : null}
          ${!this.volumeHidden ? html`
            <div
              style="display: flex; flex-direction: row; gap: 6px; align-items: center; justify-content: center;"
            >
              <sl-icon-button
                class="volume-button"
                id="mute-volume-button"
                @click=${this.handleMuteClick}
                src="${volumeUp}"
              >
              </sl-icon-button>
              <sl-range
                id="volume-slider"
                style="--thumb-size: 15px; --track-height: 5px; --tooltip-offset: 22px"
                .tooltipFormatter=${(value: number) => Math.round(value) + "\u2009%"}
                @sl-input=${this.handleVolumeChange}
              ></sl-range>
            </div>` : null
          }

          ${(!this.playbackRateHidden && this.videoContext.allowPlaybackRateChange) ? html`
            <sl-dropdown
              placement="top-start"
              id="settings-menu"
              @sl-select=${this.settingSelectionHandler}
            >
              <sl-icon-button
                class="icon-button"
                id="settings-button"
                src="${brandSpeedtest}"
                slot="trigger"
              ></sl-icon-button>
              <sl-menu id="playback-rate-options">
                <sl-menu-item value="0.25" type="checkbox" ?checked=${this.playbackRate === 0.25}>0.25x</sl-menu-item>
                <sl-menu-item value="0.5" type="checkbox" ?checked=${this.playbackRate === 0.5}>0.5x</sl-menu-item>
                <sl-menu-item value="1" type="checkbox" ?checked=${this.playbackRate === 1}>1x</sl-menu-item>
                <sl-menu-item value="1.5" type="checkbox" ?checked=${this.playbackRate === 1.5}>1.5x</sl-menu-item>
                <sl-menu-item value="2" type="checkbox" ?checked=${this.playbackRate === 2}>2x</sl-menu-item>
              </sl-menu>
            </sl-dropdown>` : null
          }

          <sl-icon-button
            class="icon-button"
            id="fullscreen-button"
            src="${fullscreenEnter}"
            @click=${this.handleFullscreenClick}
          ></sl-icon-button>
        </div>
      </div>`;
  }

  private isValidDuration(duration: number = this.videoDuration) {
    return duration && !isNaN(duration) && duration !== Infinity && duration > 0;
  }

  /**
   * Handles the click event when the play button is clicked.
   *
   * @param e - The custom event object.
   */
  handlePlayClick = () => {
    this.dispatchEvent(
      new CustomEvent("startstopVideo", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Toggles the chapters drawer open or closed.
   */
  toggleChaptersDrawer() {
    this.dispatchEvent(
      new CustomEvent("toggleChaptersDrawer", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles the change event for the volume slider and sets the video volume and button icon accordingly.
   *
   * @param e - The custom event object.
   */
  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;

    this.volumeButtonIconHelper();

    this.dispatchEvent(
      new CustomEvent("volumeChange", {
        detail: { value: volumeSlider.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Updates the volume button icon based on the current state of the video and volume slider.
   * If the video is muted, no changes are made to the icon.
   * If the volume slider value is 0, the mute button icon is set to `volumeOff`.
   * If the volume slider value is less than 50, the mute button icon is set to `volumeDown`.
   * If the volume slider value is 50 or greater, the mute button icon is set to `volumeUp`.
   */
  volumeButtonIconHelper() {
    if (this.volumeSlider.value === 0)
      this.muteButton.setAttribute("src", `${volumeOff}`);
    else {
      this.volumeSlider.value < 50
        ? this.muteButton.setAttribute("src", `${volumeDown}`)
        : this.muteButton.setAttribute("src", `${volumeUp}`);
    }
  }

  /**
   * Handles the click event for the mute button.
   *
   * @param e - The custom event object.
   */
  handleMuteClick = () => {
    if (!this.videoContext.videoLoaded) return;

    this.dispatchEvent(
      new CustomEvent("toggleMute", {
        bubbles: true,
        composed: true,
      })
    );

    if (this.muteButton.src === volumeMute) {
      this.volumeButtonIconHelper();
    } else {
      this.muteButton.setAttribute("src", `${volumeMute}`);
    }
  };

  /**
   * Renders the current chapter of the interactive video.
   *
   * @returns The HTML representation of the current chapter, or an empty string if there is no current chapter.
   */
  renderCurrentChapter() {
    this.dispatchEvent(
      new CustomEvent("getCurrentChapter", {
        bubbles: true,
        composed: true,
      })
    );

    return this.currentChapter
      ? html`<p style="margin: 0px; padding: 0px;">
          ${this.currentChapter.title}
        </p>`
      : "";
  }

  /**
   * Handles the click event for the fullscreen button.
   * If the document is currently in fullscreen mode, it exits fullscreen and updates the fullscreen button icon.
   * If the document is not in fullscreen mode, it enters fullscreen, updates the fullscreen button icon,
   * The controls should be sticky in fullscreen mode, i.e. stick to the lower part of the screen if the video is not fully in view. I didnt get around to doing this.
   */
  handleFullscreenClick = () => {
    if (document.fullscreenElement) {
      this.removeEventListener("resize", this.handleFullscreenResize);
    } else {
      this.addEventListener("resize", this.handleFullscreenResize);
      // MARK: todo
      if (!this.checkControlsVisible()) {
        this.makeControlsSticky();
      }
    }
    this.dispatchEvent(
      new CustomEvent("toggleFullscreen", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Updates the fullscreen button icon based on whether the video is in fullscreen mode or not.
   * If the video is in fullscreen mode, the icon is set to `fullscreenExit`.
   * If the video is not in fullscreen mode, the icon is set to `fullscreenEnter`.
   *
   * @param isFullscreen - A boolean indicating whether the video is in fullscreen mode or not.
   */
  updateFullscreenIcon(isFullscreen: Boolean) {
    if (!this.fullscreenButton) return;

    if (isFullscreen) {
      this.fullscreenButton.setAttribute("src", `${fullscreenExit}`);
    } else {
      this.fullscreenButton.setAttribute("src", `${fullscreenEnter}`);
    }
  }

  /**
   * Handles the click event for the add button.
   */
  handleAddClick = () => {
    if (!this.videoContext.videoLoaded) return;

    this.dispatchEvent(
      new CustomEvent("addInteraction", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Event handler for selection of playback speeds from the setting menu.
   * @param {CustomEvent} e - The custom event object.
   */
  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoContext.videoLoaded) return;

    const item = e.detail.item;
    if (!item || !item.value || item.type !== "checkbox") return;

    this.playbackRateOptions.childNodes.forEach((child) => {
      if (child instanceof SlMenuItem && child !== item) {
        child.checked = false;
      }
    });
    item.checked = true;

    this.dispatchEvent(
      new CustomEvent("playbackRateChange", {
        detail: { value: e.detail.item.value },
        bubbles: true,
        composed: true,
      })
    );
  };

  //TODO: implement
  makeControlsSticky() {
    const e = new Error("Not implemented");
  }

  /**
   * Checks if the controls are visible based on the height of the window and the offset height of the element.
   * @returns {boolean} Returns true if the controls are visible, false otherwise.
   */
  checkControlsVisible(): Boolean {
    if (window.innerHeight < this.offsetHeight) {
      return false;
    }
    return true;
  }

  /**
   * Handles the resize event when the video player enters or exits fullscreen mode.
   * If the controls are not visible, makes the controls sticky.
   */
  handleFullscreenResize() {
    if (!this.checkControlsVisible) {
      this.makeControlsSticky();
    }
  }

  handleTimeUpdate(time: number) {
    this.currentTime = time;
  }

  handleDurationUpdate(duration: number) {
    this.videoDuration = duration;
  }

  keydownHandler(event: KeyboardEvent) {
    // check if the event target is an input element
    const targetPath = event.composedPath() as HTMLElement[];
    let hasWwInteractiveVideoComponent = false;
    for (const el of targetPath) {
      if (el.tagName) {
        const tagName = el.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || tagName === "webwriter-video-interaction") {
          return; // do nothing if the target is an input element
        } else if (tagName === "webwriter-interactive-video") {
          hasWwInteractiveVideoComponent = true;
        }
      }
    }
    if (!hasWwInteractiveVideoComponent) return;
    event.preventDefault();
    if (event.code === "Space" || event.code === "KeyK") {
      this.handlePlayClick();
    } else if (event.code === "KeyF") {
      this.handleFullscreenClick();
    } else if (event.code === "KeyM") {
      this.handleMuteClick();
    } else if (event.code === "ArrowUp") {
      let newVolume = Math.min(this.volumeSlider.value + 5, 100);
      this.volumeSlider.value = newVolume;
      this.volumeSlider.dispatchEvent(new CustomEvent("sl-input"));
    } else if (event.code === "ArrowDown") {
      let newVolume = Math.max(this.volumeSlider.value - 5, 0);
      this.volumeSlider.value = newVolume;
      this.volumeSlider.dispatchEvent(new CustomEvent("sl-input"));
    } else if (event.code === "ArrowRight") {
      this.dispatchEvent(
        new CustomEvent("skipTime", {
          detail: { amount: 5 },
          bubbles: true,
          composed: true,
        })
      );
    } else if (event.code === "ArrowLeft") {
      this.dispatchEvent(
        new CustomEvent("skipTime", {
          detail: { amount: -5 },
          bubbles: true,
          composed: true,
        })
      );
    } else if (event.code === "KeyJ") {
      this.dispatchEvent(
        new CustomEvent("skipTime", {
          detail: { amount: -10 },
          bubbles: true,
          composed: true,
        })
      );
    } else if (event.code === "KeyL") {
      this.dispatchEvent(
        new CustomEvent("skipTime", {
          detail: { amount: 10 },
          bubbles: true,
          composed: true,
        })
      );
    } else if (event.code === "KeyC") {
      this.toggleChaptersDrawer();
    }
  }
}
