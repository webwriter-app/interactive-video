import type { ReactiveController } from "lit";
import { moveInteractionWindow, nextInteractionId } from "../model/timeline";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";
import type { WebwriterVideoInteraction } from "../widgets/webwriter-video-interaction";

/** The interactions slotted into the widget: when they show, where they sit, and how they react to the document changing. */
export class InteractionsController implements ReactiveController {
  #mutations: MutationObserver | null = null;
  #resize: ResizeObserver | null = null;
  #observedArea: Element | null = null;
  #frame = 0;
  #dismissed = new WeakSet<WebwriterVideoInteraction>();

  constructor(private host: WebwriterInteractiveVideo) {
    host.addController(this);
  }

  hostConnected() {
    this.#mutations = new MutationObserver(this.#handleMutations);
    this.#mutations.observe(this.host, {
      attributes: true,
      attributeFilter: ["class", "id", "starttime", "endtime", "noinitialpause"],
      subtree: true,
    });
    if (this.#observedArea) this.#resize?.observe(this.#observedArea);
  }

  hostDisconnected() {
    this.#mutations?.disconnect();
    this.#mutations = null;
    this.#resize?.disconnect();
    cancelAnimationFrame(this.#frame);
  }

  /** Follows the size of the player area; the interactions are scaled with it. */
  observeSize(area: Element) {
    this.#observedArea = area;
    // The new size changes the layout inside the area; applying it in the next frame keeps the browser from
    // reporting "ResizeObserver loop completed with undelivered notifications", and merges a burst into one update.
    this.#resize = new ResizeObserver((entries) => {
      const { width, height } = entries[entries.length - 1].contentRect;
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => {
        this.host.videoContainerWidth = width;
        this.host.videoContainerHeight = height;
        this.syncGeometry();
      });
    });
    this.#resize.observe(area);
    this.syncGeometry();
  }

  /** Hands the current player size to every interaction. */
  syncGeometry() {
    const area = this.host.videoAreaSize;
    const base = this.host.videoBaseSize;
    for (const interaction of this.host.videoInteractions) {
      interaction.parentWidth = area.width;
      interaction.parentHeight = area.height;
      interaction.videoBaseWidth = base.width;
      interaction.videoBaseHeight = base.height;
    }
  }

  /** Shows the interactions that are due at the current time and pauses for those that ask for it. */
  showPopups() {
    const { host } = this;
    if (!host.videoLoaded || host.hideInteractions) {
      this.hideAll();
      return;
    }

    const time = host.videoPlayer.currentTime;
    for (const interaction of host.videoInteractions) {
      const inWindow = time >= interaction.startTime && time <= interaction.endTime;
      if (!inWindow) {
        this.#dismissed.delete(interaction);
        interaction.hasPaused = false;
      }
      interaction.visible = inWindow && !this.#dismissed.has(interaction);
      if (interaction.visible && !interaction.noInitialPause && !interaction.hasPaused) {
        host.playback.pause();
        interaction.hasPaused = true;
      }
    }
  }

  hideAll() {
    this.#dismissed = new WeakSet();
    for (const interaction of this.host.videoInteractions) {
      interaction.visible = false;
      interaction.hasPaused = false;
    }
  }

  close(interaction: WebwriterVideoInteraction) {
    if (interaction.parentElement !== this.host) return;
    this.#dismissed.add(interaction);
    interaction.visible = false;
    if (this.host.selectedInteractionId === Number(interaction.id)) this.select(-1);
  }

  select(id: number) {
    this.host.selectedInteractionId = Number(id);
  }

  /** A click on the media clears the selection and toggles playback. */
  handleVideoClick = (event: MouseEvent) => {
    if (event.composedPath().some((node) => node instanceof Element
      && node.localName === "webwriter-video-interaction")) return;
    this.select(-1);
    this.host.playback.toggle();
  };

  /** A click on an interaction's bauble in the progress bar pauses at the interaction and selects it. */
  clickBauble(id: number) {
    const interaction = this.#find(id);
    if (!interaction) return;
    this.#dismissed.delete(interaction);
    this.host.playback.pause();
    this.host.videoPlayer.currentTime = interaction.startTime;
    this.host.requestUpdate();
    this.select(id);
  }

  /** Moves an interaction to a new start time; it keeps its length unless it would end after the media. */
  retime(newTime: number, id: number) {
    const { host } = this;
    const interaction = this.#find(id);
    if (!interaction) return;
    const moved = moveInteractionWindow(interaction.startTime, interaction.endTime, newTime, host.videoPlayer.duration);

    interaction.startTime = moved.startTime;
    interaction.setAttribute("startTime", String(moved.startTime));
    interaction.endTime = moved.endTime;
    interaction.setAttribute("endTime", String(moved.endTime));

    host.videoPlayer.currentTime = interaction.startTime;
    host.updateContext();
  }

  /** Adds an interaction that lasts five seconds from the current time, or the given span; a text becomes its first paragraph. */
  add(time = this.host.videoPlayer.currentTime, length = 5, text?: string) {
    const { host } = this;
    const id = nextInteractionId(host.videoInteractions.map((interaction) => Number(interaction.id)));
    const interaction = host.ownerDocument.createElement("webwriter-video-interaction") as WebwriterVideoInteraction;
    const base = host.videoBaseSize;

    interaction.setAttribute("posY", "25");
    interaction.setAttribute("posX", "25");
    interaction.setAttribute("width", `${base.width / 2}`);
    interaction.setAttribute("height", `${base.height / 2}`);

    interaction.setAttribute("id", `${id}`);
    interaction.setAttribute("startTime", `${time}`);
    interaction.setAttribute("endTime", `${time + length}`);

    const paragraph = host.ownerDocument.createElement("p");
    paragraph.textContent = text ?? "";
    interaction.append(paragraph);

    host.appendChild(interaction);
    return interaction;
  }

  #find(id: number) {
    return this.host.videoInteractions.find((interaction) => Number(interaction.id) === Number(id));
  }

  #handleMutations = (mutations: MutationRecord[]) => {
    if (mutations.some(({ target, attributeName }) => target === this.host && attributeName === "class")) {
      this.host.fullscreen.update();
    }
    if (mutations.some(({ target, attributeName }) =>
      attributeName !== "class" && target instanceof Element &&
      target.parentElement === this.host && target.localName === "webwriter-video-interaction"
    )) {
      this.host.updateBaublePositions();
      this.host.requestUpdate();
    }
  };
}
