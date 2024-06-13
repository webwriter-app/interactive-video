import { html, css, _$LE } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { LitElement } from "lit"
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
import { videoData } from '../models/videoData'
import {WwInteractiveBauble} from './webwriter-interactive-bauble'
import { WwVideoInteraction } from './webwriter-video-interaction'
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js"

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
      'sl-menu-item': SlMenuItem,
      'webwriter-interactive-bauble': WwInteractiveBauble,
      'sl-checkbox': SlCheckbox
    }
  }

  static readonly styles = css`

  #container-vertical {
    position: relative;
    display: grid;
    grid-template-areas: "stack";
    width: 100%;
  }

  #container-vertical > * {
    grid-area: stack;
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

  #controls-upper {
    transform: translateY(-27px);
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

  #return-button {
    display: flex;
    justify-self: end;
  }

  #replace-timestamp {
    margin-top: 10px;
    margin-bottom: 10px;
  }
  
  #interaction-button-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
    

  #return-button {
    position: absolute;
    bottom: 0;
    right: 0;
    visibility: hidden;
  }
  `

  @property({ type: Boolean })
  videoLoaded: boolean = false;

  @property({type: Boolean})
  interactionActive: boolean = false;

  @property({ type: String })
  videoDurationFormatted: string = '00:00';

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

  @query('#play')
  playButton: SlButton;

  @query('#interaction-container')
  interactionContainer : HTMLDivElement;

  @query('#interaction-slot')
  interactionSlot : HTMLSlotElement;

  @query('#replace-timestamp')
  replaceTimestamp : SlInput;

  @property()
  activeElement : number;

  @property()
  videoData : Map<number, videoData> = new Map()

  @property()
  lastTimeupdate : number = 0;

  @property({type: Boolean})
  showInteractions: boolean = false;
 
  /* ------------------------------------------------------------------------------------------------------------------------------------- */

  /*
  * Handles clicking of the Add button in the video control bar
  */
  handleAddClick = () => {
    if (!this.videoLoaded) return;
    if (!this.drawer.open) {
      this.drawer.open = true;
    }
    this.hideDrawerContent();
  }

  static shadowRootOptions = {...LitElement.shadowRootOptions, delegatesFocus: true };


  /*
  * Handles the selection of the interaction type in the dropdown menu, and adds an interactive element into the container
  *
  * @param e - CustomEvent containing the selected item from the dropdown
  * 
  */
  handleInteractionTypeSelected = (e: CustomEvent) => {
    if(!this.videoLoaded) return;
    if (e.detail.item.value == 1) { // replace
      this.showReplaceSettings();
      const interaction = document.createElement('webwriter-video-interaction') as WwVideoInteraction;
      interaction.setAttribute("id", `${WwInteractiveBauble.nextId++}`);
      this.videoData.set(interaction.id, {isReplace: true, startTime: this.video.currentTime, endTime: 0});
      interaction.slot = 'interaction-slot';
      this.activeElement = interaction.id;
      this.appendChild(interaction);
      this.changeActiveElement(interaction.id);
      this.replaceTimestamp.value = this.formatTime(this.video.currentTime);
    } else { // overlay
      this.showOverlaySettings();

    }
  }

  hideDrawerContent() {
    this.shadowRoot.getElementById('replace-interaction-settings').hidden = true;
    this.shadowRoot.getElementById('overlay-interaction-settings').hidden = true;
  }

  showReplaceSettings() {
    this.shadowRoot.getElementById('replace-interaction-settings').hidden = false;
    this.shadowRoot.getElementById('overlay-interaction-settings').hidden = true;
  }

  showOverlaySettings() {
    this.shadowRoot.getElementById('replace-interaction-settings').hidden = true;
    this.shadowRoot.getElementById('overlay-interaction-settings').hidden = false;
  }

  /*
  * Sets up some default values for the overlay
  */
  firstUpdated() {
    this.progressBar.disabled = true;
    this.volumeSlider.value = 10;
    this.volumeSlider.disabled = true;
  }

  
  handleBaubleClick(event: MouseEvent) {
      const clickedElement = event.target as WwInteractiveBauble;
      this.changeActiveElement(clickedElement.id);
      this.replaceTimestamp.value = this.formatTime(this.videoData.get(clickedElement.id).startTime);
      console.log(this.videoData.get(clickedElement.id).startTime);
      if(!this.drawer.open) this.drawer.open=true;
  }

  changeActiveElement(newActive: number) {
    this.interactionSlot.assignedElements().forEach((element: WwVideoInteraction) => {
      if(element.id == newActive) {
        element.active = true;
      } else {
        element.active = false;
      } 
    });
  }

  handleInputChange = (e: CustomEvent) => {
    const input = e.target as SlInput;
    const segments = input.value.split(':');
    console.log(segments);
    console.log(segments.some((x => {return isNaN(Number(x))})));
    if(segments.length <=1 || segments.length > 3 || segments.some((x => {return isNaN(Number(x))}))) {
      this.replaceTimestamp.helpText = 'invalid time format, please use hh:mm:ss or mm:ss';
      return;
    } else if(segments.length  === 3) {
      this.videoData.get(this.activeElement).startTime = parseInt(segments[0]) * 3600+parseInt(segments[1])*60+parseInt(segments[2]); 
    } else {
      this.videoData.get(this.activeElement).startTime = parseInt(segments[0]) * 60+parseInt(segments[1]); 
    }
    
    this.replaceTimestamp.helpText = '';
  }

  calculateOffset() {
    const rect = this.video.getBoundingClientRect();
    return (this.video.currentTime / this.video.duration) * 0.95 * rect.width;
  }

  handleShowInteractionsChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showInteractions = target.checked;
  }

  render() {
    return html`
    <div>
      <sl-checkbox @sl-change=${this.handleShowInteractionsChange} style='overflow: hidden'>Show Interactions</sl-checkbox>
    </div>
    <div id='container-vertical'>
        <!-- container for the video element -->
        <div class='container-video' @click=${this.handleVideoClick}>
          <video id='video' preload='metadata'  poster='https://assets.codepen.io/32795/poster.png' @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}>
            <source id='mp4' src='http://media.w3.org/2010/05/sintel/trailer.mp4' type='video/mp4' />
          </video>
        </div>
        <!-- container for the controls -->
        <div id='controls'>
          <div id='controls-upper'>
            ${Array.from(this.videoData.entries()).map(([key, value]) => {
              return html`<webwriter-interactive-bauble offset=${this.calculateOffset()} draggable="true" @click=${this.handleBaubleClick} id=${key}></webwriter-interactive-bauble>`;
            })}
          </div>
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
          <sl-dropdown label='Interaction Type' id='interaction-type-dropdown' @sl-select=${this.handleInteractionTypeSelected}>
            <sl-button slot='trigger' id='interaction-type-button' caret>Interaction Type</sl-button>
            <sl-menu>
              <sl-menu-item value='1'>Replace</sl-menu-item>
              <sl-menu-item value='2'>Overlay</sl-menu-item>
            </sl-menu>
          </sl-dropdown>
          <div id='interaction-settings-container'>
            <div id='replace-interaction-settings' hidden>
              <sl-input id='replace-timestamp' label='Timestamp' @sl-change=${this.handleInputChange}></sl-input>
              <!-- container for the interactive elements -->
              <div id='interaction-container'>
                <slot name='interaction-slot' id='interaction-slot'>  
                </slot>
                <div id='interaction-button-group'>
                  <sl-button @click=${this.toggleInteractionView}> ${this.interactionActive? 'Return to Video' : 'View Interaction'} </sl-button>
                  ${this.interactionActive ? html``: html`<sl-button variant='danger' @click=${this.testDelete}> Delete </sl-button>`}
                </div>
              </div>
          </div>
            <div id='overlay-interaction-settings' hidden>
              <sl-input label='Start Time'></sl-input>
              <sl-input label='End Time'></sl-input>
            </div>
          </div>
          <sl-button slot="footer" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
        </sl-drawer>
      </div>
    `
  };

  testDelete() {
    let activeId; 
    this.interactionSlot.assignedElements().forEach((element) => {
      if(element instanceof WwVideoInteraction && element.active) {
         activeId = element.id;
        element.remove();
      }
    });
    this.videoData.delete(activeId);
    this.drawer.hide();
    this.requestUpdate();
  }

  toggleInteractionView() {
    if(this.interactionActive) {
      this.minimizeInteraction();
    } else {
      this.maximizeInteraction();
    }
  }

  

  /**
   * 
   * Minimizes the interaction container.
   */
  minimizeInteraction() {
    //this.drawer.hide();
    //maybe delay this code so the animation of the drawer closing isnt playing
    this.interactionContainer.style.position = 'relative';
    this.interactionContainer.style.zIndex = '0';
    this.interactionContainer.style.backgroundColor = 'transparent';
    this.interactionContainer.style.left = '0';
    this.interactionContainer.style.width = '100%';
    this.interactionContainer.style.height = '30%';
    this.interactionContainer.style.color = 'black';
    this.interactionContainer.style.fontSize = '1em';
    this.interactionActive = false;
  }

  /**
   * Maximizes the interaction container and displays it on the screen.
   */
  maximizeInteraction = () => {
    this.drawer.open = true;
    const rect = this.shadowRoot.querySelector('#container-vertical').getBoundingClientRect() as DOMRect;
    this.interactionContainer.style.position = 'fixed';
    this.interactionContainer.style.zIndex = '1000';
    this.interactionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.interactionContainer.style.display = 'block';
    this.interactionContainer.style.color = 'white';
    this.interactionContainer.style.fontSize = '2em';
    for(const key in rect) {
      this.interactionContainer.style[key] = `${rect[key]}px`;
    }
    this.interactionActive = true;
  }

  handleFullscreenClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    else {
      this.requestFullscreen();
    }
  }

  settingSelectionHandler = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    this.video.playbackRate = e.detail.item.value;
  }

  seek(value: number) {
    if (!this.videoLoaded) return;
    this.video.currentTime += value;
  }

  /*
  * speichere den letzten wert und schau ob starttime übersprungen wurde
  */
  handleTimeUpdate = (e: CustomEvent) => {
    if(this.showInteractions) {
    this.videoData.forEach((value, key) => {
      if(value.isReplace) {
        if(this.lastTimeupdate <= value.startTime && this.video.currentTime >= value.startTime) {
          if(this.activeElement != key) {
            this.changeActiveElement(key);
          }
          if(!this.video.paused)  {
            this.video.pause();
          }
          this.maximizeInteraction();
        }
      }
    })
    }
    this.lastTimeupdate = this.video.currentTime;
    this.progressBar.value = (this.video.currentTime / this.video.duration)*100;
    this.timeStamp.innerHTML = this.formatTime(this.lastTimeupdate) + '/' + this.videoDurationFormatted;
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

  formatTime(time: number) {
    let result =''
    const flooredTime = Math.floor(time), hours = Math.floor(time / 3600), minutes = Math.floor((flooredTime % 3600) / 60), seconds = flooredTime % 60;
    if(hours > 0) result += hours.toString() + ':';
    minutes < 10 ? result += '0' + minutes.toString() + ':' : result += minutes.toString() + ':';
    seconds < 10 ? result += '0' + seconds.toString() : result += seconds.toString();
    return result;
  }
  
  handleVideoClick = (e: MouseEvent) => {
    if (!this.videoLoaded) return;
    this.startStopVideo();
  }

  startStopVideo() {
    if (!this.videoLoaded) return;
    if (this.video.ended) {
      this.video.currentTime = 0;
    }
    this.video.paused ? this.video.play() : this.video.pause();
    this.playButton.innerHTML = this.video.paused ? 'Play' : 'Pause';
  }

  closeDrawer(e: CustomEvent) {
    if (!this.videoLoaded) return;
    this.drawer.open = !this.drawer.open;
  }

  handleMuteClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    const t = e.target as SlButton;
    t.innerHTML = this.video.muted ? 'Mute' : 'Unmute';
    this.video.muted = !this.video.muted;
  }

  handlePlayClick = (e: CustomEvent) => {
    this.startStopVideo()
  }

  /*
  * Sets up the video element once the metadata has been loaded
  */
  handleLoadedMetadata = () => {
    this.videoLoaded = true;
    this.progressBar.disabled = false;
    this.timeStamp.innerHTML = '00:00/' + this.formatTime(this.video.duration);
    this.progressBar.tooltipFormatter = (value: number) => this.formatTime(Math.floor((value / 100) * this.video.duration));
    this.video.controls = false;
    this.video.volume = 0.1;
    this.volumeSlider.disabled = false;
    this.videoDurationFormatted = this.formatTime(this.video.duration);
  }
}  





// TODOS:
// baubles perfekt alignen, maybe was zu tun mit progress bar step size?
// video hochladen - options funktionieren nicht?
// stop progressbar progression while seeking
// aggregate funktionen für alle interaktionen/einige interaktionen, z.b. shift-click für mehrere nach dem clicken der ersten
