/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { mount, cleanup, key, settle, until } from "./helpers";

mocha.setup(getMochaConfig());

const baubles = (w: any): HTMLElement[] => [...w.shadowRoot.querySelector("interactions-progress-bar").shadowRoot.querySelectorAll("webwriter-interactive-bauble")];
const marks = (w: any): HTMLElement[] => [...w.shadowRoot.querySelector("interactions-progress-bar").shadowRoot.querySelectorAll(".chapter-mark")];

for (const edit of [false, true]) describe(`<webwriter-interactive-video> input in ${edit ? "edit" : "read"} mode`, function () {
  this.timeout(30000);
  let w: any;

  before(async function () { w = await mount(undefined, edit); await settle(w); });
  after(cleanup);

  it("interaction markers are focusable buttons with a name", function () {
    const [first] = baubles(w);
    assert.equal(first.getAttribute("role"), "button");
    assert.equal(first.tabIndex, 0);
    assert.isAbove(first.getAttribute("aria-label")!.length, 0);
  });

  it("Enter on an interaction marker selects it", function () {
    const [first] = baubles(w);
    w.selectedInteractionId = -1;
    key(first, { key: "Enter" });
    assert.equal(w.selectedInteractionId, Number(first.id));
  });

  it("closes the popup for its current time window and reopens it from its marker", async function () {
    const [marker] = baubles(w);
    const interaction = w.videoInteractions[0];
    marker.click();
    const container = interaction.shadowRoot.querySelector("#container");
    await until(() => !container.hidden, "the popup to open");
    const button = interaction.shadowRoot.querySelector("#close-popup");
    assert.equal(button.getAttribute("aria-label"), "Close popup");
    button.focus();
    button.click();
    await settle(w);
    assert.isTrue(container.hidden);
    assert.equal(w.selectedInteractionId, -1);
    assert.isTrue(w.videoPlayer.paused);
    assert.equal((marker.getRootNode() as ShadowRoot).activeElement, marker);

    w.requestUpdate();
    await settle(w);
    assert.isTrue(container.hidden);

    marker.click();
    await until(() => !container.hidden, "the marker to reopen the popup");
    button.click();
    await until(() => container.hidden, "the popup to close again");
    w.videoPlayer.currentTime = 0;
    await until(() => !interaction.hasPaused, "the player to leave the popup's time window");
    w.videoPlayer.currentTime = interaction.startTime;
    await until(() => !container.hidden, "the popup to open when the player returns");
  });

  it("chapter markers are buttons that jump to the chapter", async function () {
    const [mark] = marks(w);
    assert.equal(mark.tagName, "BUTTON");
    w.videoPlayer.currentTime = 20;
    mark.click();
    assert.isBelow(w.videoPlayer.currentTime, 1);
  });

  it("the icon buttons of the control bar have labels", function () {
    const bar = w.shadowRoot.querySelector("video-controls-bar").shadowRoot;
    for (const id of ["play", "mute-volume-button", "fullscreen-button"]) {
      assert.isAbove(bar.querySelector(`#${id}`).getAttribute("label")?.length ?? 0, 0, id);
    }
  });

  if (edit) {
    it("adds and removes visible markers as popup markup changes", async function () {
      const popup = w.interactions.add(0);
      popup.setAttribute("contenteditable", "");
      const findMarker = () => baubles(w).find((marker) => String(marker.id) === String(popup.id));
      const marker = await until(findMarker, "the new popup's marker");
      try {
        const paragraph = popup.querySelector("p");
        assert.equal(popup.innerHTML, "<p></p>");
        assert.equal(getComputedStyle(paragraph).getPropertyValue("--ww-placeholder").trim(), '"Popup"');
        const markerRect = marker.getBoundingClientRect();
        const chapterRect = marks(w)[0].getBoundingClientRect();
        assert.isAbove(markerRect.width, 0);
        assert.isAtLeast(markerRect.top, chapterRect.bottom, "popup markers can be clicked when a chapter starts at the same time");
        const initialLeft = marker.getBoundingClientRect().left;
        popup.setAttribute("starttime", "12");
        await until(() => marker.getBoundingClientRect().left > initialLeft, "the marker to move after a direct DOM edit");
        paragraph.replaceWith(document.createElement("hr"));
        await settle(w);
        assert.equal(popup.innerHTML, "<hr>");
      } finally {
        popup.remove();
        await until(() => !findMarker(), "the deleted popup's marker to disappear");
      }
    });

    it("allows a click on the popup's shadow surface to reach the editor", async function () {
      const interaction = w.videoInteractions[0];
      assert.typeOf(interaction.id, "string");
      w.videoPlayer.currentTime = interaction.startTime;
      const surface = interaction.shadowRoot.querySelector(".popup-controls");
      await until(() => interaction.visible, "the popup to open");
      let reachedDocument = false;
      const listener = () => { reachedDocument = true; };
      document.addEventListener("click", listener, { once: true });
      try {
        const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
        surface.dispatchEvent(click);
        assert.isTrue(reachedDocument);
        assert.isFalse(click.defaultPrevented);
        assert.equal(w.selectedInteractionId, Number(interaction.id));
        assert.isTrue(w.videoPlayer.paused);
      } finally {
        document.removeEventListener("click", listener);
      }
    });

    it("ArrowRight on an interaction marker moves its start time by 1 s", async function () {
      const [first] = baubles(w);
      const interaction = w.videoInteractions.find((i: any) => Number(i.id) === Number(first.id));
      const before = interaction.startTime;
      key(first, { key: "ArrowRight" });
      await settle(w);
      assert.isBelow(Math.abs(interaction.startTime - (before + 1)), 0.01);
    });

    it("a touch drag on an interaction marker moves its start time", async function () {
      await settle(w);
      const bar = w.shadowRoot.querySelector("interactions-progress-bar");
      const [first] = baubles(w);
      const interaction = w.videoInteractions.find((i: any) => Number(i.id) === Number(first.id));
      const area = bar.shadowRoot.querySelector("#drop-area").getBoundingClientRect();
      const from = first.getBoundingClientRect();
      const at = (clientX: number, type: string) =>
        first.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, pointerId: 7, pointerType: "touch", isPrimary: true, clientX, clientY: from.top + 9 }));
      at(from.left + 9, "pointerdown");
      at(from.left + 40, "pointermove");
      at(area.left + area.width * 0.8, "pointermove");
      at(area.left + area.width * 0.8, "pointerup");
      await settle(w);
      const expected = w.videoPlayer.duration * 0.8;
      assert.isBelow(Math.abs(interaction.startTime - expected), 1.5, `${interaction.startTime} vs ${expected}`);
    });

    it("the move grip of an interaction works with the arrow keys", async function () {
      const interaction = w.videoInteractions[0];
      const grip = interaction.shadowRoot.querySelector("#dragIcon");
      const before = interaction.posX;
      key(grip, { key: "ArrowRight" });
      assert.equal(interaction.posX, before + 1);
      assert.equal(grip.tabIndex, 0);
    });
  }
});

