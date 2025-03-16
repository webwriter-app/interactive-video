import { html, _$LE } from "lit";
import { LitElementWw } from "@webwriter/lit";

import { customElement, property, query } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { SlButton, SlRange, SlIcon } from "@shoelace-style/shoelace";

import { WwInteractiveBauble } from "../webwriter-interactive-bauble/webwriter-interactive-bauble.component";

import styles from "./webwriter-interactive-video.styles";

//Tabler
import playerPlay from "@tabler/icons/filled/player-play.svg";
import playerPause from "@tabler/icons/filled/player-pause.svg";

import radiusBottomRight from "@tabler/icons/outline/radius-bottom-right.svg";
import trash from "@tabler/icons/filled/trash-x.svg";
import add from "@tabler/icons/filled/square-rounded-plus.svg";

import { provide } from "@lit/context";
import {
  InteractiveVideoContext,
  videoContext,
} from "../../utils/interactive-video-context";

import { videoData } from "../../types/videoData";
import { InteractiveVideoOptions } from "../../components/options-panel/interactive-video-options";
import { VideoInputOverlay } from "../../components/video-input-overlay/video-input-overlay";
import { VideoControlsBar } from "../../components/video-controls-bar/video-controls-bar";
import { VideoInteractionDrawer } from "../../components/video-interaction-drawer/video-interaction-drawer";
import { VideoChapterDrawer } from "../../components/video-chapter-drawer/video-chapter-drawer";
import { InteractionsProgressBar } from "../../components/interactions-progress-bar/interactions-progress-bar";

import { formatTime } from "../../utils/timeFormatter";
/**
 * Class containing the video player as well as all the logic for video playback, interactive elements, controls, file input, and more.
 * This class extends the `LitElementWw` class.
 */
export class WebwriterInteractiveVideo extends LitElementWw {
  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */

  static get scopedElements() {
    return {
      "sl-range": SlRange,
      "sl-icon": SlIcon,
      "webwriter-interactive-bauble": WwInteractiveBauble,
      "interactive-video-options": InteractiveVideoOptions,
      "video-input-overlay": VideoInputOverlay,
      "video-controls-bar": VideoControlsBar,
      "video-interaction-drawer": VideoInteractionDrawer,
      "video-chapter-drawer": VideoChapterDrawer,
      "interactions-progress-bar": InteractionsProgressBar,
    };
  }

  /**
   * The styles for the webwriter-interactive-video component.
   */
  static styles = [styles];

  /**
   *
   */
  @provide({
    context: videoContext,
  })
  @property({
    type: Object,
    attribute: true,
    reflect: true,
  })
  accessor videoContext: InteractiveVideoContext =
    new InteractiveVideoContext();

  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  @property({ type: String })
  accessor videoDurationFormatted: string = "00:00";

  @property({ type: Number })
  accessor lastTimeupdate: number = 0;

  @property({ type: Boolean })
  accessor isDragging = false;

  @query("#video")
  accessor videoElement: HTMLVideoElement;

  @query("video-controls-bar")
  accessor videoControlsBar: VideoControlsBar;

  @query("#progress-bar")
  accessor progressBar;

  @query("video-interaction-drawer")
  accessor interactionDrawer: VideoInteractionDrawer;

  @query("video-chapter-drawer")
  accessor chaptersDrawer: VideoChapterDrawer;

  /**
   * Called when the element is first connected to the document's DOM.
   * @remarks
   * Adds event listeners for fullscreen changes.
   * Also builds the interaction configuration and renders the chapters list, if available.
   */
  connectedCallback() {
    super.connectedCallback();
    this.videoContext.videoLoaded = false;
    this.updateContext();
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
  }

  /*
   * Sets up some default values for the overlay
   */
  firstUpdated() {
    this.updateContext();

    if (this.videoContext.videoBase64) {
      this.setupVideo(this.videoContext.videoBase64);
    } else if (this.videoContext.videoURL) {
      this.setupVideo(this.videoContext.videoURL);
    }
    //this.updateBaublePositions();
  }

