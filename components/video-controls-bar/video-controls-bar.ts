import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlIconButton,
  SlRange,
  SlDropdown,
  SlMenu,
  SlMenuItem,
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

import volumeDown from "@tabler/icons/outline/volume-2.svg";
import volumeUp from "@tabler/icons/outline/volume.svg";
import volumeMute from "@tabler/icons/outline/volume-3.svg";
import volumeOff from "@tabler/icons/outline/volume-off.svg";

import add from "@tabler/icons/filled/square-rounded-plus.svg";

import fullscreenEnter from "@tabler/icons/outline/arrows-maximize.svg";
import fullscreenExit from "@tabler/icons/outline/arrows-minimize.svg";

import brandSpeedtest from "@tabler/icons/outline/brand-speedtest.svg";

import { formatTime, parseTime } from "../../utils/timeFormatter";

import styles from "./video-controls-bar.styles";

export class VideoControlsBar extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @property({ type: Object }) accessor currentChapter;
  /**
   * Query for the mute button.
   */
  @query("#mute-volume-button")
  accessor muteButton: SlIconButton;

  /**
   * Query for the volume slider.
   */
  @query("#volume-slider")
  accessor volumeSlider;

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
   * Query for the add interactions button.
   */
  @query("#add-button")
  accessor addButton: SlIconButton;

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
    };
  }

  //import CSS
  static styles = [styles];

  /*

 */

  firstUpdated() {
    console.log(this.isContentEditable);
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
          <p id="time-stamp">00:00/00:00</p>
          ${this.videoContext.hasChapters
            ? html`
                <sl-icon-button
                  class="icon-button"
                  id="chapters-button"
                  @click=${this.toggleChaptersDrawer}
                  src="${list}"
                ></sl-icon-button>
              `
            : ""}
          ${this.renderCurrentChapter()}
        </div>
        <!-- contains the volume slider and other controls -->
        <div id="controls-lower-right">
          <sl-icon-button
            class="icon-button"
            id="mute-volume-button"
            @click=${this.handleMuteClick}
            src="${volumeDown}"
          >
          </sl-icon-button>
          <sl-range
            id="volume-slider"
            style="--thumb-size: 15px; --track-height: 5px;"
            @sl-change=${this.handleVolumeChange}
          ></sl-range>
          <sl-icon-button
            class="icon-button"
            src="${add}"
            id="add-button"
            @click=${this.handleAddClick}
            @drop=${this.handleBaubleDroppedOnAdd}
            ?disabled=${!this.isContentEditable}
          >
          </sl-icon-button>
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
            <sl-menu>
              <sl-menu-item>
                Playback Speed
                <sl-menu slot="submenu">
                  <sl-menu-item value="0.25">0.25x</sl-menu-item>
                  <sl-menu-item value="0.5">0.5x</sl-menu-item>
                  <sl-menu-item value="1">1x</sl-menu-item>
                  <sl-menu-item value="1.5">1.5x</sl-menu-item>
                  <sl-menu-item value="2">2x</sl-menu-item>
                </sl-menu>
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
          <!-- <sl-icon-button
            class="icon-button"
            id="fullscreen-button"
            src="${fullscreenEnter}"
            @click=${this.handleFullscreenClick}
          ></sl-icon-button> -->
        </div>
      </div>`;
  }

  /**
   * Handles the click event when the play button is clicked.
   *
   * @param e - The custom event object.
   */
  handlePlayClick = (e: CustomEvent) => {
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
  handleMuteClick = (e: CustomEvent) => {
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
      ? html`<div id="current-chapter">${this.currentChapter.title}</div>`
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
      this.fullscreenButton.setAttribute("src", `${fullscreenEnter}`);
      document.exitFullscreen();
      this.removeEventListener("resize", this.handleFullscreenResize);
    } else {
      this.fullscreenButton.setAttribute("src", `${fullscreenExit}`);
      this.addEventListener("resize", this.handleFullscreenResize);
      this.requestFullscreen();
      // MARK: todo
      if (!this.checkControlsVisible()) {
        this.makeControlsSticky();
      }
    }
  };

  /**
   * Handles the click event for the add button.
   */
  handleAddClick = () => {
    if (!this.videoContext.videoLoaded) return;

    this.dispatchEvent(
      new CustomEvent("toggleInteractionsDrawer", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handles the event when a bauble is dropped on the "add" button.
   * This deletes the object. When the drag event starts the add button turns into a trash can.
   * @param e - The DragEvent object representing the drop event.
   *
   */
  handleBaubleDroppedOnAdd(e: DragEvent) {
    // this.dropArea.style.background = "none";
    // this.deleteElement();
    // this.changeActiveElement(
    //   parseInt(e.dataTransfer.getData("previousActive"))
    // );
    // this.changeTrashToAdd();
    //TODO:
  }

  /**
   * Event handler for selection of playback speeds from the setting menu.
   * @param {CustomEvent} e - The custom event object.
   */
  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoContext.videoLoaded) return;

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
    console.log("i was called from", e.stack);
  }

  /**
   * Checks if the controls are visible based on the height of the window and the offset height of the element.
   * @returns {boolean} Returns true if the controls are visible, false otherwise.
   */
  checkControlsVisible(): Boolean {
    if (window.innerHeight < this.offsetHeight) {
      console.log("controls not visible");
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

  handleTimeUpdate(lastTimeupdate, videoDurationFormatted) {
    this.timeStamp.innerHTML =
      formatTime(lastTimeupdate) + "/" + videoDurationFormatted;
  }
}
