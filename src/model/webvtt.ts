import type { Chapter } from "./timeline";

/** An interaction as WebVTT can carry it: its time window and the text of its content. */
export type VttInteraction = { id: string; startTime: number; endTime: number; text: string };

export type VttContent = { chapters: Chapter[]; interactions: VttInteraction[] };

/** The cue identifier prefix that marks a cue as an interaction. Every other cue is a chapter. */
export const INTERACTION_CUE = "interaction-";

/** The reason an import failed, for the caller to turn into a localized message. */
export class WebVttError extends Error {
  constructor(readonly reason: "header" | "empty") {
    super(reason);
  }
}

/** A WebVTT timestamp: hh:mm:ss.mmm. */
export function formatCueTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds * 1000));
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return `${pad(Math.floor(total / 3600000))}:${pad(Math.floor(total / 60000) % 60)}:${pad(Math.floor(total / 1000) % 60)}.${pad(total % 1000, 3)}`;
}

const TIMESTAMP = /^(?:(\d{1,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$/;

function parseCueTime(value: string): number | null {
  const match = TIMESTAMP.exec(value.trim());
  if (!match) return null;
  return Number(match[1] ?? 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

/** A cue payload cannot contain a blank line or the arrow, so both are flattened. */
function cueText(text: string): string {
  return text.replace(/-->/g, "->").replace(/\s*\n\s*/g, " ").trim();
}

/**
 * Writes chapters and interactions as a WebVTT file. A chapter lasts until the next one starts (the last one until the end of the media);
 * an interaction is a cue with the identifier `interaction-<id>` and the text of its content.
 */
export function toWebVtt({ chapters, interactions }: VttContent, duration: number): string {
  const sorted = [...chapters].sort((a, b) => a.startTime - b.startTime);
  const blocks = ["WEBVTT"];
  sorted.forEach((chapter, index) => {
    const end = sorted[index + 1]?.startTime ?? Math.max(duration, chapter.startTime + 1);
    blocks.push(`${index + 1}\n${formatCueTime(chapter.startTime)} --> ${formatCueTime(end)}\n${cueText(chapter.title) || `Chapter ${index + 1}`}`);
  });
  for (const interaction of interactions) {
    const end = Math.max(interaction.endTime, interaction.startTime);
    blocks.push(`${INTERACTION_CUE}${interaction.id}\n${formatCueTime(interaction.startTime)} --> ${formatCueTime(end)}\n${cueText(interaction.text) || "Interaction"}`);
  }
  return blocks.join("\n\n") + "\n";
}

/** Reads a WebVTT file. Cues that are not valid are skipped; a file without the header or without any usable cue is rejected. */
export function parseWebVtt(source: string): VttContent {
  const lines = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  if (!/^WEBVTT(?:[ \t].*)?$/.test(lines[0] ?? "")) throw new WebVttError("header");

  const chapters: Chapter[] = [];
  const interactions: VttInteraction[] = [];
  for (const block of lines.slice(1).join("\n").split(/\n{2,}/)) {
    const rows = block.replace(/^\n+/, "").split("\n");
    const timing = rows.findIndex((row) => row.includes("-->"));
    if (timing < 0 || timing > 1 || /^(NOTE|STYLE|REGION)\b/.test(rows[0])) continue;
    const [from, rest = ""] = rows[timing].split("-->");
    const startTime = parseCueTime(from);
    const endTime = parseCueTime(rest.trim().split(/\s+/)[0] ?? "");
    if (startTime === null || endTime === null || endTime < startTime) continue;
    const id = timing === 1 ? rows[0].trim() : "";
    const text = rows.slice(timing + 1).join(" ").replace(/<[^>]*>/g, "").trim();
    if (id.startsWith(INTERACTION_CUE)) interactions.push({ id: id.slice(INTERACTION_CUE.length), startTime, endTime, text });
    else chapters.push({ title: text, startTime });
  }
  if (!chapters.length && !interactions.length) throw new WebVttError("empty");
  return { chapters, interactions };
}
