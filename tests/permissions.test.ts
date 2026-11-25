/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { mount, cleanup, bar, settle, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<webwriter-interactive-video> permissions", function () {
  this.timeout(30000);
  afterEach(cleanup);

  const bauble = (w: any) => w.shadowRoot.querySelector("interactions-progress-bar")?.shadowRoot.querySelector("webwriter-interactive-bauble");

  it("shows no author controls in read mode", async function () {
    const w = await mount(undefined, false);
    await settle(w);
    assert.isNotOk(bar(w).shadowRoot.querySelector("#add-button"));
  });

  it("does not make baubles draggable in read mode", async function () {
    const w = await mount(undefined, false);
    await settle(w);
    assert.equal(bauble(w)?.getAttribute("draggable"), "false");
  });

  describe("when the mode changes to edit", function () {
    let w: any;
    beforeEach(async function () {
      w = await mount(undefined, false);
      await settle(w);
      w.setAttribute("contenteditable", "");
      await until(() => bar(w).shadowRoot.querySelector("#add-button"), "the add button after the mode changed to edit");
    });

    it("shows the add button", function () {
      assert.isOk(bar(w).shadowRoot.querySelector("#add-button"));
    });

    it("makes baubles draggable and shows their number", function () {
      assert.isTrue(bauble(w)?.getAttribute("draggable") === "true" && bauble(w).shadowRoot.querySelector("p")?.textContent === "1", bauble(w)?.shadowRoot.innerHTML);
    });

    it("lets the chapter drawer offer adding", function () {
      const drawer = w.shadowRoot!.querySelector("video-chapter-drawer")!;
      assert.isTrue(!!drawer.shadowRoot!.querySelector('sl-button[slot="footer"]') && drawer.shadowRoot!.querySelectorAll("sl-input").length > 0);
    });

    it("removes the add button when the mode changes back", async function () {
      w.removeAttribute("contenteditable");
      await until(() => !bar(w).shadowRoot.querySelector("#add-button"), "the add button to go away");
    });

    it("writes nothing onto the shadow components", function () {
      assert.isFalse(bar(w).hasAttribute("contenteditable"));
    });
  });

  it("shows the author controls from the start in edit mode", async function () {
    const w = await mount(undefined, true);
    await until(() => bar(w).shadowRoot.querySelector("#add-button"), "the add button in edit mode");
  });

  it("shows the move grip without a custom resize handle in edit mode", async function () {
    const w = await mount(undefined, true);
    const interaction = w.querySelector("webwriter-video-interaction") as any;
    await until(() => interaction.shadowRoot?.querySelector("#dragIcon"), "the interaction's move grip");
    assert.isNull(interaction.shadowRoot.querySelector("#bottomRight"));
  });

  it("hides the handles of an interaction for readers", async function () {
    const w = await mount(undefined, false);
    const interaction = w.querySelector("webwriter-video-interaction") as any;
    await interaction.updateComplete;
    assert.isTrue(!interaction.shadowRoot.querySelector("#dragIcon") && !interaction.shadowRoot.querySelector("#bottomRight"));
  });
});

mocha.run();