  /**
   * Renders the component.
   *
   * @returns either HTML for either the widget or the file input area, depending on whether a video has already been selected.
   */
  render() {
    return html`
      <div id="widget">
        <!-- VIDEO INPUT -->
        ${!this.hasVideo()
          ? html`
              <video-input-overlay
                @setupVideo=${(e: CustomEvent) => this.setupVideo(e.detail.src)}
              ></video-input-overlay>
            `
          : null}
        <div id="container-vertical">
          <!-- VIDEO ELEMENT -->
          <div id="container-video" @click=${this.handleVideoClick}>
            <video id="video"></video>
            ${this.videoContext.videoLoaded ? this.renderOverlays() : null}
          </div>
          <!-- CONTROLS -->
          <div id="controls">
            <!-- Baubles // Bubbles on Progress Bar -->
            <interactions-progress-bar
              contenteditable=${this.isContentEditable}
              @interactionBaubleClicked=${(e: CustomEvent) =>
                this.baubleClicked(e.detail.id)}
              @changeAddToTrash=${() => this.changeAddToTrash()}
              @changeTrashToAdd=${() => this.changeTrashToAdd()}
              @changeInteractionTime=${(e: CustomEvent) =>
                this.changeInteractionTime(
                  e.detail.newTime,
                  e.detail.index,
                  e.detail.isReplace
                )}
            ></interactions-progress-bar>
            <!-- Progress Bar -->
            <sl-range
              id="progress-bar"
              @sl-change=${this.handleProgressChange}
            ></sl-range>

            <!-- Video Controls Bar -->
            <video-controls-bar
              contenteditable=${this.isContentEditable}
              @volumeChange=${(e: CustomEvent) =>
                this.handleVolumeChange(e.detail.value)}
              @toggleMute=${() => this.toggleMute()}
              @startstopVideo=${() => this.startStopVideo()}
              @toggleChaptersDrawer=${() => this.toggleChaptersDrawer()}
              @toggleInteractionsDrawer=${() => this.toggleInteractionsDrawer()}
              @playbackRateChange=${(e: CustomEvent) =>
                this.changePlaybackRate(e.detail.value)}
              @getCurrentChapter=${() => this.getCurrentChapter()}
            ></video-controls-bar>
          </div>
        </div>
        <!-- DRAWERS -->
        <!-- Video Chapter Drawer -->
        <video-chapter-drawer
          style="z-index: 51"
          contenteditable=${this.isContentEditable}
          @addChapter=${() =>
            this.chaptersDrawer.addChapter(this.videoElement.duration)}
          @updateContext=${() => this.updateContext()}
          @jumpToChapter=${(e: CustomEvent) =>
            this.jumpToChapter(e.detail.startTime)}
        ></video-chapter-drawer>
        <!-- Video Interaction Drawer -->
        <video-interaction-drawer
          style="z-index: 51"
          contenteditable=${this.isContentEditable}
          @updateContext=${() => this.updateContext()}
          @getCurrentTime=${() => this.getCurrentTime()}
          @updateBaublePositions=${() => this.updateBaublePositions()}
        ></video-interaction-drawer>
      </div>

      <!-- OPTIONS PANEL -->
      <interactive-video-options
        contenteditable=${this.isContentEditable}
        part="options"
        class="author-only"
        @updateContext=${() => this.updateContext()}
      ></interactive-video-options>
    `;
  }

  /**
   * Renders the overlay elements for the video.
   *
   * @returns {Array<TemplateResult>} of any overlay elements that need to be displayed at the current video time
   * @remarks
   * this checks video time to see if an overlay should be displayed and renders those from the videoData map.
   */
  renderOverlays() {
    if (!this.videoContext.showOverlay && this.isContentEditable) return;
    return Array.from(this.videoContext.videoInteractionData.entries())
      .filter(([_, data]) => !data.isReplace)
      .map(([id, data]) => {
        if (
          this.videoElement.currentTime >= data.startTime &&
          this.videoElement.currentTime <= data.endTime
        ) {
          return html`
            <div
              class="overlay-interaction"
              id="overlay-${id}"
              @mousedown="${this.startDragging}"
              @click="${this.handleOverlayClicked}"
              style="position: absolute;
                        left: ${data.position?.x || 0}px;
                        top: ${data.position?.y || 0}px;
                        width: ${data.size?.width || 100}px;
                        height: ${data.size?.height || 100}px;
                        z-index: ${this.videoContext.overlayZIndex};
                        background-color: ${data.color || "#ffffff"};
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 10px;
                        overflow: hidden;
                        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);"
            >
              <p
                style="margin: 0; color: ${this.getContrastColor(
                  data.color || "#ffffff"
                )};"
              >
                ${data.content || ""}
              </p>
              <sl-icon
                style="position: absolute;
                              bottom: 5px;
                              right: 5px;
                              color: ${this.getContrastColor(
                  data.color || "#ffffff"
                )};"
                @mousedown="${this.startResizing}"
                src=${radiusBottomRight}
              >
              </sl-icon>
            </div>
          `;
        }
        return null;
      });
  }

