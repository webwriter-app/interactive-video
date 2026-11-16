/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import { mount, cleanup, settle, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<webwriter-interactive-video> localization", function () {
  this.timeout(30000);
  let w: any, english: string;
  const label = () => w.options["hide-chapters"].label;
  const drawerLabel = () => w.shadowRoot.querySelector("video-chapter-drawer").shadowRoot.querySelector("sl-drawer").getAttribute("label");

  before(async function () {
    w = await mount(undefined, false);
    english = label();
  });
  after(function () {
    document.documentElement.setAttribute("lang", "en");
    cleanup();
  });

  it("starts in the source language", function () {
    assert.isTrue(english === "Hide chapters" && drawerLabel() === "Chapters" && w.localize.getLocale() === "en", `${english} ${drawerLabel()}`);
  });

  describe("after the lang changes to de", function () {
    let options = 0;
    before(async function () {
      w.addEventListener("optionschange", () => options++);
      w.setAttribute("lang", "de");
      await until(() => w.localize.getLocale() === "de", "German");
      await settle(w);
    });

    it("follows lang with the labels of the widget", function () {
      assert.isTrue(label() !== english && w.msg("Chapters") !== "Chapters", label());
    });

    it("follows lang in a component inside", function () {
      assert.isTrue(drawerLabel() === w.msg("Chapters") && drawerLabel() !== "Chapters", drawerLabel());
    });

    it("tells the editor to read the options again", function () {
      assert.isAbove(options, 0);
    });

    it("lets an interaction follow the lang of the widget around it", async function () {
      const interaction = w.querySelector("webwriter-video-interaction");
      await until(() => interaction.localize.getLocale() === "de", "the interaction's language");
      assert.notEqual(interaction.options.startTime.label, "Start time");
    });
  });

  it("finds the catalog of a regional tag", async function () {
    w.setAttribute("lang", "pt-BR");
    await until(() => w.localize.getLocale() === "pt-BR", "pt-BR");
  });

  it("reads the de catalog for de-AT", async function () {
    w.setAttribute("lang", "de-AT");
    await until(() => w.localize.getLocale() === "de", "de-AT as de");
  });

  it("falls back to English for an unknown language", async function () {
    w.setAttribute("lang", "de");
    await until(() => w.localize.getLocale() === "de", "German");
    w.setAttribute("lang", "xx");
    await until(() => w.localize.getLocale() === "en", "fallback");
    await settle(w);
    assert.isTrue(label() === english && drawerLabel() === "Chapters");
  });

  it("takes the lang of the page without its own lang", async function () {
    document.documentElement.setAttribute("lang", "fr");
    w.removeAttribute("lang");
    await until(() => w.localize.getLocale() === "fr", "the lang of the page");
  });
});

mocha.run();
