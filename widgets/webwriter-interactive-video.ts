import { html, css, _$LE } from "lit"
import { LitElementWw } from "@webwriter/lit"
import { LitElement } from "lit"
import { customElement, property, query } from "lit/decorators.js"

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.component.js'
import SlCard from '@shoelace-style/shoelace/dist/components/card/card.component.js'
import SlIconButton from '@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer.component.js'
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js'
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js'
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.component.js'
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js'
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js'

import { videoData } from '../models/videoData'
import {WwInteractiveBauble} from './webwriter-interactive-bauble'
import { WwVideoInteraction } from './webwriter-video-interaction'

import play from "../assets/play.svg"
import pause from "../assets/pause.svg"
import volumeDown from "../assets/volumeDown.svg"
import volumeOff from "../assets/volumeOff.svg"
import volumeMute from "../assets/volumeMute.svg"
import volumeUp from "../assets/volumeUp.svg"

import add from "../assets/add.svg"
import fullscreenEnter from "../assets/fullscreenEnter.svg"
import fullscreenExit from "../assets/fullscreenExit.svg"
import gear from "../assets/gear.svg"
import trash from "../assets/trash.svg"


@customElement("webwriter-interactive-video")
export class WebwriterInteractiveVideo extends LitElementWw {
  static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-input': SlInput,
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
    height:20px;
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

  .icon-button {
    text-align: center;
    font-size: 2rem;
  }

  #add-button {
    color: hsl(200.4 98% 39.4%);
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

  @query('#controls-upper')
  upperControls: HTMLDivElement;

  @query('#interactions-drawer')
  drawer: SlDrawer;

  @query('#time-stamp')
  timeStamp;

  @query('#video')
  video: HTMLVideoElement;

  @query('#volume-slider')
  volumeSlider;

  @query('#interaction-container')
  interactionContainer : HTMLDivElement;

  @query('#interaction-slot')
  interactionSlot : HTMLSlotElement;

  @query('#replace-timestamp')
  replaceTimestamp : SlInput;

  @property()
  activeElement : number;

  @query('#drop-area')
  dropArea;

  @property()
  videoData : Map<number, videoData> = new Map()

  @property()
  lastTimeupdate : number = 0;

  @property({type: Boolean})
  showInteractions: boolean = false;
 
  // Button queries

  @query('#play')
  playButton: SlButton;

  @query('#mute-volume-button')
  muteButton: SlButton;

  @query('#fullscreen-button')
  fullscreenButton: SlButton;

  @query('#add-button')
  addButton: SlButton;

  @query('#settings-button')
  settingsButton: SlButton;
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
    this.volumeSlider.value = 10;