  /*


  */
  updateContext() {
    this.setAttribute("videoContext", JSON.stringify(this.videoContext));

    if (this.videoContext.videoInteractionDataString) {
      console.log("updateContext parse incoming");
      const config = JSON.parse(this.videoContext.videoInteractionDataString);
      //turn back into map from object after being JSON.stringified
      this.videoContext.videoInteractionData = new Map(
        Object.entries(this.videoContext.videoInteractionData).map(
          ([key, value]) => [Number(key), value]
        )
      );
      (
        this.videoContext.videoInteractionData as Map<number, videoData>
      ).clear();
      config.forEach((item) => {
        const { id, ...data } = item;
        this.videoContext.videoInteractionData.set(id, data);
      });
      //console.log("parse result", this.videoContext.videoInteractionData);
      this.requestUpdate();
    }
  }

  /*

  */
  jumpToChapter(time) {
    this.videoElement.currentTime = time;
  }

  //
  //
  //
  baubleClicked(id) {
    this.interactionDrawer.clickEventHelper(id);
  }

  //
  //
  //
  changeInteractionTime(newTime, index, isReplace) {
    console.log(newTime, index, isReplace);
    this.interactionDrawer.baubleTimeUpdateHelper(
      newTime,
      index,
      isReplace
        ? this.interactionDrawer.replaceTimestamp
        : this.interactionDrawer.overlayStartTimeInput
    );
  }

  /**
   * Retrieves the current chapter based on the current time of the video.
   * @returns The current chapter object containing the title and start time, or null if there are no chapters or the current time is before the start of any chapter.
   */
  getCurrentChapter() {
    if (!this.videoContext.hasChapters) {
      this.videoControlsBar.currentChapter = null;
      return;
    }
    const chapters = JSON.parse(this.videoContext.chapterConfig);
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (this.videoElement.currentTime >= chapters[i].startTime) {
        this.videoControlsBar.currentChapter = chapters[i];
        return;
      }
    }

