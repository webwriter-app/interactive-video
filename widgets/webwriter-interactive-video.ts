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
      'interaction-container': InteractionContainer,
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
  }
  
  `

  @property({ type: Boolean })
  fileSelected: boolean = false;

  @query('#container-vertical')
  _container;

  @query('#progress-bar')
  _progressBar;

  @query('#interactions-drawer')
  _drawer : SlDrawer;

  @query('#time-stamp')
  _timeStamp;

  @query('#video')
  _video;

  @query('#volume-slider')
  _volumeSlider;

  @query('#drawer-slot')
  _drawerSlot;

  firstUpdated() {
    this._video.controls = false;
    this._progressBar.tooltipFormatter = (value: number) => this._formatTime(Math.floor((value / 100) * this._video.duration));
    this._video.volume = 0.5;
    this._volumeSlider.value = 50;
  }

  closeDrawer(e: CustomEvent) {
    this._drawer.open = !this._drawer.open;
  }

  handlePlayClick = (e: CustomEvent) => {
    const playButton = e.target as SlButton;
    this._video.paused == true ? this._video.play() : this._video.pause();
    playButton.innerHTML = this._video.paused ? 'Play' : 'Pause';
  }

  handleMuteClick = (e: CustomEvent) => {
    const t = e.target as SlButton;
    t.innerHTML = this._video.muted ? 'Mute' : 'Unmute';
    this._video.muted = !this._video.muted;
  }

  handleProgressChange = (e: CustomEvent) => {
    const progressBar = e.target as SlRange;
    let currentTime = (progressBar.value / 100) * this._video.duration;
    this._video.currentTime = Math.floor(currentTime);
  }

  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;
    this._video.volume = volumeSlider.value / 100;
  }

  handleTimeUpdate = (e: CustomEvent) => {
    this._progressBar.value = (this._video.currentTime / this._video.duration) * 100;
    this._timeStamp.innerHTML = this._formatTime(this._video.currentTime) + '/' + this._formatTime(this._video.duration);
  }

  _formatTime(time: number) {
    const flooredTime = Math.floor(time);
    if (this._video.duration < 3600) {
      const seconds = flooredTime % 60, minutes = Math.floor(flooredTime / 60);
      let result = this._fillSecondsMinutes(seconds, minutes);
      return result;
    }
    const hours = flooredTime % 3600, minutes = Math.floor((flooredTime % 3600) / 60), seconds = flooredTime % 60;
    return hours.toString() + ':' + this._fillSecondsMinutes(seconds, minutes);
  }

  _fillSecondsMinutes(seconds: number, minutes: number) {
    if (seconds < 10 && minutes < 10) {
      return '0' + minutes + ':' + '0' + seconds;
    } else if (seconds < 10 && minutes > 10) {
      return minutes.toString() + ':' + '0' + seconds;
    } else if (seconds > 10 && minutes < 10) {
      return '0' + minutes + ':' + seconds;
    }
    return minutes.toString() + ':' + seconds.toString();
  }

  handleAddClick = (e: CustomEvent) => {
    if(!this._drawer.open) {
      this._drawer.open = true;
      const newInteraction = document.createElement('interaction-container') as InteractionContainer;
      this._drawer.appendChild(newInteraction);
      const slot = this._drawer.shadowRoot.querySelector('slot.drawer__body') as HTMLSlotElement;
      slot.assignedElements().forEach((element) => {
        if(element instanceof InteractionContainer) {
          console.log(element);
        }
      });
    }
  }


  handleFullscreenClick = (e: CustomEvent) => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    else {
      this._container.requestFullscreen();
    }
  }

  handleLoadedMetadata = (e: CustomEvent) => {
    this._timeStamp.innerHTML = '00:00/' + this._formatTime(this._video.duration);
  }

  _settingSelectionHandler = (e: CustomEvent) => {
    console.log(e.detail);
  }



  render() {
    return html`
    <div id='container-vertical'>
      <div class='container-video'>
        <video id='video' preload='metadata'  poster="https://assets.codepen.io/32795/poster.png" @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}>
          <source id='mp4' src="http://media.w3.org/2010/05/sintel/trailer.mp4" type='video/mp4' />
        </video>
      </div>
      <div id='controls'>
        <div id='progress-bar-container'>
          <sl-range id='progress-bar' @sl-change=${this.handleProgressChange}></sl-range>
        </div>
        <div id='controls-lower'>
          <div id='controls-lower-left'>
            <sl-button id='play' @click=${this.handlePlayClick}>Play</sl-button>
            <p id='time-stamp'>00:00/00:00</p>
          </div>
          <div id='controls-lower-right'>
            <sl-button @click=${this.handleMuteClick}>Mute</sl-button>
            <sl-range id='volume-slider' @sl-change=${this.handleVolumeChange}></sl-range>
            <sl-button @click=${this.handleAddClick}>Add</sl-button>
            <sl-dropdown placement='top-start' id='settings-menu' @sl-select=${this._settingSelectionHandler}>
              <sl-button slot='trigger'>Settings</sl-button>
              <sl-menu>
                <sl-menu-item>
                  Playback Speed
                  <sl-menu slot='submenu'>
                    <sl-menu-item value='0,5'>0.5x</sl-menu-item>
                    <sl-menu-item value='1'>1x</sl-menu-item>
                    <sl-menu-item value='1,5'>1.5x</sl-menu-item>
                    <sl-menu-item value='2'>2x</sl-menu-item>
                  <sl-menu>
                </sl-menu-item>
              </sl-menu>
            </sl-dropdown>
            <sl-button id='fullscreen-button' @click=${this.handleFullscreenClick}>FS</sl-button>
          </div>
        </div>
      </div>
      <sl-drawer label='Add Interaction' contained id='interactions-drawer'>
        <slot name='interaction-container-slot' id='drawer-slot'></slot>
        <sl-button slot="footer" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
      </sl-drawer>
    </div>
    `;
  }
}


@customElement('interaction-container')
export class InteractionContainer extends LitElementWw {


  @property({ type: Boolean, attribute: true })
  active = true;

  static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-menu': SlMenu,
      'sl-menu-item': SlMenuItem,
      'sl-dropdown': SlDropdown,
      'sl-input': SlInput,

    }
  }

  static readonly styles = css`

  `

  _interactionTypeSelectionHandler = (e: CustomEvent) => {
    if(e.detail.item.value==1) {
      this.shadowRoot.getElementById('replace-interaction-settings').hidden = false;
      this.shadowRoot.getElementById('overlay-interaction-settings').hidden = true;
    } else {
      this.shadowRoot.getElementById('replace-interaction-settings').hidden = true;
      this.shadowRoot.getElementById('overlay-interaction-settings').hidden = false;
    }
  }


  render() {

    return html`
    <div>
      <sl-dropdown label='Interaction Type' id='interaction-type-dropdown' @sl-select=${this._interactionTypeSelectionHandler}>
          <sl-button slot='trigger' id='interaction-type-button' caret>Interaction Type</sl-button>
          <sl-menu>
            <sl-menu-item value='1'>Replace</sl-menu-item>
            <sl-menu-item value='2'>Overlay</sl-menu-item>
          </sl-menu>
        </sl-dropdown>
        <div id='interaction-settings-container'>
          <div id='overlay-interaction-settings' hidden>
            <sl-input label='Start Time'></sl-input>
            <sl-input label='End Time'></sl-input>
          </div>
          <div id='replace-interaction-settings' hidden>
            <sl-input label='Timestamp'></sl-input>
          </div>
        </div>
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
