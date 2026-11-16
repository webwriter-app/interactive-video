import type { ReactiveController } from "lit";
import { moveInteractionWindow, nextInteractionId } from "../model/timeline";
import type { WebwriterInteractiveVideo } from "../widgets/webwriter-interactive-video";
import type { WebwriterVideoInteraction } from "../widgets/webwriter-video-interaction";

/** The interactions slotted into the widget: when they show, where they sit, and how they react to the document changing. */
export class InteractionsController implements ReactiveController {
  #mutations: MutationObserver | null = null;
  #resize: ResizeObserver | null = null;
  #observedArea: Element | null = null;

  constructor(private host: WebwriterInteractiveVideo) {
    host.addController(this);
  }

  hostConnected() {
    this.#mutations = new MutationObserver(this.#handleMutations);
    this.#mutations.observe(this.host, {
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    if (this.#observedArea) this.#resize?.observe(this.#observedArea);
  }

  hostDisconnected() {
    this.#mutations?.disconnect();
    this.#mutations = null;
    this.#resize?.disconnect();
  }

  /** Follows the size of the player area; the interactions are scaled with it. */
  observeSize(area: Element) {
    this.#observedArea = area;
    this.#resize = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.host.videoContainerWidth = entry.contentRect.width;
        this.host.videoContainerHeight = entry.contentRect.height;
        this.syncGeometry();
      }
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
    if (host.hideInteractions) return;

    for (const interaction of host.videoInteractions) {
      const time = host.videoPlayer.currentTime;
      if (time >= interaction.startTime && time <= interaction.endTime) {
        interaction.style.display = "block";

        if (!interaction.noInitialPause && !interaction.hasPaused) {
          host.playback.pause();
          interaction.hasPaused = true;
        }
      } else {
        interaction.style.display = "none";
        interaction.hasPaused = false;
      }
    }
  }

  hideAll() {
    for (const interaction of this.host.videoInteractions) {
      interaction.style.display = "none";
      interaction.hasPaused = false;
    }
  }

  select(id: number) {
    this.host.selectedInteractionId = id;
    this.host.updateContext();
  }

  /** A click on the media clears the selection, unless it hit an interaction. */
  handleVideoClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("webwriter-video-interaction")) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }
    this.select(-1);
  };

  /** A click on an interaction's bauble in the progress bar pauses at the interaction and selects it. */
  clickBauble(id: number) {
    this.host.playback.pause();
    const interaction = this.#find(id);
    this.host.videoPlayer.currentTime = interaction.startTime;
    this.host.requestUpdate();
    this.select(id);
  }

  /** Moves an interaction to a new start time; it keeps its length unless it would end after the media. */
  retime(newTime: number, id: number) {
    const { host } = this;
    const interaction = this.#find(id);
    const moved = moveInteractionWindow(interaction.startTime, interaction.endTime, newTime, host.videoPlayer.duration);

    interaction.startTime = moved.startTime;
    interaction.setAttribute("startTime", String(moved.startTime));
    interaction.endTime = moved.endTime;
    interaction.setAttribute("endTime", String(moved.endTime));

    host.videoPlayer.currentTime = interaction.startTime;
    host.updateContext();
  }

  /** Adds an interaction at the current time that lasts five seconds. */
  add() {
    const { host } = this;
    const id = nextInteractionId(host.videoInteractions.map((interaction) => Number(interaction.id)));
    const interaction = document.createElement("webwriter-video-interaction") as WebwriterVideoInteraction;
    const area = host.videoAreaSize;
    const base = host.videoBaseSize;
    const time = host.videoPlayer.currentTime;

    interaction.setAttribute("parentWidth", `${area.width}`);
    interaction.setAttribute("parentHeight", `${area.height}`);
    interaction.setAttribute("videoBaseWidth", `${base.width}`);
    interaction.setAttribute("videoBaseHeight", `${base.height}`);

    interaction.setAttribute("posY", "25");
    interaction.setAttribute("posX", "25");
    interaction.setAttribute("width", `${area.width / 2}`);
    interaction.setAttribute("height", `${area.height / 2}`);

    interaction.setAttribute("id", `${id}`);
    interaction.setAttribute("startTime", `${time}`);
    interaction.setAttribute("endTime", `${time + 5}`);

    host.appendChild(interaction);
    // Renders the bauble.
    host.updateContext();
  }

  #find(id: number) {
    return this.host.videoInteractions.filter((interaction) => Number(interaction.id) === Number(id))[0];
  }

  #handleMutations = (mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        this.host.fullscreen.update();
      }

      if (mutation.type === "childList") {
        for (const node of mutation.removedNodes) {
          const element = node as HTMLElement;
          const isWidget = element.classList?.contains("ww-widget");
          // The ProseMirror class confirms that the user has the element selected.
          const isSelectedNode = element.classList?.contains("ProseMirror-selectednode");

          if (isWidget && isSelectedNode && element.nodeName.toLowerCase() === "webwriter-video-interaction") {
            this.host.updateContext();
          }
        }
      }
    }
  };
}
