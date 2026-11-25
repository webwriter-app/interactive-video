/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { WebwriterInteractiveVideo as Widget } from "../src/widgets/webwriter-interactive-video";
import { mount, mountEmpty, cleanup, settle, until } from "./helpers";
import { parseWebVtt, toWebVtt } from "../src/model/webvtt";
import { validVtt, noHeaderVtt, noCuesVtt } from "./fixtures";

mocha.setup(getMochaConfig());

/** A cue keeps milliseconds. */
const ms = (seconds: number) => Math.round(seconds * 1000) / 1000;
const from = Widget.convertFrom as Record<string, (this: any, input: any) => any>;
const to = Widget.convertTo as Record<string, (this: any) => any>;
const vtt = (text: string, name = "cues.vtt") => new File([text], name, { type: "text/vtt" });

describe("<webwriter-interactive-video> WebVTT", function () {
  this.timeout(30000);
  afterEach(cleanup);

  it("parses chapters and interaction cues, skips notes and strips tags", function () {
    const { chapters, interactions } = parseWebVtt(validVtt);
    assert.deepEqual(chapters, [{ title: "Intro", startTime: 0 }, { title: "Descent", startTime: 20 }]);
    assert.deepEqual(interactions.map((i) => [i.id, i.startTime, i.endTime, i.text]), [["0", 10.5, 15, "Neil Armstrong"], ["7", 40, 45, "A new question"]]);
  });

  it("rejects a file without header and a file without cues", function () {
    assert.throws(() => parseWebVtt(noHeaderVtt));
    assert.throws(() => parseWebVtt(noCuesVtt));
  });

  it("writes and reads the same cues", function () {
    const content = { chapters: [{ title: "A", startTime: 0 }, { title: "B", startTime: 12.25 }], interactions: [{ id: "3", startTime: 1, endTime: 4.5, text: "Q?" }] };
    assert.deepEqual(parseWebVtt(toWebVtt(content, 60)), content);
  });

  it("exports the widget as a .vtt file", async function () {
    const w: any = await mount();
    const file = await to["text/vtt"].call(w);
    assert.match(file.name, /\.vtt$/);
    assert.equal(file.type, "text/vtt");
    const { chapters, interactions } = parseWebVtt(await file.text());
    assert.equal(chapters.length, 2);
    assert.equal(interactions[0].id, "0");
    assert.include(interactions[0].text, "Neil Armstrong");
  });

  it("an invalid file fails with a message and changes nothing", async function () {
    const w: any = await mount();
    const before = JSON.stringify(w.chapterConfig);
    let message = "";
    try { await from[".vtt"].call(w, vtt(noHeaderVtt)); } catch (error: any) { message = error.message; }
    assert.isAbove(message.length, 0);
    assert.equal(JSON.stringify(w.chapterConfig), before);
  });

  it("an import replaces chapters, retimes a matching interaction and adds the other", async function () {
    const w: any = await mount();
    const apply = await from[".vtt"].call(w, vtt(validVtt));
    const count = w.querySelectorAll("webwriter-video-interaction").length;
    apply();
    await settle(w);
    assert.deepEqual(w.chapterConfig.map((c: any) => c.title), ["Intro", "Descent"]);
    const all = [...w.querySelectorAll("webwriter-video-interaction")] as any[];
    assert.equal(all.length, count + 1);
    assert.equal(Number(all.find((i) => i.id == 0).startTime), 10.5);
    const added = all.find((i) => i.textContent.includes("A new question"));
    assert.equal(added.textContent.trim(), "A new question");
    assert.equal(added.getAttribute("endTime"), "45");
  });

  it("export then import gives the same chapters and interaction times", async function () {
    const w: any = await mount();
    const chapters = JSON.stringify(w.chapterConfig);
    const times = [...w.querySelectorAll("webwriter-video-interaction")].map((i: any) => [i.id, ms(i.startTime), ms(i.endTime)]);
    (await from[".vtt"].call(w, await to["text/vtt"].call(w)))();
    await settle(w);
    assert.equal(JSON.stringify(w.chapterConfig), chapters);
    assert.deepEqual([...w.querySelectorAll("webwriter-video-interaction")].map((i: any) => [i.id, ms(i.startTime), ms(i.endTime)]), times);
  });
});