describe("<webwriter-interactive-video> theme", function () {
  this.timeout(30000);
  let wrapper: HTMLElement, w: any;

  before(async function () {
    w = await mount(undefined, false);
    wrapper = w.parentElement;
    wrapper.style.setProperty("--ww-font-family", "Georgia, serif");
    wrapper.style.setProperty("--ww-theme-accent-1", "rgb(200, 10, 20)");
    await settle(w);
  });
  after(cleanup);

  it("the font follows --ww-font-family", function () {
    assert.include(getComputedStyle(w).fontFamily, "Georgia");
    assert.include(getComputedStyle(w.videoInteractions[0]).fontFamily, "Georgia");
  });

  it("the slider accent follows --ww-theme-accent-1", function () {
    assert.equal(getComputedStyle(w.shadowRoot.querySelector("#progress-bar")).getPropertyValue("--sl-color-primary-600").trim(), "rgb(200, 10, 20)");
  });

  it("the parts are exposed", function () {
    assert.isNotNull(w.shadowRoot.querySelector('[part="video"]'));
    assert.isNotNull(w.shadowRoot.querySelector('[part="controls"]'));
  });
});

describe("<webwriter-interactive-video> layout and print", function () {
  this.timeout(30000);
  let w: any;

  before(async function () { w = await mount(undefined, false); });
  after(cleanup);

  it("the host has the width limits of a block widget", function () {
    const style = getComputedStyle(w);
    assert.equal(style.display, "block");
    assert.equal(style.maxWidth, "2100px");
    assert.equal(style.minWidth, "min(300px, 100%)");
  });

  it("the print view lists the chapters", function () {
    const view = w.shadowRoot.querySelector(".print-view");
    assert.include(view.textContent, "Stepping down the ladder");
    assert.equal(getComputedStyle(view).display, "none");
  });
});

mocha.run();
