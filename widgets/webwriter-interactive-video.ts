import { html, css } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { customElement, property, query } from "lit/decorators.js"
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.js'
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.js'
import SlCard from '@shoelace-style/shoelace/dist/components/card/card.js'
import SlIconButton from '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.js'
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.js'
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'

import { WwVideoInteraction } from "./webwriter-video-interaction"

@customElement("webwriter-interactive-video")
export class WebwriterInteractiveVideo extends LitElementWw {
  static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-input': SlInput,
      'sl-icon': SlIcon,
      'sl-card': SlCard,
      'sl-icon-button': SlIconButton,
      'sl-drawer': SlDrawer,
      'sl-range': SlRange,
      'sl-dropdown': SlDropdown,
      'sl-menu': SlMenu,
      'sl-menu-item': SlMenuItem
    }
  }

  static readonly styles = css`

  #container-vertical {
    display: flex;
    position: relative;
    flex-direction: column;
    width: 100%;
  }

  #video {
    width: 100%
  }


  #controls {
    width: 98%;
    margin-left: 1%;
    margin-right: 1%;
    flex-direction: column;
    position: absolute;
    bottom: 0;
    justify-content: space-between;
  }

  #controls-lower {
    bottom: 0;
    display: flex;
    flex-direction: row;
    width: 100%
  }

  #controls-lower-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  }

  #controls-lower-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: auto;
    gap: 2px;
  }

  #time-stamp {
    color: white;
    user-select: none;  
  }

  `

  @property({ type: Number, attribute: true, reflect: true })
  counter = 0;

  @property({ type: Boolean })
  videoLoaded: boolean = false;

  @property({ type: String })
  videoDurationFormatted: string = '00:00';

  @query('#container-vertical')
  container;

  @query('#progress-bar')
  progressBar;

  @query('#interactions-drawer')
  drawer: SlDrawer;

  @query('#time-stamp')
  timeStamp;

  @query('#video')
  video: HTMLVideoElement;

  @query('#volume-slider')
  volumeSlider;

  @query('#drawer-slot')
  drawerSlot;

  @query('#play')
  playButton: SlButton;



  closeDrawer(e: CustomEvent) {
    if (!this.videoLoaded) return;
    this.drawer.open = !this.drawer.open;
  }

  handlePlayClick = (e: CustomEvent) => {
    this.startStopVideo()
  }

  startStopVideo() {
    console.log(this);
    if (!this.videoLoaded) return;
    if (this.video.ended) {
      this.video.currentTime = 0;
    }
    this.video.paused ? this.video.play() : this.video.pause();
    this.playButton.innerHTML = this.video.paused ? 'Play' : 'Pause';
  }



  handleMuteClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    const t = e.target as SlButton;
    t.innerHTML = this.video.muted ? 'Mute' : 'Unmute';
    this.video.muted = !this.video.muted;
  }

  handleProgressChange = (e: CustomEvent) => {
    const progressBar = e.target as SlRange;
    let currentTime = (progressBar.value / 100) * this.video.duration;
    this.video.currentTime = Math.floor(currentTime);
  }

  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;
    this.video.volume = volumeSlider.value / 100;
  }

  handleTimeUpdate = (e: CustomEvent) => {
    this.progressBar.value = (this.video.currentTime / this.video.duration) * 100;
    this.timeStamp.innerHTML = this.formatTime(this.video.currentTime) + '/' + this.videoDurationFormatted;
  }

  formatTime(time: number) {
    let result =''
    const flooredTime = Math.floor(time), hours = Math.floor(time / 3600), minutes = Math.floor((flooredTime % 3600) / 60), seconds = flooredTime % 60;
    if(hours > 0) result += hours.toString() + ':';
    minutes < 10 ? result += '0' + minutes.toString() + ':' : result += minutes.toString() + ':';
    seconds < 10 ? result += '0' + seconds.toString() : result += seconds.toString();
    return result;
  }


  handleAddClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    if (!this.drawer.open) {
      this.drawer.open = true;
      /* einschränken, dass nur interactionsettings reinkommen */
      const slot = this.drawer.shadowRoot.querySelector('slot.drawer__body') as HTMLSlotElement;
      slot.assignedElements().forEach((element) => {
        if (element instanceof WwVideoInteraction) {
          element.active = false;
        }
      });
      /*  in editingConfig hinzufügen, dass InteractionSettings viable slot content ist*/
      const interactionContainer = document.createElement('webwriter-video-interaction');
      interactionContainer.slot = 'interaction-setting-slot';
      this.appendChild(interactionContainer);
    }
  }


  handleFullscreenClick = (e: CustomEvent) => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    else {
      this.container.requestFullscreen();
    }
  }

  handleLoadedMetadata = (e: CustomEvent) => {
    this.videoLoaded = true;
    this.progressBar.disabled = false;
    this.timeStamp.innerHTML = '00:00/' + this.formatTime(this.video.duration);
    this.progressBar.tooltipFormatter = (value: number) => this.formatTime(Math.floor((value / 100) * this.video.duration));
    this.video.controls = false;
    this.video.volume = 0.1;
    this.volumeSlider.disabled = false;
    this.videoDurationFormatted = this.formatTime(this.video.duration);
  }

  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    this.video.playbackRate = e.detail.item.value;
  }


  seek(value: number) {
    if (!this.videoLoaded) return;
    this.video.currentTime += value;
  }

  handleVideoClick = (e: MouseEvent) => {
    if (!this.videoLoaded) return;
    this.startStopVideo();
  }

  firstUpdated() {
    this.progressBar.disabled = true;
    this.volumeSlider.value = 10;
    this.volumeSlider.disabled = true;
  }


  render() {
    return html`      
    <div id='container-vertical'>
      
    <slot></slot>
      <!-- container for the video element -->
      <div class='container-video' @click=${this.handleVideoClick}>
        <video id='video' preload='metadata'  poster='https://assets.codepen.io/32795/poster.png' @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}>
          <source id='mp4' src='http://media.w3.org/2010/05/sintel/trailer.mp4' type='video/mp4' />
        </video>
      </div>
      <!-- container for the controls -->
      <div id='controls'>
        <div id='progress-bar-container'>
          <sl-range id='progress-bar' @sl-change=${this.handleProgressChange}></sl-range>
        </div>
        <div id='controls-lower'>
          <!-- contains the play button and the time stamp -->
          <div id='controls-lower-left'>
            <sl-button id='play' @click=${this.handlePlayClick}>Play</sl-button>
            <p id='time-stamp'>00:00/00:00</p>
          </div>
          <!-- contains the volume slider and other controls -->
          <div id='controls-lower-right'>
            <sl-button id='play' @click=${this.handleMuteClick}>Mute</sl-button>
            <sl-range id='volume-slider' @sl-change=${this.handleVolumeChange}></sl-range>
            <sl-button @click=${this.handleAddClick}>Add</sl-button>
            <sl-dropdown placement='top-start' id='settings-menu' @sl-select=${this.settingSelectionHandler}>
              <sl-button slot='trigger'>Settings</sl-button>
              <sl-menu>
                <sl-menu-item>
                  Playback Speed
                  <sl-menu slot='submenu'>
                    <sl-menu-item value='0.25'>0.25x</sl-menu-item>
                    <sl-menu-item value='0.5'>0.5x</sl-menu-item>
                    <sl-menu-item value='1'>1x</sl-menu-item>
                    <sl-menu-item value='1.5'>1.5x</sl-menu-item>
                    <sl-menu-item value='2'>2x</sl-menu-item>
                  <sl-menu>
                </sl-menu-item>
              </sl-menu>
            </sl-dropdown>
            <sl-button id='fullscreen-button' @click=${this.handleFullscreenClick}>FS</sl-button>
          </div>  
        </div>
      </div>

      <!-- drawer for adding and managing interactions -->
      <sl-drawer label='Add Interaction' contained id='interactions-drawer'>
        <slot name='interaction-setting-slot' id='drawer-slot'></slot>
        <sl-button slot="footer" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
      </sl-drawer>
    </div>
  `;
  }
}



/*
In den attributen der elemente (z.b. hotspot element) kann man da text reinschreiben in den slot und als attribut des elements zusätzliche daten speichern
marker rumziehen lassen, sonst on click (add) default values einfügen
man wählt in der leiste die interaktion aus und kriegt einen draghandler wo man die direkt länger/kürzer ziehen kann
nicht davon abhängig machen was drinsteckt

2 arten:punktuell: pausieren das video und ersetzen das widget komplett
        zeitspanne: haben eine start und endzeit und liegen auf dem widget
      

aggregate funktionen für alle interaktionen/einige interaktionen, z.b. shift-click für mehrere nach dem clicken der ersten
*/