    this.videoControlsBar.currentChapter = null;
    return;
  }

  /*
TODO: Make this property of parent and access it trough parent
  */
  getCurrentTime() {
    this.interactionDrawer.currentTime = this.videoElement.currentTime;
  }

  /**
   * Calculates the offset based on the given time.
   *
   * @param time - The time in seconds.
   * @returns The calculated offset.
   */
  calculateOffset(time: number): number {
    if (!this.videoContext.videoLoaded || !this.videoElement) return;
    const rect = this.videoElement.getBoundingClientRect();
    return (time / this.videoElement.duration) * 0.95 * rect.width;
  }

  /**
   * Changes the add button to a trash button.
   */
  changeAddToTrash() {
    this.videoControlsBar.addButton.setAttribute("src", `${trash}`);
    this.videoControlsBar.addButton.style.color = "hsl(0 72.2% 50.6%)";
  }

  /**
   * Changes the trash button to an add button.
   */
  changeTrashToAdd() {
    this.videoControlsBar.addButton.setAttribute("src", `${add}`);
    this.videoControlsBar.addButton.style.color = "hsl(200.4 98% 39.4%)";
  }

  /**
   * Checks whether a video is already existing on load.
   * @returns whether a video exists (either base64 or URL, used for deciding whether to show file input area or video element)
   */
  hasVideo = (): boolean => {
    if (this.videoContext.videoBase64 || this.videoContext.videoURL) {
      return true;
    }
    return false;
  };

  //
  //
  //
  toggleInteractionsDrawer() {
    if (!this.interactionDrawer.drawer.open) {
      this.interactionDrawer.drawer.open = true;
    }
    // set z-index of overlay to 0 so they don't cover the drawer.
    this.videoContext.overlayZIndex = 0;

    // clears the drawer from previous settings
    this.interactionDrawer.replaceInteractionSettings.hidden = true;
    this.interactionDrawer.overlayInteractionSettings.hidden = true;
  }

  /**
   * Toggles the chapters drawer open or closed.
   */
  toggleChaptersDrawer() {
    this.chaptersDrawer.drawer.open = !this.chaptersDrawer.drawer.open;
  }

  /**
   * Handles the change event for the volume slider and sets the video volume and button icon accordingly.
   *
   * @param e - The custom event object.
   */
  handleVolumeChange(value) {
    this.videoElement.volume = value / 100;
  }

  /**
   * Handles the click event for the mute button.
   *
   * @param e - The custom event object.
   */
  toggleMute() {
    if (this.videoElement.muted) {
      this.videoElement.muted = false;
    } else {
      this.videoElement.muted = true;
    }
  }

  //
  //
  //
  changePlaybackRate(value) {
    this.videoElement.playbackRate = value;
  }

  /**
   * Updates the positions of the baubles in the widget.
   */
  updateBaublePositions() {
    console.log("update Bauble Position");
  }

  /* MARK: deletion bug
   on most deletions, interactions change their id automatically, why is this??
   on some however, there is a gap. this gap bricks the program since it cannot match up with videodata anymore?
   planned fix is to recalculate videodata (this function already works), and subsequently recalculate interaction IDs, so they match up again.
   this should fix it regardless of wrong initial behavior
  */
  /**
   * Recalculates the indexes of the baubles and video interactions.
   */
  recalculateIndexes() {
    // this.recalculateBaubleIndexes();
    // this.recalculateInteractionIndexes();
    // this.interactionSlot
    //   .assignedElements()
    //   .forEach((element: WwVideoInteraction) => {
    //     console.log(element.id);
    //   });
  }

  /**
   * helper function for recalculateIndexes, the entire thing is somehow bugged. Read documentation of updateBaublePositions and recalculateIndexes for more information.
   * The idea was to recalculate the indexes of those video interactions affected by shifting (or rather, not shifting some times (its really weird)).
   */
  recalculateInteractionIndexes() {
    // (this.interactionSlot.assignedElements() as WwVideoInteraction[])
    //   .sort((a, b) => a.id - b.id)
    //   .forEach((element, index) => {
    //     console.log(
    //       "changing interaction with id",
    //       element.id,
    //       "to",
    //       index + 1
    //     );
    //     element.setAttribute("id", `${index + 1}`);
    //     console.log("new id is", element.id);
    //   });
  }

  /** helper function for recalculateIndexes, the entire thing is somehow bugged. This function works in its current state. Use at own risk.
   *
   */
  recalculateBaubleIndexes() {
    // console.log(this.videoContext.videoInteractionData.keys(), "is current videoData");
    // const newData = Array.from(this.videoContext.videoInteractionData.entries())
    //   .sort((a, b) => a[0] - b[0])
    //   .reduce(
    //     (map, [_, value], index) => map.set(index + 1, value),
    //     new Map<number, videoData>()
    //   );
    // console.log(newData.keys(), "is new videoData");
    // this.videoData = newData;
    // this.saveInteractionConfig();
  }

  /**
   * Handles the time update event of the video player and check whether there are interactions to be displayed by comparing current call time to last.
   * This way we dont skip any interactions and dont fire twice since this is called inconsistently.
   *
   * @param e - The custom event object.
   */
  handleTimeUpdate = (e: CustomEvent) => {
    console.log("timeUpdate");
    if (this.videoContext.showInteractions || !this.isContentEditable) {
      this.replaceInteractionHelper();
    }
    this.lastTimeupdate = this.videoElement.currentTime;
    this.progressBar.value =
      (this.videoElement.currentTime / this.videoElement.duration) * 100;

    this.videoControlsBar.handleTimeUpdate(
      this.lastTimeupdate,
      this.videoDurationFormatted
    );

    this.getCurrentChapter();

    if (this.videoElement.currentTime >= this.videoElement.duration) {
      this.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    }
  };

  /**
   * Checks whether a replace interaction should be replaced currently.
   * If the video time matches the start time of a replace interaction,
   * the active element is changed, the video is paused, and the interaction is maximized.
   */
  replaceInteractionHelper() {
    this.videoContext.videoInteractionData.forEach((value, key) => {
      if (value.isReplace) {
        if (
          this.lastTimeupdate <= value.startTime &&
          this.videoElement.currentTime >= value.startTime
        ) {
          if (this.videoContext.activeElement != key) {
            this.interactionDrawer.changeActiveElement(key);
          }
          if (!this.videoElement.paused) {
            this.videoElement.pause();
            this.videoControlsBar.playButton.setAttribute(
              "src",
              `${playerPlay}`
            );
          }
          this.interactionDrawer.maximizeInteraction();
        }
      }
    });
  }

  /**
   * Handles the progress change event and updates the video's progress bar and time stamp based on the current video time.
   *
   * @param e - The custom event object.
   */
  handleProgressChange = (e: CustomEvent) => {
    const progressBar = e.target as SlRange;
    let currentTime = (progressBar.value / 100) * this.videoElement.duration;
    this.videoElement.currentTime = Math.floor(currentTime);
    this.videoControlsBar.timeStamp.value =
      formatTime(currentTime) + " / " + this.videoDurationFormatted;
  };

  /**
   * Handles the fullscreen change event by repositioning the baubles to fit the new video size.
   */
  handleFullscreenChange = () => {
    //this.updateBaublePositions();
  };

  /**
   * Sets up the video element with the provided source and attaches event listeners to the video object.
   *
   * @param src - The source URL of the video.
   */
  setupVideo(src: string) {
    this.updateContext();

    this.videoElement.src = src;

    this.videoElement.style.width = "100%";
    this.videoElement.addEventListener(
      "loadedmetadata",
      this.handleMetadataLoaded
    );
    this.videoElement.addEventListener(
      "canplaythrough",
      this.handleCanPlayThrough
    );
    this.videoElement.addEventListener("timeupdate", this.handleTimeUpdate);
    this.videoElement.addEventListener("click", this.handleVideoClick);
  }

  /**
   * Handles the click event on the video element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  handleVideoClick = (e: MouseEvent) => {
    if (!this.videoContext.videoLoaded) return;
    e.stopPropagation();
    this.startStopVideo();
  };

  /**
   * Toggles the playback of the video. If the video has ended, it resets the current time to 0.
   * @remarks
   * Also changes the play button icon to 'pause' if the video is playing, and 'play' if the video is paused.

   */
  startStopVideo() {
    console.log("tset");
    if (!this.videoContext.videoLoaded) return;

    console.log("test");
    if (this.videoElement.ended) {
      this.videoElement.currentTime = 0;
    }
    if (this.videoElement.paused) {
      this.videoElement.play();
      this.videoControlsBar.playButton.setAttribute("src", `${playerPause}`);
    } else {
      this.videoElement.pause();
      this.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    }
  }

  /**
   * Calculates the contrast color based on the given hex color.
   * @param hexColor - The hex color value.
   * @returns Either black or White depending on contrast with the given color.
   */
  getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  /**
   * Handles the click event on the overlay element by calling the clickEventHelper function with the id of the interaction.
   *
   * @param event - The MouseEvent object representing the click event.
   */
  handleOverlayClicked = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isDragging) {
      this.isDragging = false;
      return;
    }

    // this.clickEventHelper(
    //   parseInt((event.currentTarget as HTMLElement).id.split("-")[1])
    // );
  };

  /**
   * Starts the dragging operation when the user clicks and drags the overlay element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  startDragging(e: MouseEvent) {
    if (this.interactionDrawer.drawer.open) return;
    const overlay = e.currentTarget as HTMLElement;
    const startX = e.clientX - overlay.offsetLeft;
    const startY = e.clientY - overlay.offsetTop;
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;
      let newX = e.clientX - startX;
      let newY = e.clientY - startY;
      // Constrain to video boundaries
      const videoRect = this.videoElement.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, videoRect.width - overlay.offsetWidth));
      newY = Math.max(
        0,
        Math.min(newY, videoRect.height - overlay.offsetHeight)
      );
      overlay.style.left = `${newX}px`;
      overlay.style.top = `${newY}px`;
      // Update videoData
      const id = parseInt(overlay.id.split("-")[1]);
      this.videoContext.videoInteractionData.get(id).position = {
        x: newX,
        y: newY,
      };
    };
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const config = Array.from(
        this.videoContext.videoInteractionData.entries()
      ).map(([id, data]) => ({
        id,
        ...data,
      }));

      this.videoContext.videoInteractionDataString = JSON.stringify(config);

      this.dispatchEvent(
        new CustomEvent("updateContext", {
          bubbles: true,
          composed: true,
        })
      );
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  /**
   * Handles the start of the resizing process for the interactive video overlay.
   *
   * @param e - The MouseEvent object representing the start of the resizing process.
   */
  startResizing(e: MouseEvent) {
    if (this.interactionDrawer.drawer.open) return;
    if (!(e.target as HTMLElement).matches("sl-icon")) return;
    e.stopPropagation();
    const overlay = (e.currentTarget as HTMLElement)
      .parentElement as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = overlay.offsetWidth;
    const startHeight = overlay.offsetHeight;
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;
      let newWidth = startWidth + e.clientX - startX;
      let newHeight = startHeight + e.clientY - startY;
      // Constrain to video boundaries
      const videoRect = this.videoElement.getBoundingClientRect();
      newWidth = Math.min(newWidth, videoRect.width - overlay.offsetLeft);
      newHeight = Math.min(newHeight, videoRect.height - overlay.offsetTop);
      overlay.style.width = `${newWidth}px`;
      overlay.style.height = `${newHeight}px`;
      // Update videoData
      const id = parseInt(overlay.id.split("-")[1]);
      this.videoContext.videoInteractionData.get(id).size = {
        width: newWidth,
        height: newHeight,
      };
    };
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const config = Array.from(
        this.videoContext.videoInteractionData.entries()
      ).map(([id, data]) => ({
        id,
        ...data,
      }));

      this.videoContext.videoInteractionDataString = JSON.stringify(config);

      this.dispatchEvent(
        new CustomEvent("updateContext", {
          bubbles: true,
          composed: true,
        })
      );
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  /**
   * Handles the 'canplaythrough' event of the video element.
   *
   * This function is called when the video can be played through without interruption.
   * @remarks
   * It performs various actions such as enabling/disabling the addButton, setting the progressBar value to 0,
   * setting the video volume to 0.1, setting the volumeSlider value to 10, and initializing the chapterConfig
   * if it is empty.
   * The Timeout was necessary to ensure that the elements are rendered before the actions are performed.
   */
  handleCanPlayThrough = () => {
    if (this.videoContext.videoLoaded) return;
    this.videoContext.videoLoaded = true;
    this.updateContext();
    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.value = 0;
      }
      if (this.videoElement) {
        this.videoElement.volume = 0.1;
      }
      if (this.videoControlsBar.volumeSlider) {
        this.videoControlsBar.volumeSlider.value = 10;
      }

      this.updateContext();
      this.requestUpdate();
    }, 0);
  };

  /**
   * Handles the loaded metadata event of the video element.
   * @remarks
   * This function is called when the metadata of the video is loaded to set up things we dont have to wait for the video to load fully for.
   */
  handleMetadataLoaded = () => {
    this.videoDurationFormatted = formatTime(this.videoElement.duration);

    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.max = 100;
        this.progressBar.tooltipFormatter = (value: number) => {
          return formatTime(
            Math.floor((value / 100) * this.videoElement.duration)
          );
        };
      }

      if (this.videoControlsBar.timeStamp) {
        this.videoControlsBar.timeStamp.innerHTML = `00:00 / ${this.videoDurationFormatted}`;
      }

      this.requestUpdate();
    }, 0);
  };
}
