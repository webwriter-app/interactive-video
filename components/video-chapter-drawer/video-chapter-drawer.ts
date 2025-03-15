import { html, css, LitElement, PropertyValues } from "lit";

import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";

import { SlDrawer, SlInput, SlButton } from "@shoelace-style/shoelace";
import {
  videoContext,
  InteractiveVideoContext,
} from "../../utils/interactive-video-context";

import { formatTime, parseTime } from "../../utils/timeFormatter";

import { consume } from "@lit/context";

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
    };
  }

  /*

  */
  static get styles() {
    return css`
      .chapter-list {
        list-style-type: none;
        padding: 0;
      }

      .chapter-item {
        margin-bottom: 1rem;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .chapter-item sl-input {
        margin-bottom: 0.5rem;
      }

      .chapter-item sl-button {
        margin-right: 0.5rem;
      }

      .chapter-info {
        margin-bottom: 0.5rem;
      }

      :host(:not([contenteditable="true"]):not([contenteditable=""]))
        .author-only {
        display: none;
      }
    `;
  }

  /*

  */
  firstUpdated() {
    console.log("chapterConfig", this.videoContext.chapterConfig);
  }

  /**
   * Renders the chapters drawer.
   *
   * @returns {TemplateResult} the rendered HTML for the chapters drawer, filled with the chapters list and an add chapter button (if content is editable).
   */
  render() {
    const chapters = JSON.parse(this.videoContext.chapterConfig);

    return html`
      <sl-drawer contained label="Chapters" id="chapters-drawer">
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
                              value=${formatTime(chapter.startTime)}
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
                        ${formatTime(chapter.startTime)}
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

        <!-- class="author-only" -->
        ${this.isContentEditable
          ? html`<sl-button
              @click=${() =>
                this.dispatchEvent(
                  new CustomEvent("addChapter", {
                    bubbles: true,
                    composed: true,
                  })
                )}
              >Add Chapter</sl-button
            >`
          : null}
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
    const chapters = JSON.parse(this.videoContext.chapterConfig);
    chapters[index].title = newTitle;
    this.updateChapters(chapters);
  }

  /**
   * Deletes a chapter from the chapter configuration.
   *
   * @param index - The index of the chapter to delete.
   */
  deleteChapter(index: number) {
    const chapters = JSON.parse(this.videoContext.chapterConfig);
    chapters.splice(index, 1);
    this.updateChapters(chapters);
  }

  /**
   * Jumps to a specific chapter in the interactive video.
   * @param index - The index of the chapter to jump to.
   */
  jumpToChapter(index: number) {
    const chapters = JSON.parse(this.videoContext.chapterConfig);
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
    const chapters = JSON.parse(this.videoContext.chapterConfig);

    const lastChapter = chapters[chapters.length - 1];
    const newStartTime = lastChapter
      ? Math.min(lastChapter.startTime + 60, duration)
      : 0;
    chapters.push({
      title: `Chapter ${chapters.length + 1}`,
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
    this.videoContext.chapterConfig = JSON.stringify(chapters);

    this.dispatchEvent(
      new CustomEvent("updateContext", {
        bubbles: true,
        composed: true,
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
      input.helpText = "Invalid time format. Use hh:mm:ss or mm:ss";
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
    let chapters = JSON.parse(this.videoContext.chapterConfig);
    chapters[index].startTime = newTime;
    this.updateChapters(chapters);
  }
}
