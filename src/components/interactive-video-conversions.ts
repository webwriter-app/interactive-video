import { parseWebVtt, toWebVtt, WebVttError, type VttContent } from "../model/webvtt";
import type { WebwriterInteractiveVideo as Host } from "../widgets/webwriter-interactive-video";

/** Takes over the source of a `video` or `audio` element. Declines an element without a source. */
export function loadMediaElement(this: Host, fragment: DocumentFragment): boolean {
  const media = fragment.querySelector("video, audio");
  const source = media?.getAttribute("src") || media?.querySelector("source[src]")?.getAttribute("src");
  if (!media || !source) return false;
  this.videoDetails = { title: media.getAttribute("title") ?? "", author: "", duration: 0 };
  if (source.startsWith("data:")) {
    this.videoBase64 = source;
    this.videoURL = "";
    this.videoType = media.localName === "audio" ? "htmlaudio" : "htmlvideo";
    if (this.hasUpdated) this.loading.setupBase64(source);
  } else {
    const url = new URL(source, this.ownerDocument.baseURI).href;
    this.videoBase64 = "";
    this.videoURL = url;
    if (this.hasUpdated) this.loading.setupURL(url);
  }
  if (this.isConnected) this.updateContext();
  return true;
}

/** A native element for a media file or a direct link; links to a video platform have none. */
function mediaElement(host: Host, tag: "video" | "audio"): HTMLMediaElement | null {
  const source = host.videoBase64 || (["htmlvideo", "htmlaudio"].includes(host.videoType) ? host.videoURL : "");
  if (!source) return null;
  const audio = host.videoBase64 ? source.startsWith("data:audio") : host.videoType === "htmlaudio";
  if ((tag === "audio") !== audio) return null;
  const element = host.ownerDocument.createElement(tag);
  element.setAttribute("controls", "");
  element.setAttribute("src", source);
  if (host.videoDetails.title) element.setAttribute("title", host.videoDetails.title);
  return element;
}

export function toVideoElement(this: Host): HTMLVideoElement | null {
  return mediaElement(this, "video") as HTMLVideoElement | null;
}

export function toAudioElement(this: Host): HTMLAudioElement | null {
  return mediaElement(this, "audio") as HTMLAudioElement | null;
}

/** Chapters and interactions as WebVTT. */
export function exportWebVtt(this: Host): File {
  const duration = this.videoDetails.duration || this.videoPlayer?.duration || 0;
  const interactions = (this.videoInteractions ?? []).map((interaction) => ({
    id: String(interaction.id),
    startTime: Number(interaction.startTime),
    endTime: Number(interaction.endTime),
    text: interaction.textContent ?? "",
  }));
  const text = toWebVtt({ chapters: this.chapterConfig, interactions }, Number.isFinite(duration) ? duration : 0);
  const name = (this.videoDetails.title || "interactive-video").replace(/\.[^.]*$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "interactive-video";
  return new File([text], `${name}.vtt`, { type: "text/vtt" });
}

/** Reads and checks the whole file; the returned function changes the widget. */
export async function importWebVtt(this: Host, file: File): Promise<() => void> {
  let content: VttContent;
  try {
    content = parseWebVtt(await file.text());
  } catch (error) {
    if (!(error instanceof WebVttError)) throw error;
    throw new Error(error.reason === "header" ? this.msg("This is not a WebVTT file.") : this.msg("The file has no chapters or interactions."));
  }
  return () => applyWebVtt(this, content);
}

function applyWebVtt(host: Host, { chapters, interactions }: VttContent) {
  if (chapters.length) {
    host.chapterConfig = [...chapters]
      .sort((a, b) => a.startTime - b.startTime)
      .map(({ title, startTime }, index) => ({ title: title || `${host.msg("Chapter")} ${index + 1}`, startTime }));
  }
  for (const cue of interactions) {
    const existing = host.videoInteractions.find((interaction) => String(interaction.id) === cue.id);
    if (existing) {
      existing.startTime = cue.startTime;
      existing.setAttribute("startTime", String(cue.startTime));
      existing.endTime = cue.endTime;
      existing.setAttribute("endTime", String(cue.endTime));
    } else {
      host.interactions.add(cue.startTime, Math.max(cue.endTime - cue.startTime, 1), cue.text);
    }
  }
  host.updateContext();
}
