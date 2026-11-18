import { html, PropertyValues } from "lit";
import { property, query, queryAssignedElements, state, customElement } from "lit/decorators.js";
import { provide } from "@lit/context";
import type { MsgFn } from "@lit/localize";
import { LitElementWw } from "@webwriter/lit";
import { jsonData } from "@webwriter/lit/data";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
import { Shortcuts } from "@webwriter/lit/shortcuts";
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.component.js";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.component.js";

import styles from "../components/webwriter-interactive-video.styles";
import { InteractiveVideoContext, videoContext } from "../components/interactive-video-context";
import { VideoInputOverlay } from "../components/video-input-overlay";
import { VideoControlsBar } from "../components/video-controls-bar";
import { VideoChapterDrawer } from "../components/video-chapter-drawer";
import { InteractionsProgressBar } from "../components/interactions-progress-bar";
import { VideoPlayer } from "../components/video-player";
import { FullscreenController } from "../components/interactive-video-fullscreen";
import { InteractionsController } from "../components/interactive-video-interactions";
import { LoadingController } from "../components/interactive-video-loading";
import { exportWebVtt, importWebVtt, loadMediaElement, toAudioElement, toVideoElement } from "../components/interactive-video-conversions";
import { PlaybackController } from "../components/interactive-video-playback";
import { chapterSeedSelector, readChapterSeed } from "../model/chapter-seed";
import { baseVideoSize, DEFAULT_ASPECT_RATIO, fitVideoArea } from "../model/video-geometry";
import { isAudioType, type Chapter } from "../model/timeline";
import { formatTime } from "../model/time-format";
import type { WebwriterVideoInteraction } from "./webwriter-video-interaction";

type Labelled = { msg: MsgFn };

type AuthoredData = {
  videoBase64: string;
  videoDetails: { title: string; author: string; duration: number };
  waveformData: number[][] | null;
  chapterConfig: Chapter[];
};

/**
 * An audio or video player to which authors add interactions: popups that appear at a given time and pause the media, and chapters.
 * The media is a file (stored as base64 in the widget's JSON data block, together with its details, the waveform and the chapters)
 * or a link to YouTube, Vimeo, TikTok, Spotify or a direct file. The player libraries for each kind of source are loaded when it is first used.
 * Interactions are `webwriter-video-interaction` children; keys the data block does not know are kept.
 * Space and K play and pause, F toggles fullscreen, M mutes, the arrow keys change volume and skip 5 s, J and L skip 10 s, C opens the chapters.
 * Interaction and chapter markers on the progress bar are buttons; in edit mode the arrow keys on an interaction marker move its start time by 1 s, and a touch drag moves it too.
 * The layout follows the container width (300 to 2100 px) and the controls collapse when it is narrow. The accent of the sliders and markers follows `--ww-theme-accent-1`, the font `--ww-font-family`.
 * On paper the media and its controls are replaced by the title, the chapters and the interactions with their time spans.
 *
 * Conversions: a `video` or `audio` element with a source becomes the media of a new widget, and a media file or direct link becomes a `video` or `audio` element (interactions and chapters are dropped).
 * WebVTT (`.vtt`, `text/vtt`) holds the chapters as cues and the interactions as cues `interaction-<id>` with the text of their content; formatting, images and position are dropped.
 * An import replaces the chapters, retimes the interactions with the same id and adds the other cues as new interactions.
 * Signals: `time` (number, seconds) and `chapter` (string, title of the current chapter). The widget takes no effects.
 *
 * @part video - The area that holds the media and the interactions.
 * @part controls - The progress bar and the control bar.
 */
@customElement("webwriter-interactive-video")
export class WebwriterInteractiveVideo extends LitElementWw {
  static dataType = "application/json";

  /** The styles for the webwriter-interactive-video component. */
  static styles = [styles];

