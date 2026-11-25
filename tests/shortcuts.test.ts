/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { mount, cleanup, bar, key } from "./helpers";

mocha.setup(getMochaConfig());

for (const edit of [false, true]) describe(`<webwriter-interactive-video> shortcuts in ${edit ? "edit" : "read"} mode`, function () {
  this.timeout(30000);
  let w: any, player: HTMLVideoElement, at: Element;

  before(async function () {
    w = await mount(undefined, edit);
    player = w.videoPlayer;
    at = w.shadowRoot.querySelector("#container-video");
  });
  after(cleanup);

  function stubToggle() {
    const state = { plays: 0, toggle: w.playback.toggle };
    w.playback.toggle = function () { state.plays++; };
    return state;
  }

  for (const [name, init] of [["Space", { key: " ", code: "Space" }], ["k", { key: "k", code: "KeyK" }]] as const) {
    it(`${name} toggles playback`, function () {
      const state = stubToggle();
      const event = key(at, init);
      w.playback.toggle = state.toggle;
      assert.isTrue(state.plays === 1 && event.defaultPrevented);
    });
  }

  it("ArrowRight skips 5 s forward", function () {
    player.currentTime = 20;
    key(at, { key: "ArrowRight", code: "ArrowRight" });
    assert.isBelow(Math.abs(player.currentTime - 25), 0.5, String(player.currentTime));
  });

  it("ArrowLeft skips 5 s back", function () {
    player.currentTime = 25;
    key(at, { key: "ArrowLeft", code: "ArrowLeft" });
    assert.isBelow(Math.abs(player.currentTime - 20), 0.5, String(player.currentTime));
  });

  it("L skips 10 s forward", function () {
    player.currentTime = 20;
    key(at, { key: "l", code: "KeyL" });
    assert.isBelow(Math.abs(player.currentTime - 30), 0.5, String(player.currentTime));
  });

  it("J skips 10 s back", function () {
    player.currentTime = 30;
    key(at, { key: "j", code: "KeyJ" });
    assert.isBelow(Math.abs(player.currentTime - 20), 0.5, String(player.currentTime));
  });

  it("ArrowUp raises the volume by 5", function () {
    const slider = bar(w).shadowRoot.querySelector("#volume-slider");
    slider.value = 50;
    key(at, { key: "ArrowUp", code: "ArrowUp" });
    assert.isTrue(slider.value === 55 && Math.abs(player.volume - 0.55 ** 2) < 0.01, `${slider.value} ${player.volume}`);
  });

  it("ArrowDown lowers the volume", function () {
    const slider = bar(w).shadowRoot.querySelector("#volume-slider");
    slider.value = 55;
    key(at, { key: "ArrowDown", code: "ArrowDown" });
    key(at, { key: "ArrowDown", code: "ArrowDown" });
    assert.isTrue(slider.value === 45 && Math.abs(player.volume - 0.45 ** 2) < 0.01, `${slider.value} ${player.volume}`);
  });

  it("M toggles mute", function () {
    const muted = player.muted;
    key(at, { key: "m", code: "KeyM" });
    assert.equal(player.muted, !muted);
    key(at, { key: "m", code: "KeyM" });
  });

  it("C toggles the chapters drawer", function () {
    const open = () => w.shadowRoot.querySelector("video-chapter-drawer").drawer.open;
    const was = open();
    key(at, { key: "c", code: "KeyC" });
    assert.equal(open(), !was);
    key(at, { key: "c", code: "KeyC" });
  });

  it("F toggles fullscreen", function () {
    let full = 0;
    const original = bar(w).handleFullscreenClick;
    bar(w).handleFullscreenClick = () => full++;
    key(at, { key: "f", code: "KeyF" });
    bar(w).handleFullscreenClick = original;
    assert.equal(full, 1);
  });

  describe("keys that are not the widget's", function () {
    let state: ReturnType<typeof stubToggle>;
    beforeEach(() => { state = stubToggle(); });
    afterEach(() => { w.playback.toggle = state.toggle; });

    it("Tab is left to the browser", function () {
      assert.isFalse(key(at, { key: "Tab", code: "Tab" }).defaultPrevented);
    });

    it("Ctrl+K is not a player key", function () {
      key(at, { key: "k", code: "KeyK", ctrlKey: true });
      assert.equal(state.plays, 0);
    });

    it("typing in a field is not a player key", function () {
      const input = document.createElement("input");
      w.shadowRoot.querySelector("#container-video").append(input);
      key(input, { key: "k", code: "KeyK" });
      input.remove();
      assert.equal(state.plays, 0);
    });

    it("keys from an interaction are left alone", function () {
      key(w.querySelector("webwriter-video-interaction"), { key: "k", code: "KeyK" });
      assert.equal(state.plays, 0);
    });

    if (edit) it("typing in authored content is not a player key", function () {
      const p = w.querySelector("webwriter-video-interaction").querySelector("p");
      getSelection()!.collapse(p, 0);
      key(p, { key: "k", code: "KeyK" });
      getSelection()!.removeAllRanges();
      assert.equal(state.plays, 0);
    });

    it("keys outside the widget are not handled", function () {
      key(document.body, { key: "k", code: "KeyK" });
      assert.equal(state.plays, 0);
    });
  });

  it("leaves nothing behind after removal", function () {
    w.remove();
    const gone = key(document.body, { key: "k", code: "KeyK" });
    assert.isFalse(gone.defaultPrevented);
  });
});

mocha.run();
