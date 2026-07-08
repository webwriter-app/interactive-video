import { html, PropertyValues } from "lit";
import { LitElementWw } from "@webwriter/lit";

import { customElement, property, query, queryAssignedElements, state } from "lit/decorators.js";

// @ts-ignore
import LOCALIZE from "../../localization/generated";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { SlButton, SlRange, SlIcon, SlDialog, SlCheckbox } from "@shoelace-style/shoelace";

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
import { WwVideoInteraction } from "../webwriter-video-interaction/webwriter-video-interaction";
import { PlayerType, VideoPlayer } from "../../components/video-player/video-player";

import { formatTime } from "../../utils/timeFormatter";
import { msg } from "@lit/localize";


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
  protected static get scopedElements() {
    return {
      "sl-range": SlRange,
      "sl-icon": SlIcon,
      "sl-dialog": SlDialog,
      "sl-button": SlButton,
      "sl-checkbox": SlCheckbox,
      "interactive-video-options": InteractiveVideoOptions,
      "video-input-overlay": VideoInputOverlay,
      "video-controls-bar": VideoControlsBar,
      "video-chapter-drawer": VideoChapterDrawer,
      "interactions-progress-bar": InteractionsProgressBar,
      "webwriter-video-interaction": WwVideoInteraction,
      "video-player": VideoPlayer,
    };
  }

  /**
   * The styles for the webwriter-interactive-video component.
   */
  static styles = [styles];

  protected localize = LOCALIZE;

  /** The context for the interactive video component, containing all widget data in a JSON object. */
  @provide({
    context: videoContext,
  })
  @state()
  private accessor videoContext: InteractiveVideoContext;

  private get _composedContext(): InteractiveVideoContext {
    const context = new InteractiveVideoContext();

    context.showOverlay = !this.hideInteractions;
    context.hasChapters = !this.hideChapters;
    context.allowPlaybackRateChange = !this.disablePlaybackRateChange;
    context.videoBase64 = this.videoBase64;
    context.videoURL = this.videoURL;
    context.videoLoaded = this.videoLoaded;
    context.videoType = this.videoType;
    context.videoDetails = this.videoDetails;
    context.waveformData = this.waveformData;
    context.chapterConfig = this.chapterConfig;
    context.selectedInteractionID = this.selectedInteractionId;

    return context;
  }

  /** CONTEXT: Teacher Options */

  /** Whether interactions should be shown */
  @property({ type: Boolean, attribute: "hide-interactions", reflect: true })
  accessor hideInteractions: boolean = false;

  /** Whether the video has chapters and they should be shown */
  @property({ type: Boolean, attribute: "hide-chapters", reflect: true })
  accessor hideChapters: boolean = false;

  /** Whether the user is allowed to change the playback rate */
  @property({ type: Boolean, attribute: "disable-playback-rate-change", reflect: true })
  accessor disablePlaybackRateChange: boolean = false;

  /** CONTEXT: Video Properties */

  /** Video file as a base64 string for offline storage. */
  @property({ type: String, attribute: "video-base64", reflect: true })
  accessor videoBase64: string = "";

  /** Video URL for online playback. */
  @property({ type: String, attribute: "video-url", reflect: true })
  accessor videoURL: string = "";

  /** Indicates whether the video is currently loaded. */
  @property({ type: Boolean })
  accessor videoLoaded: boolean = false;

  /** Type of the video source. */
  @property({ type: String, attribute: "video-type", reflect: true })
  accessor videoType: string = "placeholder"; // "youtube", "vimeo", "spotify", "tiktok", "htmlvideo", "htmlaudio", "placeholder"

  /** Details of the video, such as title, author, and duration. */
  @property({ type: Object, attribute: "video-details", reflect: true })
  accessor videoDetails: { title: string; author: string; duration: number } = {
    title: "",
    author: "",
    duration: 0,
  };

  /** Waveform data for audio visualization generated by WaveSurfer.js. */
  @property({ type: Array, attribute: "waveform-data", reflect: true })
  accessor waveformData: number[][] = null;

  /** CONTEXT: Chapter Properties */

  /** Contains the current chapter configuration as an object. */
  @property({ type: Array, attribute: "chapter-config", reflect: true })
  accessor chapterConfig: { title: string, startTime: number }[] = [];

  /** CONTEXT: Interaction Properties */

  /** Contains the ID of the selected interaction. */
  @property({ type: Number })
  accessor selectedInteractionId: number = -1;

  /** The list of video interaction elements slotted into the component. */
  @queryAssignedElements({
    flatten: true,
    selector: "webwriter-video-interaction",
  })
  accessor videoInteractions;

  /** The tab index of the component. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  @property({ type: String })
  private accessor videoDurationFormatted: string = "00:00";

  @property({ type: Number })
  private accessor lastTimeUpdate: number = 0;

  @property({ type: Boolean })
  private accessor isDragging = false;

  @property({ type: Boolean })
  private accessor isFullscreen = false;

  @property({ type: Boolean })
  private accessor controlsVisible = true;

  @property({ type: Boolean })
  private accessor areControlsHovered = false;

  @property({ type: Number })
  private accessor playbackRate = 1;

  @property({ type: Boolean })
  private accessor volumeControlsVisible = true;

  @property({ type: Boolean })
  private accessor playbackRateControlsVisible = true;

  @property({ type: Boolean })
  private accessor isProgressBarFocused = false;

  @property({ type: Boolean })
  private accessor hadLoadingError = false;

  @property({ type: Number })
  private accessor videoContainerHeight: number = 0;

  @property({ type: Number })
  private accessor videoContainerWidth: number = 0;

  /** The video player element */
  @query("#video")
  accessor videoPlayer: VideoPlayer;

  @query("#container-video-area")
  private accessor videoAreaContainer: HTMLElement;

  @query("#controls")
  private accessor controlsElement: HTMLElement;

  @query("video-controls-bar")
  private accessor videoControlsBar: VideoControlsBar;

  @query("interactions-progress-bar")
  private accessor interactionsProgressBar: InteractionsProgressBar;

  @query("#progress-bar")
  private accessor progressBar: SlRange;

  @query("video-chapter-drawer")
  private accessor chaptersDrawer: VideoChapterDrawer;

  @query("#remove-video-dialog")
  private accessor removeVideoDialog: SlDialog;

  @query("#remove-interactions-checkbox")
  private accessor removeInteractionsCheckbox: SlCheckbox;

  private observer: MutationObserver | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private controlsTimeout: number | null = null;

  /**
   * Called when the element is first connected to the document's DOM.
   * @remarks
   * Adds event listeners for fullscreen changes.
   * Also builds the interaction configuration and renders the chapters list, if available.
   */
  connectedCallback() {
    super.connectedCallback();
    this.videoLoaded = false;
    this.updateContext();
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);

    this.observer = new MutationObserver(this.monitorSlot);
    this.observer.observe(this, {
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    this.addEventListener("closeChaptersDrawer", this.closeChaptersDrawer);
    this.addEventListener("showRemoveVideoDialog", this.showRemoveVideoDialog);
    this.addEventListener("setShowOverlay", this.setShowOverlay);
    this.addEventListener("setHasChapters", this.setHasChapters);
    this.addEventListener("setAllowPlaybackRateChange", this.setAllowPlaybackRateChange);
    this.addEventListener("setChapterConfig", this.setChapterConfig);
  }

  /**
   * Called when the element is disconnected from the document's DOM.
   * @remarks
   * Removs event listeners for fullscreen changes.
   * Also disconnects the mutation observer.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.removeEventListener("closeChaptersDrawer", this.closeChaptersDrawer);
    this.removeEventListener("showRemoveVideoDialog", this.showRemoveVideoDialog);
    this.removeEventListener("setShowOverlay", this.setShowOverlay);
    this.removeEventListener("setHasChapters", this.setHasChapters);
    this.removeEventListener("setAllowPlaybackRateChange", this.setAllowPlaybackRateChange);
    this.removeEventListener("setChapterConfig", this.setChapterConfig);
  }

  /*
   * Sets up some default values for the overlay
   */
  firstUpdated() {
    this.updateContext();

    if (this.videoBase64) {
      this.setupVideoBase64(this.videoBase64);
    } else if (this.videoURL) {
      this.setupVideoURL(this.videoURL);
    }
    this.updateBaublePositions();

    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const rect = entry.contentRect;
        this.videoContainerWidth = rect.width;
        this.videoContainerHeight = rect.height;

        Array.from(this.videoInteractions).map((interaction) => {
          (interaction as WwVideoInteraction).parentWidth = this.calculateVideoAreaSize().width;
          (interaction as WwVideoInteraction).parentHeight = this.calculateVideoAreaSize().height;
        (interaction as WwVideoInteraction).videoBaseWidth = this.calculateVideoBaseSize().width;
        (interaction as WwVideoInteraction).videoBaseHeight = this.calculateVideoBaseSize().height;
        });
      }
    });

    if (this.videoAreaContainer) {
      this.resizeObserver.observe(this.videoAreaContainer);

      Array.from(this.videoInteractions).map((interaction) => {
        (interaction as WwVideoInteraction).parentWidth = this.calculateVideoAreaSize().width;
        (interaction as WwVideoInteraction).parentHeight = this.calculateVideoAreaSize().height;
        (interaction as WwVideoInteraction).videoBaseWidth = this.calculateVideoBaseSize().width;
        (interaction as WwVideoInteraction).videoBaseHeight = this.calculateVideoBaseSize().height;
      });
    }
  }

  /**
   * Used to regenerate the videoContext attribute when properties change.
   * @param _changedProperties - The properties that have changed since the last update.
   */
  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.size > 0) {
      this.videoContext = this._composedContext;
      this.updateContext();
    }
  }

  /**
   * Renders the component.
   *
   * @returns either HTML for either the widget or the file input area, depending on whether a video has already been selected.
   */
  render() {
    return html`
      <div id="widget" class="${this.isFullscreen ? "fullscreen" : null} ${!this.controlsVisible ? "controls-hidden" : null}">
        <!-- VIDEO INPUT -->
        ${!this.hasVideo()
          ? html`
              <video-input-overlay
                @setupVideoBase64=${(e: CustomEvent) => this.setupVideoBase64(e.detail.src)}
                @setupVideoURL=${(e: CustomEvent) => this.setupVideoURL(e.detail.src)}
                .error=${this.hadLoadingError}
              ></video-input-overlay>
            `
          : null}
        <div id="container-vertical">
          <!-- VIDEO ELEMENT -->
          <div
            id="container-video-area"
            @click=${() => {
              if (!this.videoLoaded) return;
              this.togglePlayVideo();
            }}
          >
            <div
              id="container-video"
              @interactionClicked=${(e: CustomEvent) => {
                this.interactionClicked(e.detail.id);
              }}
              @click=${this.handleVideoClick}
              @updateContext=${() => this.updateContext()}
              style=${`width: ${this.calculateVideoAreaSize().width}px; height: ${this.calculateVideoAreaSize().height}px;`}
            >
              <video-player 
                id="video"
                .isFullscreen=${this.isFullscreen}
                @play=${() => this.handleVideoPlay()}
                @pause=${() => this.handleVideoPause()}
                @durationchange=${() => this.handleDurationChange()}
                @canplay=${() => this.handleCanPlay()}
                @timeupdate=${() => this.handleTimeUpdate()}
                @loadingerror=${(e: CustomEvent) => this.handleLoadingError(e.detail.error)}
                @setvolumecontrolsvisible=${(e: CustomEvent) => { this.volumeControlsVisible = e.detail.visible; }}
                @setplaybackratecontrolsvisible=${(e: CustomEvent) => { this.playbackRateControlsVisible = e.detail.visible; }}
                @setvideodetails=${(e: CustomEvent) => { this.videoDetails = { ...this.videoDetails, ...e.detail } }}
                @setvideotype=${(e: CustomEvent) => { this.videoType = e.detail.type; }}
                @setwaveformdata=${(e: CustomEvent) => { this.waveformData = e.detail.data; }}
              ></video-player>
              ${this.videoLoaded ? this.showPopups() : null}
              <slot></slot>
            </div>
          </div>
          <!-- CONTROLS -->
          <div id="controls" class=${!this.controlsVisible ? "hide" : null}>
            <!-- Baubles // Bubbles on Progress Bar -->
            <interactions-progress-bar
              style="outline: none"
              contenteditable=${this.isContentEditable}
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
              step="0.001"
              @sl-change=${this.handleProgressChange}
              @mousedown=${() => (this.isProgressBarFocused = true)}
              @mouseup=${() => (this.isProgressBarFocused = false)}
            ></sl-range>

            <!-- Video Controls Bar -->
            <video-controls-bar
              style="outline: none"
              contenteditable=${this.isContentEditable}
              .playbackRate=${this.playbackRate}
              .volumeHidden=${!this.volumeControlsVisible}
              .playbackRateHidden=${!this.playbackRateControlsVisible}
              @volumeChange=${(e: CustomEvent) =>
                this.handleVolumeChange(e.detail.value)}
              @toggleMute=${() => this.toggleMute()}
              @startstopVideo=${() => this.togglePlayVideo()}
              @toggleChaptersDrawer=${() => this.toggleChaptersDrawer()}
              @playbackRateChange=${(e: CustomEvent) =>
                this.changePlaybackRate(e.detail.value)}
              @getCurrentChapter=${() => this.getCurrentChapter()}
              @toggleFullscreen=${() => this.toggleFullscreen()}
              @addInteraction=${() => {
                if (this.videoInteractions.length === 0) {
                    this.addVideoInteraction(0);
                    return;
                }
                this.addVideoInteraction(
                  Math.max(...Array.from(this.videoInteractions).map(interaction => (interaction as WwVideoInteraction).id)) + 1
                )}
              }
              @skipTime=${(e: CustomEvent) => {
                this.handleTimeSkip(e.detail.amount);
              }}
            ></video-controls-bar>
          </div>
          <!-- CONFIRM INTERACTION DELETE DIALOG -->
          <div id="confirm-delete-dialog">
            <sl-dialog label=${msg("Remove media?")} id="remove-video-dialog">
              <p>${this.isAudio() ? msg("Are you sure you want to remove the current audio?") : msg("Are you sure you want to remove the current video?")}</p>
              <sl-checkbox id="remove-interactions-checkbox">${msg("Also remove all interactions and chapters")}</sl-checkbox>
              <sl-button slot="footer" variant="primary" @click=${() => {
                this.clearVideo(this.removeInteractionsCheckbox.checked);
                this.removeVideoDialog.hide();
              }}>${msg("Yes, remove it")}</sl-button>
              <sl-button slot="footer" variant="text" @click=${() => {
                this.removeVideoDialog.hide();
              }}>${msg("No, keep it")}</sl-button>
            </sl-dialog>
          </div>
        </div>
        <!-- DRAWERS -->
        <!-- Video Chapter Drawer -->
        <video-chapter-drawer
          style="z-index: 51"
          contenteditable=${this.isContentEditable}
          @addChapter=${() =>
            this.chaptersDrawer.addChapter(this.videoPlayer.duration)}
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
        @playbackRateChange=${(e: CustomEvent) =>
                this.changePlaybackRate(e.detail.value)}
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
    if (this.hideInteractions) return;

    Array.from(this.videoInteractions).map((interaction) => {
      if (
        this.videoPlayer.currentTime >=
          (interaction as WwVideoInteraction).startTime &&
        this.videoPlayer.currentTime <=
          (interaction as WwVideoInteraction).endTime
      ) {
        (interaction as HTMLElement).style.display = "block";

        if (!(interaction as WwVideoInteraction).noInitialPause && !(interaction as WwVideoInteraction).hasPaused) {
          this.pauseVideo();
          (interaction as WwVideoInteraction).hasPaused = true;
        }
      } else {
        (interaction as HTMLElement).style.display = "none";
        (interaction as WwVideoInteraction).hasPaused = false;
      }
    });
  }

  /**
   * Updates the videoContext attribute and requests an update.
   * @remarks
   * This is necessary to keep the context in sync with the component's properties.
   */
  updateContext() {
    this.requestUpdate();
  }

  private isAudio() {
    return ["spotify", "htmlaudio"].includes(this.videoType);
  }

  /**
   * Calculates the size of the video area based on the aspect ratio and container dimensions.
   * @returns An object containing the width and height of the video area.
   */
  private calculateVideoAreaSize() {
    let aspectRatio: number;
    if (!this.videoPlayer || !this.videoPlayer.videoElement || !this.videoLoaded)
      aspectRatio = 16 / 9;
    else
      aspectRatio = this.videoPlayer.aspectRatio;

    if (this.isFullscreen) {
      if (this.videoContainerHeight * aspectRatio > this.videoContainerWidth) {
        // Width is the limiting factor
        return { width: this.videoContainerWidth, height: this.videoContainerWidth / aspectRatio };
      } else {
        // Height is the limiting factor
        return { width: this.videoContainerHeight * aspectRatio, height: this.videoContainerHeight };
      }
    }

    if (aspectRatio > 1) {
      return { width: this.videoContainerWidth, height: this.videoContainerWidth / aspectRatio };
    } else {
      return { width: this.videoContainerWidth * aspectRatio, height: this.videoContainerWidth };
    }
  }

  private calculateVideoBaseSize() {
    let aspectRatio: number;
    if (!this.videoPlayer || !this.videoPlayer.videoElement || !this.videoLoaded)
      aspectRatio = 16 / 9;
    else
      aspectRatio = this.videoPlayer.aspectRatio;

    const baseWidth = 800;
    if (aspectRatio > 1) {
      return { width: baseWidth, height: baseWidth / aspectRatio };
    } else {
      return { width: baseWidth * this.videoPlayer.aspectRatio, height: baseWidth };
    }
  }

  /**
   * Jumps to a specific time stamp in the video.
   * @param time - The time in seconds to jump to.
   */
  private jumpToChapter(time) {
    this.videoPlayer.currentTime = time;
  }

  /**
   * Handles the click event on an interaction element.
   * @param id - the ID of the interaction that was clicked
   */
  private interactionClicked(id) {
    this.selectedInteractionId = id;
    const interaction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(id)
    )[0] as WwVideoInteraction;
    // interaction.focus();
    this.updateContext();
  }

  /**
   * Handles the click event on a bauble in the progress bar.
   * @param id - the ID of the interaction associated with the clicked bauble
   */
  private baubleClicked(id) {
    this.pauseVideo();

    const slottedInteraction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(id)
    )[0] as WwVideoInteraction;

    this.videoPlayer.currentTime = slottedInteraction.startTime;

    this.requestUpdate();

    this.interactionClicked(id);
  }

  /**
   * Changes the start time of an interaction and updates its end time to be 5 seconds later.
   * @param newTime - new start time for the interaction
   * @param index - the ID of the interaction to update
   */
  private changeInteractionStartTime(newTime, index) {
    const slottedInteraction = this.videoInteractions.filter(
      (interaction) => Number(interaction.id) === Number(index)
    )[0] as WwVideoInteraction;

    let duration = slottedInteraction.endTime - slottedInteraction.startTime;
    if (newTime + duration > this.videoPlayer.duration) {
      duration = this.videoPlayer.duration - newTime;
    }

    slottedInteraction.startTime = newTime;
    slottedInteraction.setAttribute("startTime", newTime);

    slottedInteraction.endTime = newTime + duration;
    slottedInteraction.setAttribute("endTime", String(newTime + duration));

    this.videoPlayer.currentTime = slottedInteraction.startTime;

    this.updateContext();
  }

  /**
   * Retrieves the current chapter based on the current time of the video.
   * @returns The current chapter object containing the title and start time, or null if there are no chapters or the current time is before the start of any chapter.
   */
  private getCurrentChapter() {
    if (this.hideChapters) {
      this.videoControlsBar.currentChapter = null;
      return;
    }
    const chapters = this.chapterConfig;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (this.videoPlayer.currentTime >= chapters[i].startTime) {
        this.videoControlsBar.currentChapter = chapters[i];
        return;
      }
    }

    this.videoControlsBar.currentChapter = null;
    return;
  }

  /**
   * Checks whether a video is already existing on load.
   * @returns whether a video exists (either base64 or URL, used for deciding whether to show file input area or video element)
   */
  private hasVideo = (): boolean => {
    if (this.videoBase64 || this.videoURL) {
      return true;
    }
    return false;
  };

  /**
   * Adds a new video interaction element to the video at the current time.
   * @param id - the ID to assign to the new interaction
   */
  private async addVideoInteraction(id) {
    // Case: User selected "Replace Interaction" from the dropdown
    // create interaction and set videodata

    const interaction = document.createElement(
      "webwriter-video-interaction"
    ) as WwVideoInteraction;

    const videoAreaSize = this.calculateVideoAreaSize();
    const videoBaseSize = this.calculateVideoBaseSize();

    interaction.setAttribute("parentWidth", `${videoAreaSize.width}`);
    interaction.setAttribute("parentHeight", `${videoAreaSize.height}`);
    interaction.setAttribute("videoBaseWidth", `${videoBaseSize.width}`);
    interaction.setAttribute("videoBaseHeight", `${videoBaseSize.height}`);

    interaction.setAttribute("posY", "25");
    interaction.setAttribute("posX", "25");
    interaction.setAttribute("width", `${videoAreaSize.width / 2}`);
    interaction.setAttribute("height", `${videoAreaSize.height / 2}`);

    interaction.setAttribute("id", `${id}`);
    interaction.setAttribute("startTime", `${this.videoPlayer.currentTime}`);
    interaction.setAttribute("endTime", `${this.videoPlayer.currentTime + 5}`);

    this.appendChild(interaction);

    //to force re-rendering such that bauble is displayed
    this.updateContext();
  }

  /**
   * Handles the click event on the video element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  private handleVideoClick = (e: MouseEvent) => {
    const clickedElement = e.target as HTMLElement;

    // Check if the clicked element is inside the slot or is an interaction element
    if (clickedElement.closest("webwriter-video-interaction")) {
      // Prevent further action if it's a specific interaction element
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    
    // e.stopPropagation();
    this.selectedInteractionId = -1;
    this.updateContext();
  };

  /**
   * Toggles the chapters drawer open or closed.
   */
  private toggleChaptersDrawer() {
    if (this.hideChapters) return;
    this.chaptersDrawer.drawer.open = !this.chaptersDrawer.drawer.open;
  }

  /**
   * Handles the change event for the volume slider and sets the video volume accordingly.
   *
   * @param e - The custom event object.
   */
  private handleVolumeChange(value) {
    this.videoPlayer.volume = value / 100;
  }

  /**
   * Handles the click event for the mute button.
   *
   * @param e - The custom event object.
   */
  private toggleMute() {
    if (this.videoPlayer.muted) {
      this.videoPlayer.muted = false;
    } else {
      this.videoPlayer.muted = true;
    }
  }

  /**
   * Sets the video playback rate (speed) to the specified value.
   * @param value - The new playback rate value.
   */
  private changePlaybackRate(value) {
    value = Number.parseFloat(value);
    this.videoPlayer.playbackRate = value;
    this.playbackRate = value;
  }

  /**
   * Updates the positions of the baubles in the widget.
   */
  updateBaublePositions() {
    this.interactionsProgressBar.updateBaublePositions();
    this.updateContext();
  }

  /**
   * Hides all interactions on the video and resets their hasPaused attribute.
   */
  private hideAllInteractions() {
    Array.from(this.videoInteractions).map((interaction) => {
      (interaction as HTMLElement).style.display = "none";
      (interaction as WwVideoInteraction).hasPaused = false;
    });
  }

  /**
   * Closes the chapters drawer.
   */
  private closeChaptersDrawer() {
    this.chaptersDrawer.close();
  }

  /**
   * Handles the time update event of the video player and check whether there are interactions to be displayed by comparing current call time to last.
   * This way we dont skip any interactions and dont fire twice since this is called inconsistently.
   *
   * @param e - The custom event object.
   */
  private handleTimeUpdate = () => {
    if (this.isProgressBarFocused) return;
    
    this.lastTimeUpdate = this.videoPlayer.currentTime;
    this.progressBar.value = this.videoPlayer.currentTime;

    this.videoControlsBar.handleTimeUpdate(this.lastTimeUpdate);

    this.getCurrentChapter();

    if (this.videoPlayer.currentTime >= this.videoPlayer.duration) {
      this.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    }
  };

  /**
   * Handles time skips through keyboard shortcuts
   * 
   * @param amount - The amount of time to skip (in seconds). Positive values skip forward, negative values skip backward.
   */
  private handleTimeSkip(amount: number) {
    let newTime = this.videoPlayer.currentTime + amount;
    if (newTime < 0) newTime = 0;
    if (newTime > this.videoPlayer.duration) newTime = this.videoPlayer.duration;
    this.videoPlayer.currentTime = newTime;
  }

  /**
   * Handles the progress change event and updates the video's progress bar and time stamp based on the current video time.
   *
   * @param e - The custom event object.
   */
  private handleProgressChange = (e: CustomEvent) => {
    this.showPopups();
    const progressBar = e.target as SlRange;
    let currentTime = progressBar.value;

    if (this.videoPlayer.playerType === PlayerType.Spotify && currentTime === 0) {
      (this.videoPlayer.videoElement as any).api.restart();
    }
    this.videoPlayer.currentTime = currentTime;
    this.videoControlsBar.handleTimeUpdate(Math.floor(currentTime));
  };

  /**
   * Enables or disables fullscreen mode.
   */
  private toggleFullscreen() {
    if (this.isFullscreen) {
      document.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  /**
   * Handles the fullscreen change event by repositioning the baubles to fit the new video size.
   */
  private handleFullscreenChange = () => {
    this.isFullscreen = document.fullscreenElement === this || this.classList.contains("ww-fullscreen");
    this.updateBaublePositions();
    this.videoControlsBar.updateFullscreenIcon(this.isFullscreen);

    if (this.isFullscreen) {
      this.controlsTimeout = window.setTimeout(() => {
        if (this.areControlsHovered) return;
        this.hideControls();
      }, 3000);

      this.addEventListener("mousemove", this.handleMouseMove);
      this.controlsElement.addEventListener("mouseenter", this.handleControlMouseEnter);
      this.controlsElement.addEventListener("mouseleave", this.handleControlMouseLeave);
    } else {
      this.removeEventListener("mousemove", this.handleMouseMove);
      this.controlsElement.removeEventListener("mouseenter", this.handleControlMouseEnter);
      this.controlsElement.removeEventListener("mouseleave", this.handleControlMouseLeave);
      this.showControls();
    }
  };

  // TODO: Make separate component for controls
  /**
   * Handles mouse movement in fullscreen mode to show the controls when the mouse is moved.
   * 
   * @param e - The MouseEvent object representing the mouse movement event.
   */
  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isFullscreen) return;

    this.showControls();
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = window.setTimeout(() => {
      if (this.areControlsHovered) return;
      this.hideControls();
    }, 3000);
  }

  /**
   * Handles mouse enter the controls in fullscreen mode to prevent hiding the controls while hovering over them.
   * 
   * @param e - The MouseEvent object representing the mouse hover event.
   */
  private handleControlMouseEnter = (e: MouseEvent) => {
    if (!this.isFullscreen) return;
    this.areControlsHovered = true;
  }

  /**
   * Handles mouse leave the controls in fullscreen mode to allow hiding the controls again.
   * 
   * @param e - The MouseEvent object representing the mouse hover event.
   */
  private handleControlMouseLeave = (e: MouseEvent) => {
    if (!this.isFullscreen) return;
    this.areControlsHovered = false;
  }

  private showControls() {
    if (!this.isFullscreen) return;
    this.controlsVisible = true;
  }

  private hideControls() {
    if (!this.isFullscreen) return;
    this.controlsVisible = false;
    this.videoPlayer.focus();
  }

  /**
   * Sets up the video player with a base64-encoded video source.
   * @param src - The base64-encoded video source.
   */
  private setupVideoBase64(src: string) {
    this.videoBase64 = src;
    this.updateContext();
    this.videoPlayer.loadVideoBase64(src);
  }

  /**
   * Sets up the video player with a YouTube or video URL.
   * @param src - The video URL.
   */
  private setupVideoURL(src: string) {
    this.videoURL = src;
    this.updateContext();
    this.videoPlayer.loadVideoURL(src);
  }

  private handleVideoPlay() {
    this.videoControlsBar.playButton.setAttribute("src", `${playerPause}`);
    this.startPlayButtonAnimation();
  }

  private handleVideoPause() {
    this.videoControlsBar.playButton.setAttribute("src", `${playerPlay}`);
    this.startPlayButtonAnimation();
  }

  private startPlayButtonAnimation() {
    // Add the scaling animation class to the button
    this.videoControlsBar.playButton.classList.add("scale-animation");

    // Remove the animation class after it's done
    setTimeout(() => {
      this.videoControlsBar.playButton.classList.remove("scale-animation");
    }, 300); // Adjust timing to match animation duration
  }

  /**
   * Toggles the playback of the video. If the video has ended, it resets the current time to 0.
   * @remarks
   * Also changes the play button icon to 'pause' if the video is playing, and 'play' if the video is paused.
   */
  private togglePlayVideo() {
    if (!this.videoLoaded) return;

    if (this.videoPlayer.ended) {
      this.videoPlayer.currentTime = 0;
      this.playVideo();
    } else if (this.videoPlayer.paused) {
      this.playVideo();
    } else {
      this.pauseVideo();
    }
  }

  /**
   * Plays the video.
   */
  playVideo() {
    this.videoPlayer.play();
  }

  /**
   * Pauses the video.
   */
  pauseVideo() {
    this.videoPlayer.pause();
  }

  // TODO: Currently unused, remove if not needed
  /**
   * Calculates the contrast color based on the given hex color.
   * @param hexColor - The hex color value.
   * @returns Either black or White depending on contrast with the given color.
   */
  private getContrastColor(hexColor: string): string {
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
  private handleOverlayClicked = (event: MouseEvent) => {
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
   * Handles the 'canplay' event of the video element.
   *
   * This function is called when the video can be played.
   * @remarks
   * It performs various actions such as enabling/disabling the addButton, setting the progressBar value to 0,
   * setting the video volume to 1, setting the volumeSlider value to 100, and initializing the chapterConfig
   * if it is empty.
   * The Timeout was necessary to ensure that the elements are rendered before the actions are performed.
   */
  private handleCanPlay = () => {
    if (this.videoLoaded) return;
    this.videoLoaded = true;
    this.updateContext();
    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.value = 0;
      }
      if (this.videoPlayer) {
        this.videoPlayer.volume = 1;
      }
      if (this.videoControlsBar.volumeSlider) {
        this.videoControlsBar.volumeSlider.value = 100;
      }
      if (!this.chapterConfig || this.chapterConfig.length === 0) {
        const defaultChapter = [
          { title: `${msg("Chapter")} 1`, startTime: 0 },
        ];
        this.chapterConfig = defaultChapter;
      }

      this.updateContext();
      this.requestUpdate();
    }, 0);
  };

  /**
   * Handles the duration change event of the video element.
   * @remarks
   * This function is called when the duration of the video is loaded to set up things we dont have to wait for the video to load fully for.
   */
  private handleDurationChange = () => {
    this.videoDurationFormatted = formatTime(this.videoPlayer.duration);

    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.max = this.videoPlayer.duration;
        this.progressBar.tooltipFormatter = (value: number) => {
          return formatTime(
            Math.floor(value)
          );
        };
      }

      if (this.videoControlsBar.timeStamp && this.videoPlayer.duration) {
        this.videoControlsBar.handleDurationUpdate(Math.floor(this.videoPlayer.duration));
      }

      this.updateBaublePositions();
      this.requestUpdate();

      if (this.videoDetails && !this.videoDetails.duration) {
        this.videoDetails = { ...this.videoDetails, duration: Math.floor(this.videoPlayer.duration) };
        this.updateContext();
      }
    }, 0);
  };

  /**
   * Handles loading errors for the video element.
   * @param error - The error message or object.
   */
  private handleLoadingError(error: string) {
    console.error("Error loading video:", error);
    this.clearVideo();
    this.hadLoadingError = true;
  }

  /**
   * Clears the current video and resets the video context and player.
   */
  private clearVideo(removeInteractions: boolean = true) {
    this.videoLoaded = false;
    this.videoType = "placeholder";
    this.videoBase64 = "";
    this.videoURL = "";
    this.videoDetails = { title: "", author: "", duration: 0 };
    this.waveformData = null;
    this.videoPlayer.clearVideo();
    this.videoControlsBar.handleTimeUpdate(0);
    this.videoControlsBar.handleDurationUpdate(0);
    if (!!this.videoControlsBar.volumeSlider)
      this.videoControlsBar.volumeSlider.value = 100;
    if (!!this.progressBar)
      this.progressBar.value = 0;
    this.hadLoadingError = false;
    this.hideAllInteractions();

    if (removeInteractions) {
      // Remove interactions
      this.replaceChildren();
      this.selectedInteractionId = -1;

      // Remove chapters
      this.chapterConfig = [];
      this.chaptersDrawer.requestUpdate();
    }

    this.updateContext();
  }

  private showRemoveVideoDialog() {
    this.removeVideoDialog.show();
  }

  private setShowOverlay(e: CustomEvent) {
    this.hideInteractions = !e.detail.value;

    if (this.hideInteractions) {
      this.hideAllInteractions();
    } else {
      this.showPopups();
    }
  }
  
  private setHasChapters(e: CustomEvent) {
    this.hideChapters = !e.detail.value;

    if (this.hideChapters) {
      this.closeChaptersDrawer();
    }
  }

  private setAllowPlaybackRateChange(e: CustomEvent) {
    this.disablePlaybackRateChange = !e.detail.value;

    if (this.disablePlaybackRateChange) {
      this.changePlaybackRate(1);
    }

    this.updateContext();
  }

  private setChapterConfig(e: CustomEvent) {
    // Deep copy to avoid mutation issues
    const copy = structuredClone(e.detail.value);

    this.chapterConfig = copy;
    this.updateContext();
  }

  /**
   * Monitors the slot for changes and handles fullscreen changes and interaction removals.
   * @param mutationList - List of mutations to be monitored
   */
  private monitorSlot = (mutationList: MutationRecord[]) => {
    mutationList.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        this.handleFullscreenChange();
      }

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

if (!customElements.get("webwriter-interactive-video")) {
  customElements.define(
    "webwriter-interactive-video",
    WebwriterInteractiveVideo
  );
}