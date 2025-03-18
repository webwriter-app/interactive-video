import { html, _$LE } from "lit";
import { LitElementWw } from "@webwriter/lit";

import { property, query, queryAssignedElements } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { SlButton, SlRange, SlIcon } from "@shoelace-style/shoelace";

import styles from "./webwriter-interactive-video.styles";

//Tabler
import playerPlay from "@tabler/icons/filled/player-play.svg";
import playerPause from "@tabler/icons/filled/player-pause.svg";

import { provide } from "@lit/context";
import {
  InteractiveVideoContext,
  videoContext,
} from "../../utils/interactive-video-context";

import { InteractiveVideoOptions } from "../../components/options-panel/interactive-video-options";
import { VideoInputOverlay } from "../../components/video-input-overlay/video-input-overlay";
import { VideoControlsBar } from "../../components/video-controls-bar/video-controls-bar";
import { VideoChapterDrawer } from "../../components/video-chapter-drawer/video-chapter-drawer";
import { InteractionsProgressBar } from "../../components/interactions-progress-bar/interactions-progress-bar";
import { WwVideoInteraction } from "../webwriter-video-interaction/webwriter-video-interaction.component";

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
      "interactive-video-options": InteractiveVideoOptions,
      "video-input-overlay": VideoInputOverlay,
      "video-controls-bar": VideoControlsBar,
      "video-chapter-drawer": VideoChapterDrawer,
      "interactions-progress-bar": InteractionsProgressBar,
      "webwriter-video-interaction": WwVideoInteraction,
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

  @queryAssignedElements({
    flatten: true,
    selector: "webwriter-video-interaction",
  })
  accessor videoInteractions;

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

  @query("interactions-progress-bar")
  accessor interactionsProgressBar: InteractionsProgressBar;

  @query("#progress-bar")
  accessor progressBar;

  @query("video-chapter-drawer")
  accessor chaptersDrawer: VideoChapterDrawer;

  private observer: MutationObserver | null = null;

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

    this.observer = new MutationObserver(this.monitorSlot);
    this.observer.observe(this, { childList: true });
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
    this.updateBaublePositions();
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
          <div
            id="container-video"
            @interactionClicked=${(e: CustomEvent) => {
              this.interactionClicked(e.detail.id);
            }}
            @click=${this.handleVideoClick}
            @updateContext=${() => this.updateContext()}
          >
            <video id="video"></video>
            ${this.videoContext.videoLoaded ? this.showPopups() : null}
            <slot></slot>
          </div>
          <!-- CONTROLS -->
          <div id="controls">
            <!-- Baubles // Bubbles on Progress Bar -->
            <interactions-progress-bar
              style="outline: none"
              contenteditable=${this.isContentEditable}
              @addInteraction=${() =>
                this.addVideoInteraction(this.videoInteractions.length)}
              @interactionBaubleClicked=${(e: CustomEvent) =>
                this.baubleClicked(e.detail.id)}
              @changeInteractionStartTime=${(e: CustomEvent) =>
                this.changeInteractionStartTime(
                  e.detail.newTime,
                  e.detail.index
                )}
              @jumpToChapter=${(e: CustomEvent) =>
                this.jumpToChapter(e.detail.startTime)}
            ></interactions-progress-bar>
            <!-- Progress Bar -->
            <sl-range
              id="progress-bar"
              @sl-change=${this.handleProgressChange}
            ></sl-range>

            <!-- Video Controls Bar -->
            <video-controls-bar
              style="outline: none"
              contenteditable=${this.isContentEditable}
              @volumeChange=${(e: CustomEvent) =>
                this.handleVolumeChange(e.detail.value)}
              @toggleMute=${() => this.toggleMute()}
              @startstopVideo=${() => this.togglePlayVideo()}
              @toggleChaptersDrawer=${() => this.toggleChaptersDrawer()}
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
      </div>

      <!-- OPTIONS PANEL -->
      <interactive-video-options
        contenteditable=${this.isContentEditable}
        style="outline: none"
        part="options"
        class="author-only"
        @updateContext=${() => this.updateContext()}
        @updateBaublePositions=${() => this.updateBaublePositions()}
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
  showPopups() {
    if (!this.videoContext.showOverlay && this.isContentEditable) return;

    Array.from(this.videoInteractions).map((interaction) => {
      if (
        this.videoElement.currentTime >=
          (interaction as WwVideoInteraction).startTime &&
        this.videoElement.currentTime <=
          (interaction as WwVideoInteraction).endTime
      ) {
        (interaction as HTMLElement).style.display = "block";

        if ((interaction as WwVideoInteraction).initialPause === "false") {
          this.pauseVideo();
          (interaction as WwVideoInteraction).initialPause = "true";
          (interaction as HTMLElement).setAttribute("initialPause", "true");
        }
      } else {
        (interaction as HTMLElement).style.display = "none";
        if ((interaction as WwVideoInteraction).initialPause) {
          (interaction as WwVideoInteraction).initialPause = "false";
          (interaction as HTMLElement).setAttribute("initialPause", "false");
        }
      }
    });
  }

  /*


  */
  updateContext() {
    this.setAttribute("videoContext", JSON.stringify(this.videoContext));
    this.requestUpdate();
  }

  /*

  */
  jumpToChapter(time) {
    this.videoElement.currentTime = time;
  }

  //
  //
  //
  interactionClicked(id) {
    this.videoContext.selectedInteractionID = id;
    const interaction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(id)
    )[0] as WwVideoInteraction;
    interaction.focus();
    this.updateContext();
  }

  //
  //
  //
  baubleClicked(id) {
    this.pauseVideo();

    const slottedInteraction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(id)
    )[0] as WwVideoInteraction;

    this.videoElement.currentTime = slottedInteraction.startTime;

    this.requestUpdate();

    this.interactionClicked(id);
  }

  //
  //
  //
  changeInteractionStartTime(newTime, index) {
    const slottedInteraction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(index)
    )[0] as WwVideoInteraction;

    slottedInteraction.startTime = newTime;
    slottedInteraction.setAttribute("starTime", newTime);

    slottedInteraction.endTime = newTime + 5;
    slottedInteraction.setAttribute("endTime", String(newTime + 5));

    this.videoElement.currentTime = slottedInteraction.startTime;

    this.updateContext();
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
  addVideoInteraction(id) {
    // Case: User selected "Replace Interaction" from the dropdown
    // create interaction and set videodata

    const interaction = document.createElement(
      "webwriter-video-interaction"
    ) as WwVideoInteraction;

    const videoRect = this.videoElement.getBoundingClientRect();
    const interactionWidth = 300; // Adjust based on actual element size
    const interactionHeight = 200; // Adjust based on actual element size

    interaction.style.position = "absolute";
    interaction.style.top = `${videoRect.height / 2 - interactionHeight / 2}px`;
    interaction.style.left = `${videoRect.width / 2 - interactionWidth / 2}px`;
    interaction.style.width = `${interactionWidth}px`;
    interaction.style.height = `${interactionHeight}px`;

    this.appendChild(interaction);
    interaction.setAttribute("id", `${id}`);
    interaction.setAttribute("startTime", `${this.videoElement.currentTime}`);
    interaction.setAttribute("endTime", `${this.videoElement.currentTime + 5}`);
    interaction.setAttribute("color", `#ffffff`);

    //to force re-rendering such that bauble is displayed
    this.updateContext();
  }

  /**
   * Handles the click event on the video element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  handleVideoClick = (e: MouseEvent) => {
    const clickedElement = e.target as HTMLElement;

    // Check if the clicked element is inside the slot or is an interaction element
    if (clickedElement.closest("webwriter-video-interaction")) {
      // Prevent further action if it's a specific interaction element
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    if (!this.videoContext.videoLoaded) return;
    e.stopPropagation();
    this.videoContext.selectedInteractionID = -1;
    this.updateContext();
  };

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
    this.interactionsProgressBar.updateBaublePositions();
    this.updateContext();
  }

  /**
   * Handles the time update event of the video player and check whether there are interactions to be displayed by comparing current call time to last.
   * This way we dont skip any interactions and dont fire twice since this is called inconsistently.
   *
   * @param e - The custom event object.
   */
  handleTimeUpdate = (e: CustomEvent) => {
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
   * Handles the progress change event and updates the video's progress bar and time stamp based on the current video time.
   *
   * @param e - The custom event object.
   */
  handleProgressChange = (e: CustomEvent) => {
    this.showPopups();
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
  }

  /**
   * Toggles the playback of the video. If the video has ended, it resets the current time to 0.
   * @remarks
   * Also changes the play button icon to 'pause' if the video is playing, and 'play' if the video is paused.

   */
  togglePlayVideo() {
    if (!this.videoContext.videoLoaded) return;

    if (this.videoElement.ended) {
      this.videoElement.currentTime = 0;
    }
    if (this.videoElement.paused) {
      this.playVideo();
    } else {
      this.pauseVideo();
    }
  }

  //
  //
  //
  playVideo() {
    this.videoElement.play();
    this.videoControlsBar.playButton.setAttribute("src", `${playerPause}`);

    // Add the scaling animation class to the button
    this.videoControlsBar.playButton.classList.add("scale-animation");

    // Remove the animation class after it's done
    setTimeout(() => {
      this.videoControlsBar.playButton.classList.remove("scale-animation");
    }, 300); // Adjust timing to match animation duration
  }

  //
  //
  //
  pauseVideo() {
    this.videoElement.pause();
    this.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);

    // Add the scaling animation class to the button
    this.videoControlsBar.playButton.classList.add("scale-animation");

    // Remove the animation class after it's done
    setTimeout(() => {
      this.videoControlsBar.playButton.classList.remove("scale-animation");
    }, 300); // Adjust timing to match animation duration
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

  /*

  */
  private monitorSlot = (mutationList: MutationRecord[]) => {
    mutationList.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.removedNodes.forEach((node) => {
          const nodeName = (node as HTMLElement).nodeName.toLowerCase();
          const isWidget = (node as HTMLElement).classList.contains(
            "ww-widget"
          );
          // "ProseMirror-selectednode" css class confirms that the element is actively selected by the user
          const isSelectedNode = (node as HTMLElement).classList.contains(
            "ProseMirror-selectednode"
          );

          if (isWidget && isSelectedNode) {
            if (nodeName === "webwriter-video-interaction") {
              this.updateContext();
              this.requestUpdate();
            }
          }
        });
      }
    });
  };
}
