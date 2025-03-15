import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlDrawer,
  SlInput,
  SlColorPicker,
  SlDropdown,
  SlButton,
  SlMenu,
  SlMenuItem,
  SlDetails,
  SlTextarea,
} from "@shoelace-style/shoelace";
import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { videoData } from "../../types/videoData";

import { WwVideoInteraction } from "../../widgets/webwriter-video-interaction/webwriter-video-interaction.component";

import { consume } from "@lit/context";

import { formatTime, parseTime } from "../../utils/timeFormatter";

export class VideoInteractionDrawer extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  /**
   * Returns an object that maps custom element names to their corresponding classes.
   * These custom elements can be used within the scope of the `webwriter-interactive-video` component.
   *
   * @returns An object mapping custom element names to their corresponding classes.
   */
  static get scopedElements() {
    return {
      "sl-drawer": SlDrawer,
      "sl-dropdown": SlDropdown,
      "sl-button": SlButton,
      "sl-menu": SlMenu,
      "sl-menu-item": SlMenuItem,
      "sl-input": SlInput,
      "sl-textarea": SlTextarea,
      "sl-details": SlDetails,
      "sl-color-picker": SlColorPicker,
    };
  }

  /**
   * Query for the interaction slot that contains the interactive elements
   */
  @query("#interaction-slot")
  accessor interactionSlot: HTMLSlotElement;

  /**
   * Query for the replace timestamp input in the replace settings.
   */
  @query("#replace-timestamp")
  accessor replaceTimestamp: SlInput;

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
   * Query for the interaction container that is nested within the drawer.
   */
  @query("#interaction-container")
  accessor interactionContainer: HTMLDivElement;

  //
  //
  @query("#interactions-drawer") accessor drawer: SlDrawer;

  //
  //
  @property({ type: Number }) accessor currentTime = 0;

  /*

  */
  static get styles() {
    return css`
      #replace-timestamp {
        margin-top: 10px;
        margin-bottom: 10px;
      }

      .interaction-button-group {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
    `;
  }

  /*

  */
  firstUpdated() {}

  /**
   * Renders the interaction drawer.
   *
   * @returns {TemplateResult} The HTML for the interaction drawer.
   * @remarks
   * This function renders the interaction drawer, which contains the settings for adding and configuring interactive elements.
   */
  render() {
    return html` <!--  -->
      <sl-drawer
        style="z-index: 100;"
        label="Add Interaction"
        contained
        id="interactions-drawer"
      >
        <!-- SELECT AN INTERACTION TYPE -->
        <sl-dropdown
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
        </sl-dropdown>

        <div id="interaction-settings-container">
          <!-- REPLACE (INTERACTION TYPE) SETTINGS -->
          <div id="replace-interaction-settings" hidden>
            <sl-input
              id="replace-timestamp"
              label="Timestamp"
              @sl-change=${this.handleTimeInputChange}
            ></sl-input>
            <!-- container for the interactive elements -->
            <div id="interaction-container">
              ${this.isContentEditable
                ? html` <!--  -->
                    <slot name="interaction-slot" id="interaction-slot">
                    </slot>`
                : null}
              <div class="interaction-button-group">
                <sl-button @click=${this.toggleInteractionView}>
                  ${this.videoContext.interactionActive
                    ? "Return to Video"
                    : "View Interaction"}
                </sl-button>
                ${this.videoContext.interactionActive
                  ? html``
                  : html`<sl-button
                      variant="danger"
                      @click=${this.deleteElement}
                    >
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
          </div>

          <!-- OVERLAY (INTERACTION TYPE) SETTINGS -->
          <div id="overlay-interaction-settings" hidden>
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
              ${this.videoContext.interactionActive
                ? null
                : html`<sl-button
                    style="margin-top: 10px"
                    variant="danger"
                    @click=${this.deleteElement}
                  >
                    Delete
                  </sl-button>`}
            </div>
          </div>
        </div>
      </sl-drawer>`;
  }

  /**
   * Handles the selection of the interaction type in the dropdown menu and adds an interactive element to the DOM in case of a replace interaction.
   * @param e - CustomEvent containing the selected item from the dropdown
   */
  handleInteractionTypeSelected = (e: CustomEvent) => {
    this.dispatchEvent(
      new CustomEvent("getCurrentTime", {
        bubbles: true,
        composed: true,
      })
    );

    if (!this.videoContext.videoLoaded) return;

    const id = this.videoContext.videoInteractionData.size + 1;

    // Case: User selected "Replace Interaction" from the dropdown
    if (e.detail.item.value == 1) {
      //turn back into map from object after being JSON.stringified
      this.videoContext.videoInteractionData = new Map(
        Object.entries(this.videoContext.videoInteractionData).map(
          ([key, value]) => [Number(key), value]
        )
      );

      //showReplaceSettings()
      this.replaceInteractionSettings.hidden = false;
      this.overlayInteractionSettings.hidden = true;

      // create WebWriter Video Interaction Element
      // const interaction = document.createElement(
      //   "webwriter-video-interaction"
      // ) as WwVideoInteraction;

      // interaction.setAttribute("id", `${id}`);

      // interaction.slot = "interaction-slot";

      // //append it to the dom
      // this.appendChild(interaction);

      //Add to videoInteractionData attribute

      //add to map
      this.videoContext.videoInteractionData = new Map([
        ...this.videoContext.videoInteractionData.entries(),
        [id, { isReplace: true, startTime: this.currentTime }],
      ]);

      //update replace settings UI and initialize timestamp to current time
      this.replaceTimestamp.value = formatTime(this.currentTime);

      //Save the config
      this.saveInteractionConfig();

      //this is now the active element (displays it in the drawer)
      this.changeActiveElement(id);
    }
    // Case: User selected "Overlay Interaction" from the dropdown
    else {
      this.showOverlaySettings();

      // create interaction and set videodata
      // const interaction = document.createElement(
      //   "webwriter-video-interaction"
      // ) as WwVideoInteraction;

      // interaction.setAttribute("id", `${id}`);

      // interaction.slot = "interaction-slot";

      // //append it to the dom
      // this.appendChild(interaction);

      //add to map
      this.videoContext.videoInteractionData = new Map([
        ...this.videoContext.videoInteractionData.entries(),
        [
          id,
          {
            isReplace: false,
            startTime: this.currentTime,
            endTime: this.currentTime + 5, // Default 5 seconds duration
            position: { x: 0, y: 0 },
            content: "Hello, World",
            size: { width: 100, height: 100 },
          },
        ],
      ]);

      //Save the config
      this.saveInteractionConfig();

      //this is now the active element (displays it in the drawer)
      this.changeActiveElement(id);

      //update overlay settings UI
      this.setOverlaySettingsContentFromVideoSetting();
    }
  };

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
        element.id === this.videoContext.activeElement
      ) {
        element.remove();
      }
    });
    this.videoContext.videoInteractionData.delete(
      this.videoContext.activeElement
    );

    //this.recalculateIndexes();
    this.saveInteractionConfig();
    this.closeDrawer();
    this.updateBaublePositions();
  }

  /**
   * Closes the drawer if the video is loaded.
   */
  closeDrawer() {
    if (!this.videoContext.videoLoaded) return;
    this.videoContext.overlayZIndex = 50;
    this.drawer.open = false;

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Toggles the replace interaction view to display the element across the whole screen
   */
  toggleInteractionView() {
    if (this.videoContext.interactionActive) {
      console.log("minimize");
      this.minimizeInteraction();
    } else {
      console.log("maximize");
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
    this.videoContext.interactionActive = false;
    //this.interactionContainer.style.transform = "translateX(7px)";

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Maximizes the interaction container and displays it on the screen.
   */
  maximizeInteraction = () => {
    this.drawer.open = true;
    this.videoContext.overlayZIndex = 0;
    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );

    //TODO: this references the wrong parent
    const rect = this.parentElement.getBoundingClientRect() as DOMRect;

    this.interactionContainer.style.position = "fixed";
    this.interactionContainer.style.zIndex = "1000";
    this.interactionContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.interactionContainer.style.display = "block";
    this.interactionContainer.style.color = "white";
    this.interactionContainer.style.fontSize = "2em";

    for (const key in rect) {
      this.interactionContainer.style[key] = `${rect[key]}px`;
    }

    //this.interactionContainer.style.transform = "translateX(-20px)";
    this.videoContext.interactionActive = true;
    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handles the change event for inputs in the content field of an overlay interaction.
   * Updates the content of the active element in the videoData object
   * and saves the interaction configuration.
   *
   * @param e - The custom event object.
   */
  handleOverlayContentChange(e: CustomEvent) {
    const textarea = e.target as SlTextarea;
    this.videoContext.videoInteractionData.get(
      this.videoContext.activeElement
    ).content = textarea.value;
    this.saveInteractionConfig();
  }

  /**
   * Handles the change event when the overlay color is changed.
   *
   * @param e - The custom event containing the color picker target.
   */
  handleOverlayColorChange(e: CustomEvent) {
    const colorPicker = e.target as SlColorPicker;
    const data = this.videoContext.videoInteractionData.get(
      this.videoContext.activeElement
    );
    if (data) {
      data.color = colorPicker.value;
      this.saveInteractionConfig();
    }
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
      const data = this.videoContext.videoInteractionData.get(
        this.videoContext.activeElement
      );
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
   * Handles the change even when inputting a new overlay size.
   *
   * @param e - The custom event containing the target element.
   */
  handleOverlaySizeChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value > 0) {
      const data = this.videoContext.videoInteractionData.get(
        this.videoContext.activeElement
      );
      data.size = data.size || { width: 100, height: 100 };
      data.size[input.label.toLowerCase() as "width" | "height"] = value;
      this.saveInteractionConfig();
    }
  }

  /**
   * Shows the overlay settings and hides the replace settings.
   */
  showOverlaySettings() {
    this.replaceInteractionSettings.hidden = true;
    this.overlayInteractionSettings.hidden = false;
  }

  /**
   * Sets the overlay settings content from the video setting.
   */
  setOverlaySettingsContentFromVideoSetting() {
    //turn back into map from object after being JSON.stringified
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
      // console.log("parse result", this.videoContext.videoInteractionData);
      this.requestUpdate();
    }

    console.log("overlay settings", this.videoContext.videoInteractionData);

    //
    const data = this.videoContext.videoInteractionData.get(
      this.videoContext.activeElement
    );

    console.log("activeElement", this.videoContext.activeElement);
    console.log(data);

    this.overlayStartTimeInput.value = formatTime(data.startTime);
    this.overlayEndTimeInput.value = formatTime(data.endTime);
    this.OverlayXPositionInput.value = `${data.position.x}`;
    this.OverlayYPositionInput.value = `${data.position.y}`;
    this.overlayContentInput.value = `${data.content}`;
    this.overlayWidthInput.value = `${data.size.width}`;
    this.overlayHeightInput.value = `${data.size.height}`;
  }

  /**
   * Saves the interaction configuration by converting the video data into a JSON string.
   * The resulting JSON string is assigned to the interactionConfig property.
   */
  saveInteractionConfig() {
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
    console.log("handleTimeInputChange");
    const input = e.target as SlInput;
    const newTime = parseTime(input.value);

    if (newTime !== null) {
      console.log("bauble");
      //update bauble time
      this.baubleTimeUpdateHelper(
        newTime,
        this.videoContext.activeElement,
        input
      );

      input.value = formatTime(newTime);
    } else {
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
    }
    // change bauble positions to reflect new time and request an update
    this.updateBaublePositions();
  };

  /**
   * Updates the positions of the baubles in the widget.
   */
  updateBaublePositions() {
    this.dispatchEvent(
      new CustomEvent("updateBaublePositions", {
        bubbles: true,
        composed: true,
      })
    );
    this.requestUpdate();
  }

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

    const data = this.videoContext.videoInteractionData.get(index);

    console.log("old entry", data);

    if (data) {
      if (input === this.overlayStartTimeInput) {
        data.startTime = newTime;
        if (newTime > data.endTime) {
          data.endTime = newTime + 5;
          this.overlayEndTimeInput.value = formatTime(data.endTime);
        }
      } else if (input === this.overlayEndTimeInput) {
        data.endTime = newTime;
      } else if (input === this.replaceTimestamp) {
        data.startTime = newTime;
      }

      this.saveInteractionConfig();
    }
  }

  /**
   * Changes the active element to the specified index.
   * @param newActive - The index of the new active element.
   */
  changeActiveElement(newActive: number) {
    this.videoContext.activeElement = newActive;
    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
      })
    );
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
   * Helper function for handling click event of baubles.
   *
   * @param id - The ID of the element that was clicked.
   * @remarks
   * This function is called when a bauble is clicked without the control button being held.
   * It changes the active element to the clicked element and updates the overlay settings with the corresponding data.
   */
  clickEventHelper(id: number) {
    this.changeActiveElement(id);
    const interactionData = this.videoContext.videoInteractionData.get(id);
    if (interactionData.isReplace) {
      this.replaceTimestamp.value = formatTime(interactionData.startTime);
      this.replaceInteractionSettings.hidden = false;
      this.overlayInteractionSettings.hidden = true;
    } else {
      // Update overlay settings inputs
      this.overlayStartTimeInput.value = formatTime(interactionData.startTime);
      this.overlayEndTimeInput.value = formatTime(interactionData.endTime);
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
      this.videoContext.overlayZIndex = 0;
      this.setAttribute("videoContext", JSON.stringify(this.videoContext));
    }
  }
}