describe("<webwriter-interactive-video> native media conversions", function () {
  this.timeout(30000);
  afterEach(cleanup);

  const fragment = (html: string) => { const t = document.createElement("template"); t.innerHTML = html; return t.content; };

  it("takes the source of a video element", async function () {
    const w: any = await mountEmpty();
    assert.notEqual(from.video.call(w, fragment('<video src="https://example.com/clip.mp4" title="Clip"></video>')), false);
    assert.equal(w.videoURL, "https://example.com/clip.mp4");
    assert.equal(w.videoDetails.title, "Clip");
  });

  it("takes a source element and an audio element", async function () {
    const w: any = await mountEmpty();
    assert.notEqual(from.video.call(w, fragment('<audio controls><source src="data:audio/wav;base64,AAAA"></audio>')), false);
    assert.equal(w.videoType, "htmlaudio");
    assert.isTrue(w.videoBase64.startsWith("data:audio/"));
  });

  it("declines an element without a source", async function () {
    const w: any = await mountEmpty();
    assert.isFalse(from.video.call(w, fragment("<video></video>")));
    assert.equal(w.videoURL, "");
  });

  it("becomes a video element with controls, and no audio element", async function () {
    const w: any = await mount();
    const video = to.video.call(w);
    assert.equal(video.localName, "video");
    assert.isTrue(video.hasAttribute("controls"));
    assert.isTrue(video.getAttribute("src").startsWith("data:video/"));
    assert.isNull(to.audio.call(w));
  });

  it("has no element for a link to a video platform or without media", async function () {
    const w: any = await mountEmpty();
    assert.isNull(to.video.call(w));
    w.videoURL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
    w.videoType = "youtube";
    assert.isNull(to.video.call(w));
  });

  it("the element goes in and comes out with the same source", async function () {
    const w: any = await mountEmpty();
    from.video.call(w, fragment('<video src="https://example.com/clip.mp4"></video>'));
    w.videoType = "htmlvideo";
    assert.equal(to.video.call(w).getAttribute("src"), "https://example.com/clip.mp4");
  });
});

describe("<webwriter-interactive-video> signals", function () {
  this.timeout(30000);
  afterEach(cleanup);

  it("publishes the time and the chapter, stable and read only", async function () {
    const w: any = await mount();
    const { time, chapter } = w.signals;
    assert.strictEqual(w.signals.time, time);
    assert.isUndefined(time.set);
    w.videoPlayer.currentTime = 40;
    await until(() => time.get() > 39, "the time to be published");
    assert.equal(chapter.get(), "Stepping down the ladder");
    w.videoPlayer.currentTime = 5;
    await until(() => chapter.get() === "Start", "the first chapter");
  });

  it("updates the chapter signal when chapters or visibility change while paused", async function () {
    const w: any = await mount();
    w.chapterConfig = [{ title: "Renamed", startTime: 0 }];
    await until(() => w.signals.chapter.get() === "Renamed", "the renamed chapter");
    w.hideChapters = true;
    await until(() => w.signals.chapter.get() === "", "no chapter while hidden");
  });

  it("round trips options through attributes", async function () {
    const w: any = await mount();
    w.hideInteractions = true;
    w.disablePlaybackRateChange = true;
    await w.updateComplete;
    assert.isTrue(w.hasAttribute("hide-interactions"));
    assert.isTrue(w.hasAttribute("disable-playback-rate-change"));
    w.removeAttribute("hide-interactions");
    await w.updateComplete;
    assert.isFalse(w.hideInteractions);
  });

  it("publishes no chapter while the chapters are hidden", async function () {
    const w: any = await mount();
    w.hideChapters = true;
    w.playback.publishTime(40);
    assert.equal(w.signals.chapter.get(), "");
    assert.equal(w.signals.time.get(), 40);
  });
});

mocha.run();
