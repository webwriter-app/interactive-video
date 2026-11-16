/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { snippet, mount, mountEmpty, cleanup, blocks, mainBlock, settle, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<webwriter-interactive-video> data block", function () {
  this.timeout(30000);
  afterEach(cleanup);

  const mountExtra = () => mount(snippet.replace('"videoDetails"', '"extraKey":{"keep":true},"videoDetails"'));

  it("reads the block", async function () {
    const w: any = await mountExtra();
    assert.isTrue(w.videoDetails.duration === 61 && w.videoBase64.startsWith("data:video/"), JSON.stringify(w.videoDetails));
  });

  it("takes over the chapter seed and removes it", async function () {
    const w: any = await mountExtra();
    assert.isTrue(w.chapterConfig.length === 2 && !w.querySelector("[data-video-chapters]") && JSON.parse(mainBlock(w).textContent!).chapterConfig.length === 2);
  });

  it("writes a change and keeps unknown keys", async function () {
    const w: any = await mountExtra();
    w.chapterConfig = [...w.chapterConfig, { title: "Third", startTime: 50 }];
    w.updateContext();
    await settle(w);
    const stored = JSON.parse(mainBlock(w).textContent!);
    assert.isTrue(stored.chapterConfig.length === 3 && stored.extraKey?.keep === true && stored.videoBase64.startsWith("data:video/"), mainBlock(w).textContent!.slice(-200));
  });

  it("keeps slot=data on the block and has only one", async function () {
    const w: any = await mountExtra();
    w.chapterConfig = [...w.chapterConfig, { title: "Third", startTime: 50 }];
    w.updateContext();
    await settle(w);
    assert.isTrue(blocks(w).length === 1 && mainBlock(w).getAttribute("slot") === "data");
  });

  it("writes nothing for an unchanged state", async function () {
    const w: any = await mountExtra();
    w.chapterConfig = [...w.chapterConfig, { title: "Third", startTime: 50 }];
    w.updateContext();
    await settle(w);
    const before = mainBlock(w).textContent;
    w.updateContext();
    await settle(w);
    assert.isTrue(mainBlock(w).textContent === before && blocks(w).length === 1);
  });

  it("takes over a remote change of the block", async function () {
    const w: any = await mountExtra();
    const remote = JSON.parse(mainBlock(w).textContent!);
    remote.chapterConfig = [{ title: "Remote", startTime: 5 }];
    mainBlock(w).textContent = JSON.stringify(remote);
    await until(() => w.chapterConfig.length === 1 && w.chapterConfig[0].title === "Remote", "the widget to take over a remote change");
  });

  it("leaves the widget as it is for unreadable data", async function () {
    const w: any = await mountExtra();
    const remote = JSON.parse(mainBlock(w).textContent!);
    remote.chapterConfig = [{ title: "Remote", startTime: 5 }];
    mainBlock(w).textContent = JSON.stringify(remote);
    await until(() => w.chapterConfig.length === 1, "the widget to take over a remote change");
    mainBlock(w).textContent = "{ not json";
    await settle(w);
    assert.equal(w.chapterConfig.length, 1);
  });

  it("stores the four keys of an empty widget in a slot=data block", async function () {
    const w = await mountEmpty();
    await settle(w);
    const block = mainBlock(w);
    const stored = block ? JSON.parse(block.textContent!) : null;
    assert.isTrue(!!stored && ["videoBase64", "videoDetails", "chapterConfig"].every((k) => k in stored) && block.getAttribute("slot") === "data" && block.type === "application/json", block?.outerHTML);
  });
});

mocha.run();