  /** The custom elements that can be used within the scope of the `webwriter-interactive-video` component. */
  static scopedElements = {
    "sl-range": SlRange,
    "sl-dialog": SlDialog,
    "sl-button": SlButton,
    "sl-checkbox": SlCheckbox,
    "video-input-overlay": VideoInputOverlay,
    "video-controls-bar": VideoControlsBar,
    "video-chapter-drawer": VideoChapterDrawer,
    "interactions-progress-bar": InteractionsProgressBar,
    "video-player": VideoPlayer,
  };

  static options = {
    "hide-interactions": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Hide interactions") },
    "hide-chapters": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Hide chapters") },
    "disable-playback-rate-change": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Disable playback rate changes") },
  };

  static convertFrom = { video: loadMediaElement, audio: loadMediaElement, ".vtt": importWebVtt, "text/vtt": importWebVtt };

  static convertTo = { video: toVideoElement, audio: toAudioElement, "text/vtt": exportWebVtt };

  static optionGroups = {
    playback: { label: (widget: Labelled) => widget.msg("Playback"), collapsible: true, advanced: false },
  };

  static actions = {
    importMedia: {
      label: (widget: Labelled) => widget.msg("Import media file"),
      group: "playback",
      icon: "Upload",
      input: { type: "file" as const, accept: "video/*,audio/*", multiple: false },
    },
    removeMedia: {
      label: (widget: Labelled) => widget.msg("Remove media"),
      group: "playback",
      icon: "Delete",
      intent: "danger" as const,
      confirm: (widget: Labelled) => widget.msg("Remove the current media and keep its interactions and chapters?"),
    },
    // Player keys. They have no button in the editor's drawer.
    playPause: { hidden: true, shortcut: ["Space", "K"] },
    toggleFullscreenByKey: { hidden: true, shortcut: "F" },
    toggleMuteByKey: { hidden: true, shortcut: "M" },
    volumeUp: { hidden: true, shortcut: "ArrowUp" },
    volumeDown: { hidden: true, shortcut: "ArrowDown" },
    skipForward: { hidden: true, shortcut: "ArrowRight" },
    skipBackward: { hidden: true, shortcut: "ArrowLeft" },
    skipForwardLong: { hidden: true, shortcut: "L" },
    skipBackwardLong: { hidden: true, shortcut: "J" },
    toggleChapters: { hidden: true, shortcut: "C" },
  };

