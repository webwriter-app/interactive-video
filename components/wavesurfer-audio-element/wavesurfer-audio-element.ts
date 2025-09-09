import { LitElementWw } from "@webwriter/lit";
import styles from "./wavesurfer-audio-element.styles";
import { html, PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import WaveSurfer from "wavesurfer.js";
import { consume } from "@lit/context";
import {
	InteractiveVideoContext,
	videoContext,
} from "../../utils/interactive-video-context";
import { SlSpinner } from "@shoelace-style/shoelace";
import { msg } from "@lit/localize";

export class WaveSurferAudioElement extends LitElementWw {
	@consume({ context: videoContext, subscribe: true })
	accessor videoContext: InteractiveVideoContext;

	@property({ type: String })
	accessor src: string = "";

	@property({ type: Object })
	accessor waveSurfer: WaveSurfer | null = null;

  @property({ type: Boolean })
  accessor isReady: boolean = false;

	@query("#wavesurfer")
	accessor waveSurferContainer!: HTMLDivElement;

	//import CSS
	static styles = [styles];

  static get scopedElements() {
      return {
        "sl-spinner": SlSpinner,
      };
    }

	connectedCallback(): void {
		super.connectedCallback();

		let hasWaveformData = !!this.videoContext.waveformData;

		setTimeout(() => {
			this.waveSurfer = WaveSurfer.create({
				container: this.waveSurferContainer,
				waveColor: "#4d4d4d",
				progressColor: "#e9e9e9",
				cursorColor: "#0284C7",
				cursorWidth: 2,
				autoScroll: true,
				autoCenter: true,
				minPxPerSec: 100,
				hideScrollbar: true,
				height: "auto",
				url: this.src,
				peaks: hasWaveformData
					? this.videoContext.waveformData
					: undefined,
			});
			if (!hasWaveformData) {
				this.waveSurfer.once("decode", () => {
					const peaks =
						this.waveSurfer.exportPeaks({
							channels: 1,
							maxLength: 24000,
							precision: 100,
						}) || null;
          this.dispatchEvent(
            new CustomEvent("setwaveformdata", { 
              bubbles: true,
              composed: true,
              detail: { data: peaks } 
            })
          );
				});
			}
			this.waveSurfer.once("ready", () => {
				this.dispatchEvent(
					new Event("loadedmetadata", {
						bubbles: true,
						composed: true,
					})
				);
				this.dispatchEvent(
					new Event("durationchange", {
						bubbles: true,
						composed: true,
					})
				);
				this.dispatchEvent(
					new Event("canplay", { bubbles: true, composed: true })
				);
        this.isReady = true;
			});
			this.waveSurfer.on("play", () =>
				this.dispatchEvent(
					new Event("play", { bubbles: true, composed: true })
				)
			);
			this.waveSurfer.on("pause", () =>
				this.dispatchEvent(
					new Event("pause", { bubbles: true, composed: true })
				)
			);
			this.waveSurfer.on("finish", () =>
				this.dispatchEvent(
					new Event("ended", { bubbles: true, composed: true })
				)
			);
			this.waveSurfer.on("timeupdate", () =>
				this.dispatchEvent(
					new Event("timeupdate", { bubbles: true, composed: true })
				)
			);
			this.waveSurfer.on("seeking", () =>
				this.dispatchEvent(
					new Event("seeking", { bubbles: true, composed: true })
				)
			);
			this.waveSurfer.on("error", () =>
				this.dispatchEvent(
					new Event("error", { bubbles: true, composed: true })
				)
			);
		}, 0);
	}

	disconnectedCallback(): void {
		if (this.waveSurfer) {
			this.waveSurfer.unAll();
			this.waveSurfer.destroy();
			this.waveSurfer = null;
		}
	}

	protected updated(_changedProperties: PropertyValues): void {
		if (_changedProperties.has("src")) {
			if (this.waveSurfer) {
				let hasWaveformData = !!this.videoContext.waveformData;
				if (hasWaveformData) {
					this.waveSurfer.load(
						this.src,
						this.videoContext.waveformData
					);
				} else {
					this.waveSurfer.load(this.src);
				}
			}
		}
	}

	protected render() {
		return html`<div id="wrapper">
      <div id="wavesurfer"></div>
      ${!this.isReady ? html`<div id="loading-overlay"><sl-spinner></sl-spinner>${msg("Loading audio...")}</div>` : null}
    </div>`;
	}

	get volume() {
		return this.waveSurfer ? this.waveSurfer.getVolume() : 0;
	}
	set volume(value: number) {
		if (!this.waveSurfer) return;
		this.waveSurfer.setVolume(value);
	}

	get muted() {
		return this.waveSurfer ? this.waveSurfer.getMuted() : false;
	}
	set muted(value: boolean) {
		if (!this.waveSurfer) return;
		this.waveSurfer.setMuted(value);
	}

	get currentTime() {
		return this.waveSurfer ? this.waveSurfer.getCurrentTime() : 0;
	}
	set currentTime(value: number) {
		if (!this.waveSurfer) return;
		this.waveSurfer.setTime(value);
	}

	get playbackRate() {
		return this.waveSurfer ? this.waveSurfer.getPlaybackRate() : 1;
	}
	set playbackRate(value: number) {
		if (!this.waveSurfer) return;
		this.waveSurfer.setPlaybackRate(value);
	}

	get paused() {
		return this.waveSurfer ? !this.waveSurfer.isPlaying() : true;
	}

	get ended() {
		return this.waveSurfer
			? !this.waveSurfer.isPlaying() && this.currentTime >= this.duration
			: false;
	}

	get duration() {
		return this.waveSurfer ? this.waveSurfer.getDuration() : 0;
	}

	play() {
		if (!this.waveSurfer) return;
		return this.waveSurfer.play();
	}

	pause() {
		if (!this.waveSurfer) return;
		this.waveSurfer.pause();
	}

	load() {
		// noop, WaveSurfer loads automatically when src is set
	}
}
