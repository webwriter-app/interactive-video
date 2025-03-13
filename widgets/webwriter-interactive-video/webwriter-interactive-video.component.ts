import { html, css, _$LE, PropertyValueMap, TemplateResult } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlCard from "@shoelace-style/shoelace/dist/components/card/card.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlDrawer from "@shoelace-style/shoelace/dist/components/drawer/drawer.component.js";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.component.js";
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js";
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlColorPicker from "@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js";
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js";
import SlTextarea from "@shoelace-style/shoelace/dist/components/textarea/textarea.component.js";

import { videoData } from "../../models/videoData";
import { WwInteractiveBauble } from "../webwriter-interactive-bauble/webwriter-interactive-bauble.component";
import { WwVideoInteraction } from "../webwriter-video-interaction/webwriter-video-interaction.component";

import styles from "./webwriter-interactive-video.styles";

import play from "../../assets/play.svg";
import pause from "../../assets/pause.svg";
import volumeDown from "../../assets/volumeDown.svg";
import volumeOff from "../../assets/volumeOff.svg";
import volumeMute from "../../assets/volumeMute.svg";
import volumeUp from "../../assets/volumeUp.svg";

import add from "../../assets/add.svg";
import fullscreenEnter from "../../assets/fullscreenEnter.svg";
import fullscreenExit from "../../assets/fullscreenExit.svg";
import gear from "../../assets/gear.svg";
import trash from "../../assets/trash.svg";
import resize from "../../assets/resize.svg";
import chapter from "../../assets/chapter.svg";

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
      "sl-textarea": SlTextarea,
      "sl-button": SlButton,
      "sl-input": SlInput,
      "sl-card": SlCard,
      "sl-icon-button": SlIconButton,
      "sl-drawer": SlDrawer,
      "sl-range": SlRange,
      "sl-dropdown": SlDropdown,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
      "webwriter-interactive-bauble": WwInteractiveBauble,
      "sl-checkbox": SlCheckbox,
      "sl-icon": SlIcon,
      "sl-color-picker": SlColorPicker,
      "sl-details": SlDetails,
    };
  }

  /**
   * The styles for the webwriter-interactive-video component.
   */
  static styles = [styles];

  // Video properties

  /**
   * Indicates whether the video is currently playing.
   * This property is reflected as an attribute.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor videoLoaded: boolean = false;

  /**
   * Video duration formatted as a string, initialized to 00:00 before the vidoe is loaded.
   */
  @property({ type: String })
  accessor videoDurationFormatted: string = "00:00";

  /**
   * Video file as a base64 string for offline storage.
   */
  @property({ type: String, attribute: true, reflect: true })
  accessor videoBase64: string = "";

  /**
   * Video URL for online playback.
   */
  @property({ type: String, attribute: true, reflect: true })
  accessor videoURL: string = "";

  /**
   * Last time when timeupdate event was fired.
   */
  @property()
  accessor lastTimeupdate: number = 0;

  /**
   * The video element.
   */
  @property({ type: HTMLVideoElement })
  accessor video;

  // Video UI queries

  /**
   * Query for the video element.
   */
  @query("#video")
  accessor videoElement: HTMLVideoElement;

  /**
   * Query for the progress bar element.
   */
  @query("#progress-bar")
  accessor progressBar;

  /**
   * Query for the uppper controls container.
   */
  @query("#controls-upper")
  accessor upperControls: HTMLDivElement;

  /**
   * Query for the videos time stamp.
   */
  @query("#time-stamp")
  accessor timeStamp;

  /**
   * Query for the volume slider.
   */
  @query("#volume-slider")
  accessor volumeSlider;

  /**
   * Query for the play button
   */
  @query("#play")
  accessor playButton: SlButton;

  /**
   * Query for the drop area for repositioning baubles on the progress bar.
   */
  @query("#drop-area")
  accessor dropArea;

  /**
   * Query for the mute button.
   */
  @query("#mute-volume-button")
  accessor muteButton: SlButton;

  /**
   * Query for the fullscreen button.
   */
  @query("#fullscreen-button")
  accessor fullscreenButton: SlButton;

  /**
   * Query for the add interactions button.
   */
  @query("#add-button")
  accessor addButton: SlButton;

  /**
   * Query for the settings button.
   */
  @query("#settings-button")
  accessor settingsButton: SlButton;

  // Interaction properties and queries

  /**
   * Map containing the video data for each interactive element.
   */
  @property()
  accessor videoData: Map<number, videoData> = new Map();

  /**
   * Query for the interactions drawer.
   */
  @query("#interactions-drawer")
  accessor drawer: SlDrawer;

  /**
   * Query for the interaction settings container for replace interactions. This contains the interactive slot and the replace timestamp input, as well as a delete button.
   */
  @query("#replace-interaction-settings")
  accessor replaceInteractionSettings: HTMLElement;

  /**
   * Query for the interaction settings container for overlay interactions. This contains all the overlay settings, as well as a delete button.
   */
  @query("#overlay-interaction-settings")
  accessor overlayInteractionSettings: HTMLElement;

  /**
   * Indicates whether the interaction view is active.
   */
  @property({ type: Boolean })
  accessor interactionActive = false;

  /**
   * Query for the interaction container that is nested within the drawer.
   */
  @query("#interaction-container")
  accessor interactionContainer: HTMLDivElement;

  /**
   * Query for the interaction slot that contains the interactive elements
   */
  @query("#interaction-slot")
  accessor interactionSlot: HTMLSlotElement;

  /**
   * Indicates which element is currently active, by saving the id of the element.
   */
  @property()
  accessor activeElement: number;

  /**
   * Contains the current videoData as a JSON string.
   */
  @property({ type: String, attribute: true, reflect: true })
  accessor interactionConfig: string = "[]";

  /**
   * sets the z-index of the overlay
   */
  @property({ type: Number })
  accessor overlayZIndex = 50;

  /**
   * Query for the start time input in the overlay settings.
   */
  @query("#overlay-start-time-input")
  accessor overlayStartTimeInput: SlInput;

  /**
   * Query for the end time input in the overlay settings.
   */
  @query("#overlay-end-time-input")
  accessor overlayEndTimeInput: SlInput;

  /**
   * Query for the input of the x-position in the overlay settings.
   */
  @query("#overlay-x-position-input")
  accessor OverlayXPositionInput: SlInput;

  /**
   * Query for the input of the y-position in the overlay settings.
   */
  @query("#overlay-y-position-input")
  accessor OverlayYPositionInput: SlInput;

  /**
   * Query for the content input in the overlay settings.
   */
  @query("#overlay-content-input")
  accessor overlayContentInput: SlInput;

  /**
   * Query for the width input in the overlay settings.
   */
  @query("#overlay-width-input")
  accessor overlayWidthInput: SlInput;

  /**
   * Query for the height input in the overlay settings.
   */
  @query("#overlay-height-input")
  accessor overlayHeightInput: SlInput;

  /**
   * Query for the color picker in the overlay settings.
   */
  @query("#color-picker")
  accessor colorPicker: SlColorPicker;

  /**
   * Query for the replace timestamp input in the replace settings.
   */
  @query("#replace-timestamp")
  accessor replaceTimestamp: SlInput;

  // File input properties and queries

  /**
   * Query for the file input element-
   */
  @query("#fileInput")
  accessor fileInput: HTMLInputElement;

  /**
   * Represents the list of files (we will only be grabbing the first one).
   */
  @property({ attribute: false })
  accessor files: FileList;

  // Chapter properties

  /**
   * Contains the current chapter configuration as a JSON string.
   */
  @property({ type: String, attribute: true, reflect: true })
  accessor chapterConfig: string = "[]";

  /**
   * Query for the drawer that holds the chapter configurations.
   */
  @query("#chapters-drawer")
  accessor chaptersDrawer: SlDrawer;

  // Teacher Options

  /**
   * Teacher options for showing interactions, initially set to false.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showInteractions = false;

  /**
   * Teacher options for showing overlays, initially set to true.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor showOverlay = true;

  /**
   * Teacher options declaring whether the video has chapters, initially set to false.
   */
  @property({ type: Boolean, attribute: true, reflect: true })
  accessor hasChapters = false;

  // Miscellaneous

  /**
   * Indicates whether a drag operation is currently happening.
   */
  @property({ type: Boolean })
  accessor isDragging = false;

  /**
   * Handles the click event for the add button.
   */
  handleAddClick = () => {
    if (!this.videoLoaded) return;
    if (!this.drawer.open) {
      this.drawer.open = true;
    }
    // set z-index of overlay to 0 so they don't cover the drawer.
    this.overlayZIndex = 0;
    // clears the drawer from previous settings
    this.hideDrawerContent();
  };

  /**
   * Options for configuring the shadow root of the component.
   * Inherits the shadow root options from LitElement and adds the ability to delegate focus.
   */
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Handles the selection of the interaction type in the dropdown menu and adds an interactive element to the DOM in case of a replace interaction.
   * @param e - CustomEvent containing the selected item from the dropdown
   */
  handleInteractionTypeSelected = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    if (e.detail.item.value == 1) {
      // replace
      this.showReplaceSettings();

      // create interaction and set videodata
      const interaction = document.createElement(
        "webwriter-video-interaction"
      ) as WwVideoInteraction;
      const id = this.videoData.size + 1;
      interaction.setAttribute("id", `${id}`);
      this.videoData.set(interaction.id, {
        isReplace: true,
        startTime: this.video.currentTime,
      });
      interaction.slot = "interaction-slot";

      //append it to the dom
      this.appendChild(interaction);

      //this is now the active element (displays it in the drawer)
      this.changeActiveElement(interaction.id);

      //update replace settings UI and initialize timestamp to current time
      this.replaceTimestamp.value = this.formatTime(this.video.currentTime);
    } else {
      // overlay
      this.showOverlaySettings();

      // create interaction and set videodata
      const interaction = document.createElement(
        "webwriter-video-interaction"
      ) as WwVideoInteraction;
      const id = this.videoData.size + 1;
      interaction.setAttribute("id", `${id}`);
      this.videoData.set(interaction.id, {
        isReplace: false,
        startTime: this.video.currentTime,
        endTime: this.video.currentTime + 5, // Default 5 seconds duration
        position: { x: 0, y: 0 },
        content: "Hello, World",
        size: { width: 100, height: 100 },
      });
      interaction.slot = "interaction-slot";

      //append it to the dom
      this.appendChild(interaction);

      //this is now the active element (displays it in the drawer)
      this.changeActiveElement(interaction.id);

      //update overlay settings UI
      this.setOverlaySettingsContentFromVideoSetting();
    }
    this.saveInteractionConfig();
  };

  /**
   * Sets the overlay settings content from the video setting.
   */
  setOverlaySettingsContentFromVideoSetting() {
    const data = this.videoData.get(this.activeElement);
    this.overlayStartTimeInput.value = this.formatTime(data.startTime);
    this.overlayEndTimeInput.value = this.formatTime(data.endTime);
    this.OverlayXPositionInput.value = `${data.position.x}`;
    this.OverlayYPositionInput.value = `${data.position.y}`;
    this.overlayContentInput.value = `${data.content}`;
    this.overlayWidthInput.value = `${data.size.width}`;
    this.overlayHeightInput.value = `${data.size.height}`;
  }

  /**
   * Hides all drawer content for the interactive drawer.
   */
  hideDrawerContent() {
    this.replaceInteractionSettings.hidden = true;
    this.overlayInteractionSettings.hidden = true;
  }

  /**
   * Shows the replace settings and hides the overlay settings.
   */
  showReplaceSettings() {
    this.replaceInteractionSettings.hidden = false;
    this.overlayInteractionSettings.hidden = true;
  }

  /**
   * Shows the overlay settings and hides the replace settings.
   */
  showOverlaySettings() {
    this.replaceInteractionSettings.hidden = true;
    this.overlayInteractionSettings.hidden = false;
  }

  /*
   * Sets up some default values for the overlay
   */
  firstUpdated() {
    if (this.videoBase64) {
      this.setupVideo(this.videoBase64);
    } else if (this.videoURL) {
      this.setupVideo(this.videoURL);
    }
    this.updateBaublePositions();
  }

  /**
   * Handles the click event on a bauble element.
   *
   * @param event - The MouseEvent object representing the click event.
   * @remarks
   * This function is called when a bauble is clicked. It checks if the control key is pressed and if so, it sets the video time to the bauble's start time.
   * Otherwise, it calls the clickEventHelper function to handle the click event.
   */
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;
    if (event.ctrlKey) {
      this.video.currentTime = this.videoData.get(clickedElement.id).startTime;
      return;
    } else {
      this.clickEventHelper(clickedElement.id);
    }
  }

  /**
   * Helper function for handling click event of baubles.
   *
   * @param id - The ID of the element that was clicked.
   * @remarks
   * This function is called when a bauble is clicked without the control button being held.
   * It changes the active element to the clicked element and updates the overlay settings with the corresponding data.
   */
  clickEventHelper(id: number) {
    this.changeActiveElement(id);
    const interactionData = this.videoData.get(id);

    if (interactionData.isReplace) {
      this.replaceTimestamp.value = this.formatTime(interactionData.startTime);
      this.showReplaceSettings();
    } else {
      // Update overlay settings inputs
      this.overlayStartTimeInput.value = this.formatTime(
        interactionData.startTime
      );
      this.overlayEndTimeInput.value = this.formatTime(interactionData.endTime);
      this.OverlayXPositionInput.value = `${interactionData.position.x}`;
      this.OverlayYPositionInput.value = `${interactionData.position.y}`;
      this.overlayContentInput.value = `${interactionData.content}`;
      this.overlayWidthInput.value = `${interactionData.size.width}`;
      this.overlayHeightInput.value = `${interactionData.size.height}`;
      this.colorPicker.setAttribute("value", interactionData.color);

      this.showOverlaySettings();
    }

    if (!this.drawer.open) {
      this.drawer.open = true;
      this.overlayZIndex = 0;
    }
  }

  /**
   * Saves the interaction configuration by converting the video data into a JSON string.
   * The resulting JSON string is assigned to the interactionConfig property.
   */
  saveInteractionConfig() {
    const config = Array.from(this.videoData.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
    this.interactionConfig = JSON.stringify(config);
  }

  /**
   * Loads the interaction configuration from videoData Map.
   * @remarks
   * This function is called when the interactionConfig property is updated. It parses the JSON string and stores the resulting data in the videoData map.
   */
  loadInteractionConfig() {
    if (this.interactionConfig) {
      const config = JSON.parse(this.interactionConfig);
      this.videoData.clear();
      config.forEach((item) => {
        const { id, ...data } = item;
        this.videoData.set(id, data);
      });
      this.requestUpdate();
    }
  }

  /**
   * Changes the active element to the specified index.
   * @param newActive - The index of the new active element.
   */
  changeActiveElement(newActive: number) {
    this.activeElement = newActive;
    this.interactionSlot
      .assignedElements()
      .forEach((element: WwVideoInteraction) => {
        if (element.id == newActive) {
          element.active = true;
        } else {
          element.active = false;
        }
      });
  }

  /**
   * Handles the time input change event.
   *
   * @param e - The custom event object.
   * @param index - The optional index of the chapter.
   * @remarks
   * This function is called when the time input is changed. It parses the input value and updates the corresponding time value.
   * If the index is provided, it updates the chapter time; otherwise, it updates the bauble time.
   */
  handleTimeInputChange = (e: CustomEvent, index?: number) => {
    const input = e.target as SlInput;
    const newTime = this.parseTime(input.value);

    if (newTime !== null) {
      // an index is only passed if the time input is for a chapter
      if (index !== undefined) {
        //update chapter time
        this.updateChapterTime(index, newTime);
      } else {
        //update bauble time
        this.baubleTimeUpdateHelper(newTime, this.activeElement, input);
      }
      input.value = this.formatTime(newTime);
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
    }
    // change bauble positions to reflect new time and request an update
    this.updateBaublePositions();
  };

  /**
   * Updates video data with new time values when baubles are dropped on progress bar.
   *
   * @param newTime - The new time value.
   * @param index - The index of the bauble.
   * @param input - The time input element of the corresponding interaction type/property.
   * @remarks
   * This function is called when a bauble is dropped on the progress bar. It updates the start time of the bauble and the corresponding input element.
   * If the input element is the overlay start time, it also updates the end time to be 5 seconds after the start time.
   */
  baubleTimeUpdateHelper(newTime: number, index: number, input: SlInput) {
    const data = this.videoData.get(index);
    if (data) {
      if (input === this.overlayStartTimeInput) {
        data.startTime = newTime;
        if (newTime > data.endTime) {
          data.endTime = newTime + 5;
          this.overlayEndTimeInput.value = this.formatTime(data.endTime);
        }
      } else if (input === this.overlayEndTimeInput) {
        data.endTime = newTime;
      } else if (input === this.replaceTimestamp) {
        data.startTime = newTime;
      }
      this.videoData.set(index, data);
      this.saveInteractionConfig();
    }
  }

  /**
   * Calculates the offset based on the given time.
   *
   * @param time - The time in seconds.
   * @returns The calculated offset.
   */
  calculateOffset(time: number): number {
    if (!this.videoLoaded || !this.video) return;
    const rect = this.video.getBoundingClientRect();
    return (time / this.video.duration) * 0.95 * rect.width;
  }

  /**
   * Handles the change event when teacher options for showing interactions is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowInteractionsChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showInteractions = target.checked;
  };

  /**
   * Handles the drag start event for a bauble.
   *
   * @param e - The drag event.
   */
  handleBaubleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("id", (e.target as WwInteractiveBauble).id);
    e.dataTransfer.setData("previousActive", `${this.activeElement}`);
    this.changeActiveElement((e.target as WwInteractiveBauble).id);
    this.changeAddToTrash();
  };

  /**
   * Changes the add button to a trash button.
   */
  changeAddToTrash() {
    this.addButton.setAttribute("src", `${trash}`);
    this.addButton.style.color = "hsl(0 72.2% 50.6%)";
  }

  /**
   * Changes the trash button to an add button.
   */
  changeTrashToAdd() {
    this.addButton.setAttribute("src", `${add}`);
    this.addButton.style.color = "hsl(200.4 98% 39.4%)";
  }

  /**
   * Handles the change event when teacher options for showing Overlays is triggered.
   *
   * @param e - The custom event object.
   */
  handleShowOverlayChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showOverlay = target.checked;
  };

  /**
   * Checks whether a video is already existing on load.
   * @returns whether a video exists (either base64 or URL, used for deciding whether to show file input area or video element)
   */
  hasVideo = (): boolean => {
    if (this.videoBase64 || this.videoURL) {
      return true;
    }
    return false;
  };

  /**
   * Renders the component.
   *
   * @returns either HTML for either the widget or the file input area, depending on whether a video has already been selected.
   */
  render() {
    return html`
      <!-- teacher options bugged, maybe its a focus issue idk im putting it here so i can access them. Manage focus better-->
      ${this.renderTeacherOptions()}
      ${this.hasVideo() ? this.widget() : this.renderFileInputArea()}
    `;
  }

  /**
   * Renders the teacher options for the interactive video widget.
   *
   * @returns {TemplateResult} The rendered HTML for teacher options.
   * @remarks the CSS class 'temporary-teacher-options' is only since the focus on the widget does not work properly and we need to display them somewhere, this at the very least makes them look nicer.
   */
  renderTeacherOptions(): TemplateResult {
    return html`
      <div
        style="display:flex; margin-bottom:10px;"
        id="temporary-teacher-options-container"
      >
        <sl-checkbox
          @sl-change=${this.handleShowInteractionsChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          >Show Interactions</sl-checkbox
        >
        <sl-checkbox
          checked
          @sl-change=${this.handleShowOverlayChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          >Show Overlays</sl-checkbox
        >
        <sl-checkbox
          @sl-change=${this.handleHasChaptersChange}
          class="temporary-teacher-options"
          style="overflow: hidden"
          >Has Chapters</sl-checkbox
        >
      </div>
    `;
  }

  /**
   * Handles the change event when the "hasChapters" checkbox is toggled.
   * @param e - The custom event object.
   */
  handleHasChaptersChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.hasChapters = target.checked;
    this.requestUpdate();
  };

  /**
   * Renders the chapters drawer.
   *
   * @returns {TemplateResult} the rendered HTML for the chapters drawer, filled with the chapters list and an add chapter button (if content is editable).
   */
  renderChaptersDrawer(): TemplateResult {
    return html`
      <sl-drawer contained label="Chapters" id="chapters-drawer">
        ${this.renderChaptersList()}
        ${this.isContentEditable
          ? html`<sl-button @click=${this.addChapter}>Add Chapter</sl-button>`
          : null}
      </sl-drawer>
    `;
  }

  /**
   * Toggles the chapters drawer open or closed.
   */
  toggleChaptersDrawer() {
    this.chaptersDrawer.open = !this.chaptersDrawer.open;
  }

  /**
   * Retrieves the current chapter based on the current time of the video.
   * @returns The current chapter object containing the title and start time, or null if there are no chapters or the current time is before the start of any chapter.
   */
  getCurrentChapter(): { title: string; startTime: number } | null {
    if (!this.hasChapters) return null;
    const chapters = JSON.parse(this.chapterConfig);
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (this.video.currentTime >= chapters[i].startTime) {
        return chapters[i];
      }
    }
    return null;
  }

  /**
   * Renders the chapters list.
   *
   * @returns {TemplateResult} The rendered Chapters list from the chapter config.
   * @remarks
   * This function maps over the chapters in the chapter config and renders a list of chapters.
   * If the content is editable, it renders input fields for the chapter title and start time, as well as a delete button.
   */
  renderChaptersList() {
    const chapters = JSON.parse(this.chapterConfig);
    return html`
      <ul class="chapter-list">
        ${chapters.map(
          (chapter, index) => html`
            <li class="chapter-item">
              ${this.isContentEditable
                ? html`
                    <!-- Render Chapter Title-->
                    <sl-input
                      label="Title"
                      value=${chapter.title}
                      @sl-change=${(e) =>
                        this.updateChapterTitle(index, e.target.value)}
                    >
                    </sl-input>
                    <!-- Only for the first chapter do not allow start time change -->
                    ${index === 0
                      ? html`<p>Start Time: 00:00</p>`
                      : html`
                          <!-- Render chapter card with an input field to change start time-->
                          <sl-input
                            label="Start Time"
                            value=${this.formatTime(chapter.startTime)}
                            @sl-change=${(e) =>
                              this.handleTimeInputChange(e, index)}
                          ></sl-input>
                        `}
                    <!-- Delete button for all but the first chapter -->
                    ${index > 0
                      ? html`<sl-button
                          variant="danger"
                          @click=${() => this.deleteChapter(index)}
                          >Delete</sl-button
                        >`
                      : ""}
                  `
                : html`
                    <!-- If content is not editable, just display chapter information -->
                    <div class="chapter-info">
                      <strong>${chapter.title}</strong> - Start Time:
                      ${this.formatTime(chapter.startTime)}
                    </div>
                  `}
              <!-- Jump to Chapter button -->
              <sl-button
                variant="primary"
                @click=${() => this.jumpToChapter(index)}
                >Jump to Chapter</sl-button
              >
            </li>
          `
        )}
      </ul>
    `;
  }

  /**
   * Jumps to a specific chapter in the interactive video.
   * @param index - The index of the chapter to jump to.
   */
  jumpToChapter(index: number) {
    const chapters = JSON.parse(this.chapterConfig);
    if (chapters[index]) {
      this.video.currentTime = chapters[index].startTime;
    }
  }

  /**
   * Adds a new chapter to the interactive video.
   * The new chapter is appended to the end of the chapter list.
   */
  addChapter() {
    const chapters = JSON.parse(this.chapterConfig);
    const lastChapter = chapters[chapters.length - 1];
    const newStartTime = lastChapter
      ? Math.min(lastChapter.startTime + 60, this.video.duration)
      : 0;
    chapters.push({
      title: `Chapter ${chapters.length + 1}`,
      startTime: newStartTime,
    });
    this.updateChapters(chapters);
  }

  /**
   * Updates the start time of a chapter at the specified index.
   *
   * @param index - The index of the chapter to update.
   * @param newTime - The new start time for the chapter.
   */
  updateChapterTime(index: number, newTime: number) {
    if (index === 0) return;
    let chapters = JSON.parse(this.chapterConfig);
    chapters[index].startTime = newTime;
    this.updateChapters(chapters);
  }

  /**
   * Updates the title of a chapter at the specified index.
   *
   * @param index - The index of the chapter to update.
   * @param newTitle - The new title for the chapter.
   */
  updateChapterTitle(index: number, newTitle: string) {
    const chapters = JSON.parse(this.chapterConfig);
    chapters[index].title = newTitle;
    this.updateChapters(chapters);
  }

  /**
   * Parses a time string and returns the equivalent number of seconds.
   *
   * @param timeStr - The time string to parse.
   * @returns The number of seconds represented by the time string, or null if the time string is invalid.
   */
  parseTime(timeStr: string): number | null {
    const parts = timeStr.toString().split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  /**
   * Updates the chapters of the interactive video, sorting them by start time.
   *
   * @param chapters - An array of chapters to update.
   */
  updateChapters(chapters: any[]) {
    chapters.sort((a, b) => a.startTime - b.startTime);
    this.chapterConfig = JSON.stringify(chapters);
    this.requestUpdate();
  }

  /**
   * Deletes a chapter from the chapter configuration.
   *
   * @param index - The index of the chapter to delete.
   */
  deleteChapter(index: number) {
    const chapters = JSON.parse(this.chapterConfig);
    chapters.splice(index, 1);
    this.updateChapters(chapters);
  }

  /**
   * Handles the drag over event for the file input area.
   * @param e - The drag event.
   */
  handleDragOverFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handles the drop event on the file input area.
   *
   * @param e - The drag event.
   */
  handleDropOnFileInputArea(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Handles the file input event.
   *
   * @param e - The event object.
   */
  handleFileInput(e: Event) {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  /**
   * Handles the selected file and reads its contents as a data URL.
   * @param file - The file to be handled.
   */
  handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.videoBase64 = result;
        this.setupVideo(result);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Handles the input event for the URL input field.
   *
   * @param e - The CustomEvent object representing the input event.
   */
  handleUrlInput(e: CustomEvent) {
    const input = e.target as SlInput;
    const url = input.value;
    if (url) {
      this.videoURL = url;
      this.setupVideo(url);
    }
  }

  /**
   * Renders the widget component.
   *
   * @returns {TemplateResult} The rendered widget.
   * @remarks
   * This function renders the interactive video widget, which consists of a video element, interactive baubles, and control elements.
   */
  widget(): TemplateResult {
    return html` <div id="container-vertical">
      <!-- container for the video element -->
      <div class="container-video" @click=${this.handleVideoClick}>
        ${this.video} ${this.videoLoaded ? this.renderOverlays() : undefined}
      </div>
      <!-- container for the controls -->
      <div id="controls">
        ${this.renderInteractiveBaubles()} ${this.renderProgressBar()}
        ${this.renderLowerControls()}
      </div>
      ${this.renderChaptersDrawer()} ${this.renderInteractionDrawer()}
    </div>`;
  }

  /**
   * Renders the interaction drawer.
   *
   * @returns {TemplateResult} The HTML for the interaction drawer.
   * @remarks
   * This function renders the interaction drawer, which contains the settings for adding and configuring interactive elements.
   */
  renderInteractionDrawer(): TemplateResult {
    return html` <sl-drawer
      style="z-index: 100;"
      label="Add Interaction"
      contained
      id="interactions-drawer"
    >
      ${this.renderInteractionTypeSelector()}
      <div id="interaction-settings-container">
        ${this.renderReplaceInteractionSettings()}
        ${this.renderOverlayInteractionSettings()}
      </div>
    </sl-drawer>`;
  }

  /**
   * Renders the progress bar for the interactive video.
   * @returns {TemplateResult} The Progress bar SlRange element within a container div.
   */
  renderProgressBar(): TemplateResult {
    return html` <div id="progress-bar-container">
      <sl-range
        id="progress-bar"
        @sl-change=${this.handleProgressChange}
      ></sl-range>
    </div>`;
  }

  /**
   * Renders the current chapter of the interactive video.
   *
   * @returns The HTML representation of the current chapter, or an empty string if there is no current chapter.
   */
  renderCurrentChapter() {
    const currentChapter = this.getCurrentChapter();
    return currentChapter
      ? html`<div id="current-chapter">${currentChapter.title}</div>`
      : "";
  }

  /**
   * Renders the lower controls for the webwriter interactive video widget.
   *
   * @returns {TemplateResult} The HTML for the lower controls.
   * @remarks
   * This function renders the lower controls for the interactive video widget, including the play button, time stamp, volume slider, and fullscreen button.
   * If the video has chapters, it also renders a chapters button.
   * If the content is editable, it renders an add button for adding interactive elements.
   */
  renderLowerControls(): TemplateResult {
    return html` <div id="controls-lower">
      <div id="controls-lower-left">
        <sl-icon-button
          class="icon-button"
          id="play"
          @click=${this.handlePlayClick}
          src="${play}"
        ></sl-icon-button>
        <p id="time-stamp">00:00/00:00</p>
        ${this.hasChapters
          ? html`<sl-icon-button
              class="icon-button"
              id="chapters-button"
              @click=${this.toggleChaptersDrawer}
              src="${chapter}"
            ></sl-icon-button>`
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
          @sl-change=${this.handleVolumeChange}
        ></sl-range>
        <sl-icon-button
          class="icon-button"
          src="${add}"
          id="add-button"
          @click=${this.handleAddClick}
          @drop=${this.handleBaubleDroppedOnAdd}
          enabled=${this.isContentEditable}
        >
        </sl-icon-button>
        ${this.renderVideoSettings()}
        <sl-icon-button
          class="icon-button"
          id="fullscreen-button"
          src="${fullscreenEnter}"
          @click=${this.handleFullscreenClick}
        ></sl-icon-button>
      </div>
    </div>`;
  }

  /**
   * Renders the interaction type selector.
   *
   * @returns {TemplateResult} The template for the dropdown menu in the interactions drawer.
   */
  renderInteractionTypeSelector() {
    return html` <sl-dropdown
      label="Interaction Type"
      id="interaction-type-dropdown"
      @sl-select=${this.handleInteractionTypeSelected}
    >
      <sl-button slot="trigger" id="interaction-type-button" caret
        >Interaction Type</sl-button
      >
      <sl-menu>
        <sl-menu-item value="1">Replace</sl-menu-item>
        <sl-menu-item value="2">Overlay</sl-menu-item>
      </sl-menu>
    </sl-dropdown>`;
  }

  /**
   * Renders the video settings.
   *
   * @returns {TemplateResult} The template for the settings menu accessible via the cog icon button.
   */
  renderVideoSettings() {
    return html`
    <sl-dropdown placement='top-start' id='settings-menu' @sl-select=${this.settingSelectionHandler}>
      <sl-icon-button class='icon-button' id='settings-button' src='${gear}' slot='trigger'></sl-icon-button>
      <sl-menu>
        <sl-menu-item>
          Playback Speed
          <sl-menu slot='submenu'>
            <sl-menu-item value='0.25'>0.25x</sl-menu-item>
            <sl-menu-item value='0.5'>0.5x</sl-menu-item>
            <sl-menu-item value='1'>1x</sl-menu-item>
            <sl-menu-item value='1.5'>1.5x</sl-menu-item>
            <sl-menu-item value='2'>2x</sl-menu-item>
          <sl-menu>
        </sl-menu-item>
      </sl-menu>
    </sl-dropdown>`;
  }

  /**
   * Renders the settings for the replace interaction type.
   *
   * @returns {TemplateResult} The template for the settings for replace interactions.
   * @remarks
   * This holds the interaction-slot for hosting webwriter-video-interaction elements.
   * Also contains an input field for setting the starting time of a replace interaction.
   */
  renderReplaceInteractionSettings() {
    return html` <div id="replace-interaction-settings" hidden>
      <sl-input
        id="replace-timestamp"
        label="Timestamp"
        @sl-change=${this.handleTimeInputChange}
      ></sl-input>
      <!-- container for the interactive elements -->
      <div id="interaction-container">
        ${this.isContentEditable
          ? html`<slot name="interaction-slot" id="interaction-slot"> </slot>`
          : null}
        <div class="interaction-button-group">
          <sl-button @click=${this.toggleInteractionView}>
            ${this.interactionActive ? "Return to Video" : "View Interaction"}
          </sl-button>
          ${this.interactionActive
            ? html``
            : html`<sl-button variant="danger" @click=${this.deleteElement}>
                Delete
              </sl-button>`}
        </div>
        <sl-button
          slot="footer"
          style="margin-top: 10px"
          variant="primary"
          @click=${this.closeDrawer}
          >Close</sl-button
        >
      </div>
    </div>`;
  }

  /**
   * Renders the interaction type selector.
   *
   * @returns {TemplateResult} The template for the settings for overlay interactions.
   * @remarks
   * This includes inputs for the start and end time, content, color, position, and size of the overlay.
   */
  renderOverlayInteractionSettings() {
    return html` <div id="overlay-interaction-settings" hidden>
      <sl-input
        id="overlay-start-time-input"
        label="Start Time"
        @sl-change=${this.handleTimeInputChange}
      ></sl-input>
      <sl-input
        id="overlay-end-time-input"
        label="End Time"
        @sl-change=${this.handleTimeInputChange}
      ></sl-input>
      <sl-textarea
        label="Content"
        id="overlay-content-input"
        @sl-change=${this.handleOverlayContentChange}
      ></sl-textarea>
      <p>Color</p>
      <sl-color-picker
        label="Overlay Color"
        id="color-picker"
        @sl-change=${this.handleOverlayColorChange}
      ></sl-color-picker>
      <sl-details style="margin-top:10px;" summary="Advanced Options">
        <sl-input
          label="X Position"
          id="overlay-x-position-input"
          type="number"
          @sl-change=${this.handleOverlayPositionChange}
        >
        </sl-input>
        <sl-input
          label="Y Position"
          id="overlay-y-position-input"
          type="number"
          @sl-change=${this.handleOverlayPositionChange}
        >
        </sl-input>
        <sl-input
          label="Width"
          id="overlay-width-input"
          type="number"
          @sl-change=${this.handleOverlaySizeChange}
        >
        </sl-input>
        <sl-input
          label="Height"
          id="overlay-height-input"
          type="number"
          @sl-change=${this.handleOverlaySizeChange}
        >
        </sl-input>
      </sl-details>
      <div class="interaction-button-group" slot="footer">
        <sl-button
          style="margin-top: 10px"
          variant="primary"
          @click=${this.closeDrawer}
          >Close</sl-button
        >
        ${this.interactionActive
          ? null
          : html`<sl-button
              style="margin-top: 10px"
              variant="danger"
              @click=${this.deleteElement}
            >
              Delete
            </sl-button>`}
      </div>
    </div>`;
  }

  /**
   * Handles the change in overlay position.
   *
   * @param e - The custom event containing the target element.
   */
  handleOverlayPositionChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      const data = this.videoData.get(this.activeElement);
      data.position = data.position || { x: 0, y: 0 };
      if (input.label.toLowerCase() === "x position") {
        data.position.x = value;
      } else if (input.label.toLowerCase() === "y position") {
        data.position.y = value;
      }
      this.saveInteractionConfig();
      this.requestUpdate();
    }
  }

  /**
   * Handles the change event for inputs in the content field of an overlay interaction.
   * Updates the content of the active element in the videoData object
   * and saves the interaction configuration.
   *
   * @param e - The custom event object.
   */
  handleOverlayContentChange(e: CustomEvent) {
    const textarea = e.target as SlTextarea;
    this.videoData.get(this.activeElement).content = textarea.value;
    this.saveInteractionConfig();
  }

  /**
   * Handles the change even when inputting a new overlay size.
   *
   * @param e - The custom event containing the target element.
   */
  handleOverlaySizeChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value > 0) {
      const data = this.videoData.get(this.activeElement);
      data.size = data.size || { width: 100, height: 100 };
      data.size[input.label.toLowerCase() as "width" | "height"] = value;
      this.saveInteractionConfig();
    }
  }

  /**
   * Deletes the currently active element and updates the necessary configurations.
   * @remarks
   * This is currently bugged. Ask for more information on this if needed.
   * Somehow, when deleting an element, the id of the remaining elements changes automatically.
   * I've tried to fix this by recalculating the indexes, but this also doesn't seem to work.
   */
  deleteElement() {
    this.interactionSlot.assignedElements().forEach((element) => {
      if (
        element instanceof WwVideoInteraction &&
        element.id === this.activeElement
      ) {
        element.remove();
      }
    });
    this.videoData.delete(this.activeElement);
    //this.recalculateIndexes();
    this.saveInteractionConfig();
    this.closeDrawer();
    this.updateBaublePositions();
  }

  /**
   * Updates the positions of the baubles in the widget.
   */
  updateBaublePositions() {
    if (!this.upperControls) return;
    const children = this.upperControls.children;
    Array.from(children).forEach((child: Element) => {
      if (child instanceof WwInteractiveBauble) {
        const id = parseInt(child.id);
        const data = this.videoData.get(id);
        if (data) {
          const newOffset = this.calculateOffset(data.startTime);
          if (newOffset !== undefined) {
            child.setAttribute("offset", `${newOffset}`);
          }
        }
      }
    });
    this.requestUpdate();
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
    this.recalculateBaubleIndexes();
    this.recalculateInteractionIndexes();
    this.interactionSlot
      .assignedElements()
      .forEach((element: WwVideoInteraction) => {
        console.log(element.id);
      });
  }

  /**
   * helper function for recalculateIndexes, the entire thing is somehow bugged. Read documentation of updateBaublePositions and recalculateIndexes for more information.
   * The idea was to recalculate the indexes of those video interactions affected by shifting (or rather, not shifting some times (its really weird)).
   */
  recalculateInteractionIndexes() {
    (this.interactionSlot.assignedElements() as WwVideoInteraction[])
      .sort((a, b) => a.id - b.id)
      .forEach((element, index) => {
        console.log(
          "changing interaction with id",
          element.id,
          "to",
          index + 1
        );
        element.setAttribute("id", `${index + 1}`);
        console.log("new id is", element.id);
      });
  }

  /** helper function for recalculateIndexes, the entire thing is somehow bugged. This function works in its current state. Use at own risk.
   *
   */
  recalculateBaubleIndexes() {
    console.log(this.videoData.keys(), "is current videoData");
    const newData = Array.from(this.videoData.entries())
      .sort((a, b) => a[0] - b[0])
      .reduce(
        (map, [_, value], index) => map.set(index + 1, value),
        new Map<number, videoData>()
      );
    console.log(newData.keys(), "is new videoData");
    this.videoData = newData;
    this.saveInteractionConfig();
  }

  /**
   * Toggles the replace interaction view to display the element across the whole screen
   */
  toggleInteractionView() {
    if (this.interactionActive) {
      this.minimizeInteraction();
    } else {
      this.maximizeInteraction();
    }
  }

  /**
   *
   * Minimizes the interaction container.
   */
  minimizeInteraction() {
    this.drawer.hide();
    this.interactionContainer.style.position = "initial";
    this.interactionContainer.style.zIndex = "0";
    this.interactionContainer.style.backgroundColor = "transparent";
    this.interactionContainer.style.left = "0";
    this.interactionContainer.style.width = "100%";
    this.interactionContainer.style.height = "30%";
    this.interactionContainer.style.color = "black";
    this.interactionContainer.style.fontSize = "1em";
    this.interactionActive = false;
    this.interactionContainer.style.transform = "translateX(7px)";
  }

  /**
   * Maximizes the interaction container and displays it on the screen.
   */
  maximizeInteraction = () => {
    this.drawer.open = true;
    this.overlayZIndex = 0;
    const rect = this.shadowRoot
      .querySelector("#container-vertical")
      .getBoundingClientRect() as DOMRect;
    this.interactionContainer.style.position = "fixed";
    this.interactionContainer.style.zIndex = "1000";
    this.interactionContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.interactionContainer.style.display = "block";
    this.interactionContainer.style.color = "white";
    this.interactionContainer.style.fontSize = "2em";
    for (const key in rect) {
      this.interactionContainer.style[key] = `${rect[key]}px`;
    }
    this.interactionContainer.style.transform = "translateX(-20px)";
    this.interactionActive = true;
  };

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

  /**
   * Updates the volume button icon based on the current state of the video and volume slider.
   * If the video is muted, no changes are made to the icon.
   * If the volume slider value is 0, the mute button icon is set to `volumeOff`.
   * If the volume slider value is less than 50, the mute button icon is set to `volumeDown`.
   * If the volume slider value is 50 or greater, the mute button icon is set to `volumeUp`.
   */
  volumeButtonIconHelper() {
    if (this.video.muted) return;
    if (this.volumeSlider.value === 0)
      this.muteButton.setAttribute("src", `${volumeOff}`);
    else {
      this.volumeSlider.value < 50
        ? this.muteButton.setAttribute("src", `${volumeDown}`)
        : this.muteButton.setAttribute("src", `${volumeUp}`);
    }
  }

  /**
   * Event handler for selection of playback speeds from the setting menu.
   * @param {CustomEvent} e - The custom event object.
   */
  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    this.video.playbackRate = e.detail.item.value;
  };

  /**
   * Seeks the video to the specified time.
   * @param value - The time value to seek by.
   */
  seek(value: number) {
    if (!this.videoLoaded) return;
    this.video.currentTime += value;
  }

  /**
   * Handles the time update event of the video player and check whether there are interactions to be displayed by comparing current call time to last.
   * This way we dont skip any interactions and dont fire twice since this is called inconsistently.
   *
   * @param e - The custom event object.
   */
  handleTimeUpdate = (e: CustomEvent) => {
    if (this.showInteractions || !this.isContentEditable) {
      this.replaceInteractionHelper();
    }
    this.lastTimeupdate = this.video.currentTime;
    this.progressBar.value =
      (this.video.currentTime / this.video.duration) * 100;
    this.timeStamp.innerHTML =
      this.formatTime(this.lastTimeupdate) + "/" + this.videoDurationFormatted;

    if (this.video.currentTime >= this.video.duration) {
      this.playButton.setAttribute("src", `${play}`);
    }
  };

  /**
   * Checks whether a replace interaction should be replaced currently.
   * If the video time matches the start time of a replace interaction,
   * the active element is changed, the video is paused, and the interaction is maximized.
   */
  replaceInteractionHelper() {
    this.videoData.forEach((value, key) => {
      if (value.isReplace) {
        if (
          this.lastTimeupdate <= value.startTime &&
          this.video.currentTime >= value.startTime
        ) {
          if (this.activeElement != key) {
            this.changeActiveElement(key);
          }
          if (!this.video.paused) {
            this.video.pause();
            this.playButton.setAttribute("src", `${play}`);
          }
          this.maximizeInteraction();
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
    let currentTime = (progressBar.value / 100) * this.video.duration;
    this.video.currentTime = Math.floor(currentTime);
    this.timeStamp.value =
      this.formatTime(currentTime) + "/" + this.videoDurationFormatted;
  };

  /**
   * Called when the element is first connected to the document's DOM.
   * @remarks
   * Adds event listeners for fullscreen changes.
   * Also builds the interaction configuration and renders the chapters list, if available.
   */
  connectedCallback() {
    super.connectedCallback();
    this.videoLoaded = false;
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    this.loadInteractionConfig();
    this.renderChaptersList();
  }

  /**
   * Handles the fullscreen change event by repositioning the baubles to fit the new video size.
   */
  handleFullscreenChange = () => {
    this.updateBaublePositions();
  };

  /**
   * Handles the change event for the volume slider and sets the video volume and button icon accordingly.
   *
   * @param e - The custom event object.
   */
  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;
    this.video.volume = volumeSlider.value / 100;
    this.volumeButtonIconHelper();
  };

  /**
   * Formats the given time in seconds into a string representation of hours, minutes, and seconds.
   *
   * @param time - The time in seconds to format.
   * @returns A string representation of the formatted time in 'hh:mm:ss' or 'mm:ss' format for videos under an hour.
   */
  formatTime(time: number): string {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  /**
   * Converts the selected video file to base64 format and sets up the video.
   * @param e - The event object triggered by the file input change.
   */
  videoToBase64(e: Event) {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      console.error("No file selected");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.videoBase64 = result;
        this.setupVideo(result);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Sets up the video element with the provided source and attaches event listeners to the video object.
   *
   * @param src - The source URL of the video.
   */
  setupVideo(src: string) {
    this.video = document.createElement("video");
    this.video.src = src;

    this.video.style.width = "100%";
    this.video.addEventListener("loadedmetadata", this.handleMetadataLoaded);
    this.video.addEventListener("canplaythrough", this.handleCanPlayThrough);
    this.video.addEventListener("timeupdate", this.handleTimeUpdate);
    this.video.addEventListener("click", this.handleVideoClick);
  }

  /**
   * Handles the click event on the video element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  handleVideoClick = (e: MouseEvent) => {
    if (!this.videoLoaded) return;
    e.stopPropagation();
    this.startStopVideo();
  };

  /**
   * Toggles the playback of the video. If the video has ended, it resets the current time to 0.
   * @remarks
   * Also changes the play button icon to 'pause' if the video is playing, and 'play' if the video is paused.

   */
  startStopVideo() {
    if (!this.videoLoaded) return;
    if (this.video.ended) {
      this.video.currentTime = 0;
    }
    if (this.video.paused) {
      this.video.play();
      this.playButton.setAttribute("src", `${pause}`);
    } else {
      this.video.pause();
      this.playButton.setAttribute("src", `${play}`);
    }
  }

  /**
   * Closes the drawer if the video is loaded.
   */
  closeDrawer() {
    if (!this.videoLoaded) return;
    this.overlayZIndex = 50;
    this.drawer.open = false;
  }

  /**
   * Handles the click event when the play button is clicked.
   *
   * @param e - The custom event object.
   */
  handlePlayClick = (e: CustomEvent) => {
    this.startStopVideo();
  };

  /**
   * Renders the overlay elements for the video.
   *
   * @returns {Array<TemplateResult>} of any overlay elements that need to be displayed at the current video time
   * @remarks
   * this checks video time to see if an overlay should be displayed and renders those from the videoData map.
   */
  renderOverlays() {
    if (!this.showOverlay && this.isContentEditable) return;
    return Array.from(this.videoData.entries())
      .filter(([_, data]) => !data.isReplace)
      .map(([id, data]) => {
        if (
          this.video.currentTime >= data.startTime &&
          this.video.currentTime <= data.endTime
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
                        z-index: ${this.overlayZIndex};
                        background-color: ${data.color || "#ffffff"};
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 10px;
                        overflow: hidden;"
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
                src=${resize}
              >
              </sl-icon>
            </div>
          `;
        }
        return null;
      });
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
    this.clickEventHelper(
      parseInt((event.currentTarget as HTMLElement).id.split("-")[1])
    );
  };

  /**
   * Starts the dragging operation when the user clicks and drags the overlay element.
   *
   * @param e - The MouseEvent object representing the click event.
   */
  startDragging(e: MouseEvent) {
    if (this.drawer.open) return;
    const overlay = e.currentTarget as HTMLElement;
    const startX = e.clientX - overlay.offsetLeft;
    const startY = e.clientY - overlay.offsetTop;

    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;

      let newX = e.clientX - startX;
      let newY = e.clientY - startY;

      // Constrain to video boundaries
      const videoRect = this.video.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, videoRect.width - overlay.offsetWidth));
      newY = Math.max(
        0,
        Math.min(newY, videoRect.height - overlay.offsetHeight)
      );

      overlay.style.left = `${newX}px`;
      overlay.style.top = `${newY}px`;

      // Update videoData
      const id = parseInt(overlay.id.split("-")[1]);
      this.videoData.get(id).position = { x: newX, y: newY };
    };

    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.saveInteractionConfig();
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
    if (this.drawer.open) return;
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
      const videoRect = this.video.getBoundingClientRect();
      newWidth = Math.min(newWidth, videoRect.width - overlay.offsetLeft);
      newHeight = Math.min(newHeight, videoRect.height - overlay.offsetTop);

      overlay.style.width = `${newWidth}px`;
      overlay.style.height = `${newHeight}px`;

      // Update videoData
      const id = parseInt(overlay.id.split("-")[1]);
      this.videoData.get(id).size = { width: newWidth, height: newHeight };
    };

    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.saveInteractionConfig();
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
    if (this.videoLoaded) return;
    this.videoLoaded = true;

    setTimeout(() => {
      if (this.addButton) {
        this.addButton.disabled = !this.isContentEditable;
      }

      if (this.progressBar) {
        this.progressBar.value = 0;
      }

      if (this.video) {
        this.video.volume = 0.1;
      }

      if (this.volumeSlider) {
        this.volumeSlider.value = 10;
      }

      if (this.hasChapters && JSON.parse(this.chapterConfig).length === 0) {
        this.chapterConfig = JSON.stringify([
          {
            title: "Chapter 1",
            startTime: 0,
          },
        ]);
      }

      this.requestUpdate();
    }, 0);
  };

  /**
   * Handles the loaded metadata event of the video element.
   * @remarks
   * This function is called when the metadata of the video is loaded to set up things we dont have to wait for the video to load fully for.
   */
  handleMetadataLoaded = () => {
    this.videoDurationFormatted = this.formatTime(this.video.duration);

    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.max = 100;
        this.progressBar.tooltipFormatter = (value: number) => {
          return this.formatTime(
            Math.floor((value / 100) * this.video.duration)
          );
        };
      }

      if (this.timeStamp) {
        this.timeStamp.innerHTML = `00:00/${this.videoDurationFormatted}`;
      }

      this.requestUpdate();
    }, 0);
  };

  // MARK: todo css
  /**
   * Renders the file input area for selecting a video file or entering a video URL.
   *
   * @returns {TemplateResult} The rendered HTML template for the file input area.
   */
  renderFileInputArea() {
    return html` <div
        id="file-input-area"
        @dragover=${this.handleDragOverFileInputArea}
        @drop=${this.handleDropOnFileInputArea}
      >
        <label for="fileInput" style="cursor: pointer;" id="file-input-label"
          >Click to Select Video File or enter URL below</label
        >
        <input
          name="fileInput"
          id="fileInput"
          type="file"
          accept="video/*"
          @change=${this.handleFileInput}
          style="display:none;"
        />
      </div>
      <sl-input
        id="url-input"
        placeholder="Enter video URL"
        @sl-change=${this.handleUrlInput}
      ></sl-input>`;
  }

  /**
   * Renders the interactive baubles for the webwriter-interactive-video component.
   *
   * @returns {TemplateResult} The HTML Template for the upper controls, this contains all baubles and the drop area.
   * @remarks
   * This function maps over the videoData map and renders a webwriter-interactive-bauble element for each entry.
   */
  renderInteractiveBaubles() {
    return html` <div
      id="drop-area"
      @drop=${this.handleBaubleDroppedOnDropArea}
      @dragover=${this.handleBaubleDraggedOverDropArea}
      @dragleave=${this.handleBaubleLeaveDropArea}
    >
      <div id="controls-upper">
        ${Array.from(this.videoData.entries()).map(([key, value]) => {
          return value.isReplace
            ? html` <webwriter-interactive-bauble
                style="transform: translateY(-2px); border-radius: 50%;"
                offset=${this.calculateOffset(value.startTime)}
                @dragstart=${this.handleBaubleDragStart}
                @dragend=${this.handleBaubleDragEnd}
                draggable="true"
                @click=${this.handleBaubleClick}
                id=${key}
              >
              </webwriter-interactive-bauble>`
            : html` <webwriter-interactive-bauble
                style="transform: translateY(-2px);"
                offset=${this.calculateOffset(value.startTime)}
                @dragstart=${this.handleBaubleDragStart}
                @dragend=${this.handleBaubleDragEnd}
                draggable="true"
                @click=${this.handleBaubleClick}
                id=${key}
              >
              </webwriter-interactive-bauble>`;
        })}
      </div>
    </div>`;
  }

  /**
   * Handles the event when a bauble is dropped on the drop area.
   *
   * @param e - The DragEvent object representing the drop event.
   * @remarks
   * Dropping a bauble on the drop area changes the corresponding interactions starttime to whatever the bauble was dropped at
   */
  handleBaubleDroppedOnDropArea(e: DragEvent) {
    const rect = this.dropArea.getBoundingClientRect();
    const distanceFromLeft = e.clientX - rect.left;
    this.baubleTimeUpdateHelper(
      Math.floor(this.video.duration * (distanceFromLeft / rect.width)),
      parseInt(e.dataTransfer.getData("id")),
      this.videoData.get(parseInt(e.dataTransfer.getData("id"))).isReplace
        ? this.replaceTimestamp
        : this.overlayStartTimeInput
    );

    this.videoData.get(parseInt(e.dataTransfer.getData("id"))).startTime =
      Math.floor(this.video.duration * (distanceFromLeft / rect.width));
    this.saveInteractionConfig();
    this.dropArea.style.background = "none";
    this.changeTrashToAdd();
    this.changeActiveElement(
      parseInt(e.dataTransfer.getData("previousActive"))
    );
    this.updateBaublePositions();
  }

  /**
   * Handles the event when a bauble is dropped on the "add" button.
   * This deletes the object. When the drag event starts the add button turns into a trash can.
   * @param e - The DragEvent object representing the drop event.
   *
   */
  handleBaubleDroppedOnAdd(e: DragEvent) {
    this.dropArea.style.background = "none";
    this.deleteElement();
    this.changeActiveElement(
      parseInt(e.dataTransfer.getData("previousActive"))
    );
    this.changeTrashToAdd();
  }

  /**
   * Handles the event when a bauble is dragged over the drop area.
   * Changes the background color of the drop area to a semi-transparent gray.
   *
   * @param e - The DragEvent object representing the drag event.
   */
  handleBaubleDraggedOverDropArea(e: DragEvent) {
    this.dropArea.style.background = "rgba(0.5,0.5,0.5,0.5)";
  }

  /**
   * Handles the event when a bauble is dragged out of the drop area.
   * Resets the background of the drop area.
   *
   * @param e - The DragEvent object representing the drag event.
   */
  handleBaubleLeaveDropArea(e: DragEvent) {
    this.dropArea.style.background = "none";
  }

  /**
   * Handles the drag end event for the bauble.
   *
   * @param e - The drag event.
   */
  handleBaubleDragEnd = (e: DragEvent) => {
    this.changeActiveElement(
      parseInt(e.dataTransfer.getData("previousActive"))
    );
    this.dropArea.style.background = "none";
    this.addButton.setAttribute("src", `${add}`);
    this.addButton.style.color = "hsl(200.4 98% 39.4%)";
  };

  /**
   * Handles the click event for the mute button.
   *
   * @param e - The custom event object.
   */
  handleMuteClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    const t = e.target as SlButton;
    if (this.video.muted) {
      this.video.muted = false;
      this.volumeButtonIconHelper();
    } else {
      this.video.muted = true;
      this.muteButton.setAttribute("src", `${volumeMute}`);
    }
  };

  /**
   * Handles the change event when the overlay color is changed.
   *
   * @param e - The custom event containing the color picker target.
   */
  handleOverlayColorChange(e: CustomEvent) {
    const colorPicker = e.target as SlColorPicker;
    const data = this.videoData.get(this.activeElement);
    if (data) {
      data.color = colorPicker.value;
      this.saveInteractionConfig();
    }
  }
}