  localize = localizer(this, {
    sourceLocale,
    targetLocales,
    load: (locale) => import(`../../localization/generated/${locale}.ts`),
    drawer: true,
  });
  public readonly msg = this.localize.msg;
  /** Answers for the components in the shadow tree, so that they follow the editing mode. */
  readonly #permissions = new Permissions(this);
  /** Runs the player keys declared as `shortcut` in `static actions`. */
  readonly #shortcuts = new Shortcuts(this);
  /** The data block. It holds the media, its details, the waveform and the chapters; keys it does not know are kept. */
  readonly #data = jsonData<Partial<AuthoredData>>(this, {
    defaults: {},
    changed: (data) => {
      if (typeof data.videoBase64 === "string") this.videoBase64 = data.videoBase64;
      if (data.videoDetails && typeof data.videoDetails === "object") this.videoDetails = data.videoDetails;
      if (Array.isArray(data.waveformData) || data.waveformData === null) this.waveformData = data.waveformData;
      if (Array.isArray(data.chapterConfig)) this.chapterConfig = data.chapterConfig;
      this.requestUpdate();
    },
  });

  readonly fullscreen = new FullscreenController(this);
  readonly interactions = new InteractionsController(this);
  readonly loading = new LoadingController(this);
  readonly playback = new PlaybackController(this);
  /** Read-only values for other widgets, see the class description. */
  readonly signals = this.playback.signals;

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
  @property({ type: String, attribute: false, state: true })
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
  @property({ type: Object, attribute: false, state: true })
  accessor videoDetails: { title: string; author: string; duration: number } = {
    title: "",
    author: "",
    duration: 0,
  };

  /** Waveform data for audio visualization generated by WaveSurfer.js. */
  @property({ type: Array, attribute: false, state: true })
  accessor waveformData: number[][] | null = null;
  /** CONTEXT: Chapter Properties */

  /** Contains the current chapter configuration as an object. */
  @property({ type: Array, attribute: false, state: true })
  accessor chapterConfig: Chapter[] = [];
  /** CONTEXT: Interaction Properties */

  /** Contains the ID of the selected interaction. */
  @property({ type: Number })
  accessor selectedInteractionId: number = -1;

  /** The list of video interaction elements slotted into the component. */
  @queryAssignedElements({
    flatten: true,
    selector: "webwriter-video-interaction",
  })
  accessor videoInteractions: WebwriterVideoInteraction[];

  /** The tab index of the component. */
  @property({ type: Number, attribute: true, reflect: true })
  accessor tabIndex = -1;

  @state()
  private accessor volumeControlsVisible = true;

  @state()
  private accessor playbackRateControlsVisible = true;

  /** The current time as last reported by the player; its change renders the widget again, which shows the interactions that are due. */
  @state()
  accessor lastTimeUpdate: number = 0;

  @state()
  accessor videoContainerHeight: number = 0;

  @state()
  accessor videoContainerWidth: number = 0;

  /** The video player element */
  @query("#video")
  accessor videoPlayer: VideoPlayer;

  @query("#container-video-area")
  private accessor videoAreaContainer: HTMLElement;

  @query("#controls")
  accessor controlsElement: HTMLElement;

  @query("video-controls-bar")
  accessor videoControlsBar: VideoControlsBar;

  @query("interactions-progress-bar")
  private accessor interactionsProgressBar: InteractionsProgressBar;

  @query("#progress-bar")
  accessor progressBar: SlRange;

  @query("video-chapter-drawer")
  private accessor chaptersDrawer: VideoChapterDrawer;

  @query("#remove-video-dialog")
  private accessor removeVideoDialog: SlDialog;

  @query("#remove-interactions-checkbox")
  private accessor removeInteractionsCheckbox: SlCheckbox;

  #abort = new AbortController();

  /** The size of the area that the player fills. */
  get videoAreaSize() {
    return fitVideoArea(this.#aspectRatio, { width: this.videoContainerWidth, height: this.videoContainerHeight }, this.fullscreen.active);
  }

  /** The size of the player that interactions are positioned against. */
  get videoBaseSize() {
    return baseVideoSize(this.#aspectRatio);
  }

  get #aspectRatio() {
    if (!this.videoPlayer?.videoElement || !this.videoLoaded) return DEFAULT_ASPECT_RATIO;
    return this.videoPlayer.aspectRatio;
  }

  /**
   * Called when the element is first connected to the document's DOM.
   * A chapter seed block is taken over into the widget's own block and removed, before the runtime looks for the block.
   */
  connectedCallback() {
    const seededChapters = readChapterSeed(this);
    if (seededChapters) this.querySelector(chapterSeedSelector)?.remove();
    super.connectedCallback();
    if (seededChapters) this.chapterConfig = seededChapters;
    this.videoLoaded = false;
    this.updateContext();
    this.#abort = new AbortController();
    const { signal } = this.#abort;

    this.addEventListener("closeChaptersDrawer", this.closeChaptersDrawer as EventListener, { signal });
    this.addEventListener("showRemoveVideoDialog", this.showRemoveVideoDialog as EventListener, { signal });
    this.addEventListener("setShowOverlay", this.setShowOverlay as EventListener, { signal });
    this.addEventListener("setHasChapters", this.setHasChapters as EventListener, { signal });
    this.addEventListener("setAllowPlaybackRateChange", this.setAllowPlaybackRateChange as EventListener, { signal });
    this.addEventListener("setChapterConfig", this.setChapterConfig as EventListener, { signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
  }

  firstUpdated() {
    this.updateContext();

    if (this.videoBase64) {
      this.loading.setupBase64(this.videoBase64);
    } else if (this.videoURL) {
      this.loading.setupURL(this.videoURL);
    }
    this.updateBaublePositions();

    if (this.videoAreaContainer) this.interactions.observeSize(this.videoAreaContainer);
  }

  /** Regenerates the video context when properties change. */
  protected willUpdate(_changedProperties: PropertyValues): void {
    // The player time, the size of the area and the visibility of controls are not part of the context.
    // Without this check every time update rebuilt the context and rendered all consumers again.
    const contextKeys = ["hideInteractions", "hideChapters", "disablePlaybackRateChange", "videoBase64", "videoURL", "videoLoaded", "videoType", "videoDetails", "waveformData", "chapterConfig"];
    if (!this.videoContext || contextKeys.some((key) => _changedProperties.has(key))) {
      this.videoContext = this._composedContext;
      this.updateContext();
    }
  }

  /** Republishes the chapter signal when chapters change while the media is paused. */
  protected updated(changed: PropertyValues): void {
    if ((changed.has("chapterConfig") || changed.has("hideChapters")) && this.videoPlayer) this.playback.publishTime(this.videoPlayer.currentTime);
  }

  async importMedia(files: File[]): Promise<void> {
    const file = files[0];
    if (!file || (!file.type.startsWith("video/") && !file.type.startsWith("audio/"))) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read media file"));
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid media file"));
      reader.readAsDataURL(file);
    });
    this.videoBase64 = dataUrl;
    this.videoURL = "";
    this.videoType = file.type.startsWith("audio/") ? "htmlaudio" : "htmlvideo";
    this.videoDetails = { title: file.name, author: "", duration: 0 };
    this.updateContext();
  }

  removeMedia(): void { this.clearVideo(false); }

  /** Player keys, see `static actions`. */
  playPause(): void { this.playback.toggle(); }
  toggleFullscreenByKey(): void { this.videoControlsBar?.handleFullscreenClick(); }
  toggleMuteByKey(): void { this.videoControlsBar?.handleMuteClick(); }
  volumeUp(): void { this.videoControlsBar?.changeVolume(5); }
  volumeDown(): void { this.videoControlsBar?.changeVolume(-5); }
  skipForward(): void { this.playback.skip(5); }
  skipBackward(): void { this.playback.skip(-5); }
  skipForwardLong(): void { this.playback.skip(10); }
  skipBackwardLong(): void { this.playback.skip(-10); }
  toggleChapters(): void { this.toggleChaptersDrawer(); }

  playVideo() { this.playback.play(); }

  pauseVideo() {
    this.playback.pause();
  }

  /** Writes the widget's state to its data block and renders it again. */
  updateContext() {
    this.#data.set({
      videoBase64: this.videoBase64,
      videoDetails: this.videoDetails,
      waveformData: this.waveformData,
      chapterConfig: this.chapterConfig,
    });
    this.requestUpdate();
  }

  updateBaublePositions() {
    this.interactionsProgressBar.updateBaublePositions();
    this.updateContext();
  }

  /** Clears the media and resets the player; the interactions and chapters go with it unless asked to stay. */
  clearVideo(removeInteractions: boolean = true) {
    this.loading.clearTimeout();
    this.videoLoaded = false;
    this.videoType = "placeholder";
    this.videoBase64 = "";
    this.videoURL = "";
    this.videoDetails = { title: "", author: "", duration: 0 };
    this.waveformData = null;
    this.videoPlayer.clearVideo();
    this.videoControlsBar.handleTimeUpdate(0);
    this.videoControlsBar.handleDurationUpdate(0);
    this.playback.publishTime(0);
    if (this.videoControlsBar.volumeSlider) this.videoControlsBar.volumeSlider.value = 100;
    if (this.progressBar) this.progressBar.value = 0;
    this.loading.reset();
    this.interactions.hideAll();

    if (removeInteractions) {
      this.replaceChildren();
      this.selectedInteractionId = -1;
      this.chapterConfig = [];
      this.chaptersDrawer.requestUpdate();
    }

    this.updateContext();
  }

  private toggleChaptersDrawer() {
    if (this.hideChapters) return;
    this.chaptersDrawer.drawer.open = !this.chaptersDrawer.drawer.open;
  }

  private closeChaptersDrawer() { this.chaptersDrawer.close(); }

  private showRemoveVideoDialog() { this.removeVideoDialog.show(); }

  private setShowOverlay(e: CustomEvent) {
    this.hideInteractions = !e.detail.value;
    if (this.hideInteractions) this.interactions.hideAll();
    else this.interactions.showPopups();
  }

  private setHasChapters(e: CustomEvent) {
    this.hideChapters = !e.detail.value;
    if (this.hideChapters) this.closeChaptersDrawer();
  }

  private setAllowPlaybackRateChange(e: CustomEvent) {
    this.disablePlaybackRateChange = !e.detail.value;

    if (this.disablePlaybackRateChange) {
      this.playback.changeRate(1);
    }

    this.updateContext();
  }

  private setChapterConfig(e: CustomEvent) {
    // A copy, so that later changes of the event's value do not reach the widget.
    this.chapterConfig = structuredClone(e.detail.value);
    this.updateContext();
  }

  private jumpToChapter(time: number) {
    this.videoPlayer.currentTime = time;
  }

  render() {
    const { fullscreen, loading, playback, interactions } = this;
    const hasVideo = !!(this.videoBase64 || this.videoURL);
    return html`
      <div id="widget" class="${fullscreen.active ? "fullscreen" : null} ${!fullscreen.controlsVisible ? "controls-hidden" : null}">
        <div class="print-view">
          ${this.videoDetails.title ? html`<p class="print-title">${this.videoDetails.title}</p>` : null}
          <p>${this.msg("Interactive content: open the document online to play the media.")}</p>
          ${this.hideChapters || !this.chapterConfig.length ? null : html`<ol class="print-chapters">${this.chapterConfig.map(({ startTime, title }) => html`<li>${formatTime(startTime)} ${title}</li>`)}</ol>`}
        </div>
        <!-- VIDEO INPUT / LOADING ERROR / MISSING MEDIA -->
        ${!hasVideo || loading.failed
          ? html`
              <video-input-overlay
                @setupVideoBase64=${(e: CustomEvent) => loading.setupBase64(e.detail.src)}
                @setupVideoURL=${(e: CustomEvent) => loading.setupURL(e.detail.src)}
                @retryLoad=${() => loading.retry()}
                @chooseDifferentSource=${() => loading.chooseDifferentSource()}
                .hasVideo=${hasVideo}
                .error=${loading.failed}
                .errorMessage=${loading.errorMessage}
              ></video-input-overlay>
            `
          : null}
        <div id="container-vertical">
          <!-- VIDEO ELEMENT -->
          <div
            id="container-video-area"
            @click=${() => playback.toggle()}
          >
            <div
              id="container-video"
              part="video"
              @interactionClicked=${(e: CustomEvent) => interactions.select(e.detail.id)}
              @click=${interactions.handleVideoClick}
              @updateContext=${() => this.updateContext()}
              style=${`width: ${this.videoAreaSize.width}px; height: ${this.videoAreaSize.height}px;`}
            >
              <video-player
                id="video"
                .isFullscreen=${fullscreen.active}
                @play=${() => playback.handlePlay()}
                @pause=${() => playback.handlePause()}
                @durationchange=${playback.handleDurationChange}
                @canplay=${loading.handleCanPlay}
                @timeupdate=${playback.handleTimeUpdate}
                @loadingerror=${(e: CustomEvent) => loading.handleError(e.detail.error, e.detail.message)}
                @setvolumecontrolsvisible=${(e: CustomEvent) => { this.volumeControlsVisible = e.detail.visible; }}
                @setplaybackratecontrolsvisible=${(e: CustomEvent) => { this.playbackRateControlsVisible = e.detail.visible; }}
                @setvideodetails=${(e: CustomEvent) => { this.videoDetails = { ...this.videoDetails, ...e.detail } }}
                @setvideotype=${(e: CustomEvent) => { this.videoType = e.detail.type; }}
                @setwaveformdata=${(e: CustomEvent) => { this.waveformData = e.detail.data; }}
              ></video-player>
              ${this.videoLoaded ? interactions.showPopups() : null}
              <slot data-ww-shortcuts="off"></slot>
            </div>
          </div>
          <!-- CONTROLS -->
          <div id="controls" part="controls" class=${!fullscreen.controlsVisible ? "hide" : null}>
            <!-- Baubles // Bubbles on Progress Bar -->
            <interactions-progress-bar
              style="outline: none"
              @interactionBaubleClicked=${(e: CustomEvent) => interactions.clickBauble(e.detail.id)}
              @changeInteractionStartTime=${(e: CustomEvent) => interactions.retime(e.detail.newTime, e.detail.index)}
              @jumpToChapter=${(e: CustomEvent) => this.jumpToChapter(e.detail.startTime)}
            ></interactions-progress-bar>
            <!-- Progress Bar -->
            <sl-range
              id="progress-bar"
              label=${this.msg("Seek")}
              step="0.001"
              @sl-change=${playback.handleProgressChange}
              @pointerdown=${() => (playback.scrubbing = true)}
              @pointerup=${() => (playback.scrubbing = false)}
              @pointercancel=${() => (playback.scrubbing = false)}
            ></sl-range>

            <!-- Video Controls Bar -->
            <video-controls-bar
              style="outline: none"
              .playbackRate=${playback.rate}
              .volumeHidden=${!this.volumeControlsVisible}
              .playbackRateHidden=${!this.playbackRateControlsVisible}
              @volumeChange=${(e: CustomEvent) => playback.setVolume(e.detail.value)}
              @toggleMute=${() => playback.toggleMute()}
              @startstopVideo=${() => playback.toggle()}
              @toggleChaptersDrawer=${() => this.toggleChaptersDrawer()}
              @playbackRateChange=${(e: CustomEvent) => playback.changeRate(e.detail.value)}
              @getCurrentChapter=${() => playback.updateCurrentChapter()}
              @toggleFullscreen=${() => fullscreen.toggle()}
              @addInteraction=${() => interactions.add()}
            ></video-controls-bar>
          </div>
          <!-- CONFIRM INTERACTION DELETE DIALOG -->
          <div id="confirm-delete-dialog">
            <sl-dialog label=${this.msg("Remove media?")} id="remove-video-dialog">
              <p>${isAudioType(this.videoType) ? this.msg("Are you sure you want to remove the current audio?") : this.msg("Are you sure you want to remove the current video?")}</p>
              <sl-checkbox id="remove-interactions-checkbox">${this.msg("Also remove all interactions and chapters")}</sl-checkbox>
              <sl-button slot="footer" variant="primary" @click=${() => {
                this.clearVideo(this.removeInteractionsCheckbox.checked);
                this.removeVideoDialog.hide();
              }}>${this.msg("Yes, remove it")}</sl-button>
              <sl-button slot="footer" variant="text" @click=${() => {
                this.removeVideoDialog.hide();
              }}>${this.msg("No, keep it")}</sl-button>
            </sl-dialog>
          </div>
        </div>
        <!-- DRAWERS -->
        <!-- Video Chapter Drawer -->
        <video-chapter-drawer
          style="z-index: 51"
          @addChapter=${() => this.chaptersDrawer.addChapter(this.videoPlayer.duration)}
          @updateContext=${() => this.updateContext()}
          @jumpToChapter=${(e: CustomEvent) => this.jumpToChapter(e.detail.startTime)}
        ></video-chapter-drawer>
      </div>
    `;
  }
}