    // disable controls until video is loaded
    this.progressBar.setAttribute('disabled');
    this.volumeSlider.setAttribute('disabled');
    this.muteButton.disabled = true;
    this.fullscreenButton.disabled = true;
    this.settingsButton.disabled = true;
    this.addButton.disabled = true;
    this.playButton.disabled = true;
  }

  
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;
    this.changeActiveElement(clickedElement.id);
    this.activeElement = clickedElement.id;
    this.replaceTimestamp.value = this.formatTime(this.videoData.get(clickedElement.id).startTime);
    if(!this.drawer.open) this.drawer.open=true;
  }

  changeActiveElement(newActive: number) {
    this.activeElement = newActive;
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
    if(segments.length <=1 || segments.length > 3 || segments.some((x => { return isNaN(Number(x)) }) )) {
      this.replaceTimestamp.helpText = 'invalid time format, please use hh:mm:ss or mm:ss';
      return;
    } else if(segments.length  === 3) {
      let newTime = parseInt(segments[0]) * 3600+parseInt(segments[1])*60+parseInt(segments[2]); 
      if(newTime > this.video.duration || newTime < 0) {
        this.replaceTimestamp.helpText = 'please stay within the videos duration'
        return;
      } else {
        this.videoData.get(this.activeElement).startTime = newTime
      }
    } else {
      let newTime = parseInt(segments[0]) * 60+parseInt(segments[1]); 
      if(newTime > this.video.duration || newTime < 0) {
        this.replaceTimestamp.helpText = 'please stay within the videos duration'
        return;
      } else {
        this.videoData.get(this.activeElement).startTime = newTime;
      }
    }
    this.replaceTimestamp.helpText = '';
    this.updateBaublePositions();
  }

  calculateOffset(forPosition?) {
    const rect = this.video.getBoundingClientRect()
    if(forPosition) {
      return (forPosition / this.video.duration) * 0.95 * rect.width;
    };
    return (this.video.currentTime / this.video.duration) * 0.95 * rect.width ; 
  }

  handleShowInteractionsChange = (e: CustomEvent) => {
    const target = e.target as SlCheckbox;
    this.showInteractions = target.checked;
  }

  handleBaubleDragStart = (e:DragEvent) => {
    e.dataTransfer.setData('id', (e.target as WwInteractiveBauble).id);
    e.dataTransfer.setData('previousActive', `${this.activeElement}`);
    this.changeActiveElement((e.target as WwInteractiveBauble).id);
    this.addButton.setAttribute('src',`${trash}`)
    this.addButton.style.color = 'hsl(0 72.2% 50.6%)';
  }
  
  handleBaubleDragEnd = (e:DragEvent) => {
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.dropArea.style.background =  'none'
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
  }

  handleBaubleDroppedOnDropArea(e: DragEvent) {
    const rect = this.dropArea.getBoundingClientRect();
    const distanceFromLeft = e.clientX - rect.left;
    this.videoData.get(parseInt(e.dataTransfer.getData('id'))).startTime = Math.floor(this.video.duration * (distanceFromLeft/rect.width));
    this.updateBaublePositions();
    this.dropArea.style.background =  'none';
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
  }
  

  handleBaubleDroppedOnAdd(e: DragEvent) {
    this.dropArea.style.background =  'none';
    this.deleteElement();
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
  }

  handleBaubleDraggedOverDropArea(e: DragEvent) {
    this.dropArea.style.background = 'rgba(0.5,0.5,0.5,0.5)'
  }

  handleBaubleLeaveDropArea(e: DragEvent) {
    this.dropArea.style.background =  'none'
  }

  render() {
    return html`
    <div style='display:flex;'>
      <sl-checkbox @sl-change=${this.handleShowInteractionsChange} style='overflow: hidden'>Show Interactions</sl-checkbox>
    </div>
    <div id='container-vertical'>
        <!-- container for the video element -->
        <div class='container-video' @click=${this.handleVideoClick}>
          <video id='video' preload='metadata' src="http://media.w3.org/2010/05/sintel/trailer.mp4" poster='https://assets.codepen.io/32795/poster.png' @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}>
            <source id='mp4'  type='video/mp4' />
          </video>
        </div>
        <!-- container for the controls -->
        <div id='controls'>
          <div id='drop-area' @drop=${this.handleBaubleDroppedOnDropArea} @dragover=${this.handleBaubleDraggedOverDropArea} @dragleave=${this.handleBaubleLeaveDropArea}>
            <div id='controls-upper'>
              ${Array.from(this.videoData.entries()).map(([key, value]) => {
                return html`
                <webwriter-interactive-bauble 
                  style='transform: translateY(0px);'
                  initialOffset=${this.calculateOffset()}
                  @dragstart=${this.handleBaubleDragStart}
                  @dragend=${this.handleBaubleDragEnd} 
                  draggable="true" 
                  @click=${this.handleBaubleClick} 
                  id=${key}>
                </webwriter-interactive-bauble>`;
              })}
            </div>
          </div>
            <sl-range id='progress-bar' @sl-change=${this.handleProgressChange}></sl-range>
          <div id='controls-lower'>
            <!-- contains the play button and the time stamp -->
            <div id='controls-lower-left'>
              <sl-icon-button class='icon-button' id='play' @click=${this.handlePlayClick} src='${play}'></sl-icon-button>
              <p id='time-stamp'>00:00/00:00</p>
            </div>
            <!-- contains the volume slider and other controls -->
            <div id='controls-lower-right'>
              <sl-icon-button class='icon-button' id='mute-volume-button' @click=${this.handleMuteClick} src='${volumeDown}'></sl-icon-button>
              <sl-range id='volume-slider' @sl-change=${this.handleVolumeChange}></sl-range>
              <sl-icon-button class='icon-button' src='${add}' id='add-button' @click=${this.handleAddClick} @drop=${this.handleBaubleDroppedOnAdd} enabled=${this.isContentEditable}></sl-icon-button>
              <sl-dropdown placement='top-start' id='settings-menu' @sl-select=${this.settingSelectionHandler}>
                <sl-icon-button class='icon-button' id='settings-button' src='${gear}' slot='trigger'></sl-icon-button>
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
              <sl-icon-button class='icon-button' id='fullscreen-button' src='${fullscreenEnter}' @click=${this.handleFullscreenClick}></sl-icon-button>
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
                ${this.isContentEditable ? html`<slot name='interaction-slot' id='interaction-slot'> </slot>`: null}
                <div id='interaction-button-group'>
                  <sl-button @click=${this.toggleInteractionView}> ${this.interactionActive? 'Return to Video' : 'View Interaction'} </sl-button>
                  ${this.interactionActive ? html``: html`<sl-button variant='danger' @click=${this.deleteElement}> Delete </sl-button>`}
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

  deleteElement() {
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

  updateBaublePositions() {
    const children = this.upperControls.children as any;
    for(let child of children)  {
      if(!(child instanceof WwInteractiveBauble)) continue;
      const newOffset = this.calculateOffset(this.videoData.get(child.id).startTime)
      if(newOffset) child.setAttribute('offset',`${newOffset}`);
    }
  }

  /**
   * 
   * Minimizes the interaction container.
   */
  minimizeInteraction() {
    //this.drawer.hide();
    //maybe delay this code so the animation of the drawer closing isnt playing
    this.interactionContainer.style.position = 'initial';
    this.interactionContainer.style.zIndex = '0';
    this.interactionContainer.style.backgroundColor = 'transparent';
    this.interactionContainer.style.left = '0';
    this.interactionContainer.style.width = '100%';
    this.interactionContainer.style.height = '30%';
    this.interactionContainer.style.color = 'black';
    this.interactionContainer.style.fontSize = '1em';
    this.interactionActive = false;
    this.interactionContainer.style.transform = 'translateX(7px)';
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
    this.interactionContainer.style.transform = 'translateX(-20px)';
    this.interactionActive = true;
  }

  handleFullscreenClick = () => {
    if (document.fullscreenElement) {
      this.fullscreenButton.setAttribute('src',`${fullscreenEnter}`);
      document.exitFullscreen();
    }
    else {
      this.fullscreenButton.setAttribute('src',`${fullscreenExit}`);
      this.requestFullscreen();
    }
  }

  volumeButtonIconHelper() {
    if(this.video.muted) return;
    if(this.volumeSlider.value === 0) this.muteButton.setAttribute('src',`${volumeOff}`);
    else this.volumeSlider.value < 50 ? this.muteButton.setAttribute('src',`${volumeDown}`) : this.muteButton.setAttribute('src',`${volumeUp}`) 
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
            this.playButton.setAttribute('src',`${play}`);
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

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  handleFullscreenChange = (event: Event) => {
    this.updateBaublePositions();
  }
  
  handleVolumeChange = (e: CustomEvent) => {
    const volumeSlider = e.target as SlRange;
    this.video.volume = volumeSlider.value / 100;
    this.volumeButtonIconHelper();
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
    if(this.video.paused) {
      this.video.play();
      this.playButton.setAttribute('src',`${pause}`)
    }  else {
      this.video.pause();
      this.playButton.setAttribute('src',`${play}`)
    }
  }
  closeDrawer(e: CustomEvent) {
    if (!this.videoLoaded) return;
    this.drawer.open = !this.drawer.open;
  }

  handleMuteClick = (e: CustomEvent) => {
    if (!this.videoLoaded) return;
    const t = e.target as SlButton;
    if(this.video.muted) {
      this.video.muted = false;
      this.volumeButtonIconHelper();
    } else {
      this.video.muted = true;
      this.muteButton.setAttribute('src',`${volumeMute}`)
    }
  }

  handlePlayClick = (e: CustomEvent) => {
    this.startStopVideo()
  }


  /*
  * Sets up the video element once the metadata has been loaded
  */
  handleLoadedMetadata = () => {
    if(this.isContentEditable) this.addButton.disabled = false;
    this.timeStamp.innerHTML = '00:00/' + this.formatTime(this.video.duration);
    this.progressBar.tooltipFormatter = (value: number) => this.formatTime(Math.floor((value / 100) * this.video.duration));
    this.video.controls = false;
    this.video.volume = 0.1;
    this.videoLoaded = true;
    this.progressBar.removeAttribute('disabled');
    this.volumeSlider.removeAttribute('disabled');
    this.muteButton.disabled = false;
    this.playButton.disabled = false;
    this.addButton.disabled = false;
    this.settingsButton.disabled = false;
    this.fullscreenButton.disabled = false;
    this.videoDurationFormatted = this.formatTime(this.video.duration);
  }
}  





// TODOS:
// first updated wird auch beim neu aufbauen aufgerufen
// choose which methods should only be applicable when content is editable
// save videoData in an attribute and rebuild data structure when the widget is reloaded
// figure out why there is multiple widgets showing when you do switch
// bauble offset changen wenn input geändert wird
// bauble drag and drop (drag to delete?)
// calc bauble offset in %
// video hochladen - options funktionieren nicht? - funktionalität existiert bereits in vorhandenem video widget - fragen ob ich das einfach übernehmen kann
