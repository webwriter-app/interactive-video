import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import {
  SlDrawer,
  SlInput,
  SlButton,
  SlIcon,
  SlIconButton,
  SlSwitch,
} from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";

import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { formatTime, parseTime } from "../../utils/timeFormatter";

import { consume } from "@lit/context";

import styles from "./video-chapter-drawer.styles";

import bookmarks from "@tabler/icons/outline/plus.svg";
import jumpTo from "@tabler/icons/filled/player-track-next.svg";

import trash from "@tabler/icons/outline/trash.svg";
import { msg } from "@lit/localize";

//Tabler

export class VideoChapterDrawer extends LitElementWw {
  @consume({ context: videoContext, subscribe: true })
  accessor videoContext: InteractiveVideoContext;

  @query("#chapters-drawer") accessor drawer: SlDrawer;

  /*

  */
  static get scopedElements() {
    return {
      "sl-drawer": SlDrawer,
      "sl-input": SlInput,
      "sl-button": SlButton,
      "sl-icon": SlIcon,
      "sl-icon-button": SlIconButton,
      "sl-switch": SlSwitch,
    };
  }

  //import CSS
  static styles = [styles];

  /*

  */

  /*

  */
  firstUpdated() {}

  /**
   * Renders the chapters drawer.
   *
   * @returns {TemplateResult} the rendered HTML for the chapters drawer, filled with the chapters list and an add chapter button (if content is editable).
   */
  render() {
    const chapters = this.videoContext.chapterConfig;

    return html`
      <sl-drawer contained label=${msg("Chapters")} id="chapters-drawer">
        <!-- class="author-only" -->
        ${this.isContentEditable
          ? html`
              <sl-button
                style="margin-left: auto"
                slot="footer"
                @click=${() =>
                  this.dispatchEvent(
                    new CustomEvent("addChapter", {
                      bubbles: true,
                      composed: true,
                    })
                  )}
              >
                <sl-icon slot="prefix" src=${bookmarks}></sl-icon>
                ${msg("Add")}</sl-button
              >
            `
          : null}
        <ul class="chapter-list">
          ${chapters.map(
            (chapter, index) => html`
              <li class="chapter-item">
                ${this.isContentEditable
                  ? html`
                      <!-- Render Chapter Title-->
                      <sl-input
                        size="small"
                        label=${msg("Title")}
                        value=${chapter.title}
                        @sl-change=${(e) =>
                          this.updateChapterTitle(index, e.target.value)}
                      >
                      </sl-input>

                      <!-- Render chapter card with an input field to change start time-->
                      <sl-input
                        pill
                        class="timeInput"
                        size="small"
                        label=${msg("Start")}
                        style="width: 65px"
                        value=${formatTime(chapter.startTime)}
                        @sl-change=${(e) =>
                          this.handleTimeInputChange(e, index)}
                        ?disabled=${index === 0 ? true : false}
                      ></sl-input>

                      <!-- Delete button for all but the first chapter -->
                      ${index > 0
                        ? html` <div
                            style="display: flex; flex-direction: row; align-items: center;"
                          >
                            <sl-button
                              variant="text"
                              style="margin-right: auto"
                              @click=${() => this.jumpToChapter(index)}
                              >${msg("Skip to Chapter")}
                              <sl-icon slot="prefix" src=${jumpTo}></sl-icon>
                            </sl-button>
                            <sl-icon-button
                              src=${trash}
                              @click=${() => this.deleteChapter(index)}
                            ></sl-icon-button>
                          </div>`
                        : html`<sl-button
                            variant="text"
                            @click=${() => this.jumpToChapter(index)}
                            >${msg("Skip to Chapter")}
                            <sl-icon slot="prefix" src=${jumpTo}></sl-icon>
                          </sl-button>`}
                    `
                  : html`
                      <!-- If content is not editable, just display chapter information -->
                      <div class="chapter-info">
                        <p><strong>${chapter.title}</strong></p>
                        <div
                          style="display: flex; flex-direction: row; align-items: center; "
                        >
                          <p>${formatTime(chapter.startTime)}</p>
                          <sl-button
                            variant="text"
                            @click=${() => this.jumpToChapter(index)}
                            >${msg("Skip to Chapter")}
                            <sl-icon slot="prefix" src=${jumpTo}></sl-icon>
                          </sl-button>
                        </div>
                      </div>
                    `}
              </li>
            `
          )}
        </ul>
      </sl-drawer>
    `;
  }

  /**
   * Updates the title of a chapter at the specified index.
   *
   * @param index - The index of the chapter to update.
   * @param newTitle - The new title for the chapter.
   */
  updateChapterTitle(index: number, newTitle: string) {
    const chapters = this.videoContext.chapterConfig;
    chapters[index].title = newTitle;
    this.updateChapters(chapters);
  }

  /**
   * Deletes a chapter from the chapter configuration.
   *
   * @param index - The index of the chapter to delete.
   */
  deleteChapter(index: number) {
    const chapters = this.videoContext.chapterConfig;
    chapters.splice(index, 1);
    this.updateChapters(chapters);
  }

  /**
   * Jumps to a specific chapter in the interactive video.
   * @param index - The index of the chapter to jump to.
   */
  jumpToChapter(index: number) {
    const chapters = this.videoContext.chapterConfig;
    if (chapters[index]) {
      this.dispatchEvent(
        new CustomEvent("jumpToChapter", {
          detail: { startTime: chapters[index].startTime },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Adds a new chapter to the interactive video.
   * The new chapter is appended to the end of the chapter list.
   */
  addChapter(duration) {
    const chapters = this.videoContext.chapterConfig;

    const lastChapter = chapters[chapters.length - 1];
    const newStartTime = lastChapter
      ? Math.min(lastChapter.startTime + 60, duration)
      : 0;
    chapters.push({
      title: `${msg("Chapter")} ${chapters.length + 1}`,
      startTime: newStartTime,
    });
    this.updateChapters(chapters);
  }

  /**
   * Updates the chapters of the interactive video, sorting them by start time.
   *
   * @param chapters - An array of chapters to update.
   */
  updateChapters(chapters: any[]) {
    chapters.sort((a, b) => a.startTime - b.startTime);

    this.dispatchEvent(
      new CustomEvent("setChapterConfig", {
        bubbles: true,
        composed: true,
        detail: { value: chapters },
      })
    );

    this.requestUpdate();
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
    const newTime = parseTime(input.value);

    if (newTime !== null) {
      // an index is only passed if the time input is for a chapter
      if (index !== undefined) {
        //update chapter time
        this.updateChapterTime(index, newTime);
      }
      input.value = formatTime(newTime);
    } else {
      input.helpText = msg("Invalid time format. Use hh:mm:ss or mm:ss");
    }
    // change bauble positions to reflect new time and request an update
    // this.updateBaublePositions();
  };

  /**
   * Updates the start time of a chapter at the specified index.
   *
   * @param index - The index of the chapter to update.
   * @param newTime - The new start time for the chapter.
   */
  updateChapterTime(index: number, newTime: number) {
    if (index === 0) return;
    let chapters = this.videoContext.chapterConfig;
    chapters[index].startTime = newTime;
    this.updateChapters(chapters);
  }

  /**
   * Closes the chapters drawer.
   */
  close() {
    this.drawer.hide();
  }
}
