import { html, css, _$LE } from "lit"
import {guard} from 'lit/directives/guard.js'
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
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js'
import { SlTextarea } from "@shoelace-style/shoelace"

import { videoData } from '../models/videoData'
import {WwInteractiveBauble} from './webwriter-interactive-bauble'
import { WwVideoInteraction } from './webwriter-video-interaction'
import { style } from '../widgetStyle.css'

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
import resize from "../assets/resize.svg"



@customElement("webwriter-interactive-video")
export class WebwriterInteractiveVideo extends LitElementWw {
  static get scopedElements() {
    return {
      'sl-textarea': SlTextarea,
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
      'sl-checkbox': SlCheckbox,
      'sl-icon': SlIcon
    }
  }

  static styles = style;
  

  @property({ type: Boolean })
  videoLoaded: boolean = false;

  @property({type: Boolean})
  interactionActive= false;

  @property({ type: String })
  videoDurationFormatted: string = '00:00';

  @property({ type: String, attribute: true, reflect: true,})
  videoBase64: string = '';

  @query('#fileInput')
  fileInput: HTMLInputElement;

  @property({ attribute: false })
  files: FileList;

  @query('#progress-bar')
  progressBar;

  @query('#controls-upper')
  upperControls: HTMLDivElement;

  @query('#video')
  videoElement: HTMLVideoElement;

  @query('#interactions-drawer')
  drawer: SlDrawer;

  @query('#time-stamp')
  timeStamp;

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
  showInteractions = false;

  @property({ type: String, attribute: true, reflect: true })
  interactionConfig: string = '[]';

  @property({type: Boolean, attribute: true, reflect: true})
  hasChapters = false;

  @property({type: Number})
  overlayZIndex = 50;

  @property({type: Boolean})
  isDragging = false;
 
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

  @property({type: HTMLVideoElement})
  video;

  /* ------------------------------------------------------------------------------------------------------------------------------------- */

  /*
  * Handles clicking of the Add button in the video control bar
  */
  handleAddClick = () => {
    if (!this.videoLoaded) return;
    if (!this.drawer.open) {
      this.drawer.open = true;
      this.overlayZIndex = 0;
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
      this.videoData.set(interaction.id, {
        isReplace: true, 
        startTime: this.video.currentTime, 
        endTime: 0});
      interaction.slot = 'interaction-slot';
      this.appendChild(interaction);
      this.changeActiveElement(interaction.id);
      this.replaceTimestamp.value = this.formatTime(this.video.currentTime);
    } else { // overlay
      this.showOverlaySettings();
      const interaction = document.createElement('webwriter-video-interaction') as WwVideoInteraction;
      interaction.setAttribute("id", `${WwInteractiveBauble.nextId++}`);
      this.videoData.set(interaction.id, {
        isReplace: false,
        startTime: this.video.currentTime,
        endTime: this.video.currentTime + 5, // Default 5 seconds duration
        position: { x: 0, y: 0 },
        content: 'Hello, World',
        size: { width: 100, height: 100 }
      });
      interaction.slot = 'interaction-slot';
      this.appendChild(interaction);
      this.changeActiveElement(interaction.id);
      this.setOverlaySettingsContentFromVideoSetting();
    }
    this.saveInteractionConfig();
  }

  setOverlaySettingsContentFromVideoSetting() {
    const data = this.videoData.get(this.activeElement);
    (this.shadowRoot.querySelector('sl-input[label="Start Time"]') as SlInput).value = this.formatTime(data.startTime);
    (this.shadowRoot.querySelector('sl-input[label="End Time"]') as SlInput).value = this.formatTime(data.endTime);
    (this.shadowRoot.querySelector('sl-input[label="X Position"]') as SlInput).value = `${data.position.x}`;
    (this.shadowRoot.querySelector('sl-input[label="Y Position"]') as SlInput).value = `${data.position.y}`;
    (this.shadowRoot.querySelector('sl-textarea[label="Content"]') as SlInput).value = `${data.content}`;
    (this.shadowRoot.querySelector('sl-input[label="Width"]') as SlInput).value = `${data.size.width}`;
    (this.shadowRoot.querySelector('sl-input[label="Height"]') as SlInput).value = `${data.size.height}`;
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
    /*this.volumeSlider.value = 10;
    this.interactionSlot.assignedElements().forEach((element: WwVideoInteraction) => {
      element.active = false;
    });
    // disable controls until video is loaded
    this.progressBar.setAttribute('disabled');
    this.volumeSlider.setAttribute('disabled');
    this.muteButton.disabled = true;
    this.fullscreenButton.disabled = true;
    this.settingsButton.disabled = true;
    this.addButton.disabled = true;
    this.playButton.disabled = true;
    */
  }

  
  handleBaubleClick(event: MouseEvent) {
    const clickedElement = event.target as WwInteractiveBauble;
    this.clickEventHelper(clickedElement.id);
    
  }

  clickEventHelper(id: number){
    this.changeActiveElement(id);
    const interactionData = this.videoData.get(id);
    
    if (interactionData.isReplace) {
      this.replaceTimestamp.value = this.formatTime(interactionData.startTime);
      this.showReplaceSettings();
    } else {
      this.showOverlaySettings();
      // Update overlay settings inputs
      (this.shadowRoot.querySelector('sl-input[label="Start Time"]') as SlInput).value = this.formatTime(interactionData.startTime);
      (this.shadowRoot.querySelector('sl-input[label="End Time"]') as SlInput).value  = this.formatTime(interactionData.endTime);
      (this.shadowRoot.querySelector('sl-input[label="X Position"]') as SlInput).value = `${interactionData.position.x}`;
      (this.shadowRoot.querySelector('sl-input[label="Y Position"]') as SlInput).value = `${interactionData.position.y}`;
      (this.shadowRoot.querySelector('sl-textarea[label="Content"]') as SlInput).value = `${interactionData.content}`;
      (this.shadowRoot.querySelector('sl-input[label="Width"]') as SlInput).value = `${interactionData.size.width}`;
      (this.shadowRoot.querySelector('sl-input[label="Height"]') as SlInput).value = `${interactionData.size.height}`;
    }
    
    if (!this.drawer.open) {
      this.drawer.open = true;
      this.overlayZIndex = 0;
    }
  }

  saveInteractionConfig() {
    const config = Array.from(this.videoData.entries()).map(([id, data]) => ({id, ...data}));
    this.interactionConfig = JSON.stringify(config);
  }
  
  loadInteractionConfig() {
    if (this.interactionConfig) {
      const config = JSON.parse(this.interactionConfig);
      this.videoData.clear();
      config.forEach(item => {
        const { id, ...data } = item;
        this.videoData.set(id, data);
      });
      this.requestUpdate();
    }
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


  handleTimeInputChange = (e: CustomEvent) => {
    const input = e.target as SlInput;
    const segments = input.value.split(':');
    if(segments.length <=1 || segments.length > 3 || segments.some((x => { return isNaN(Number(x)) }) )) {
      input.helpText = 'invalid time format, please use hh:mm:ss or mm:ss';
      return;
    } else if(segments.length  === 3) {
      let newTime = parseInt(segments[0]) * 3600+parseInt(segments[1])*60+parseInt(segments[2]); 
      if(newTime > this.video.duration || newTime < 0) {
        input.helpText = 'please stay within the videos duration'
        return;
      } else {
        this.videoData.get(this.activeElement).startTime = newTime
      }
    } else {
      let newTime = parseInt(segments[0]) * 60+parseInt(segments[1]); 
      if(newTime > this.video.duration || newTime < 0) {
        input.helpText = 'please stay within the videos duration'
        return;
      } else {
        this.videoData.get(this.activeElement).startTime = newTime;
      }
    }
    input.helpText = '';
    this.saveInteractionConfig();
    this.updateBaublePositions();
  }

  calculateOffset(forPosition?) {
    if(!this.videoLoaded) return;
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
    this.changeAddToTrash();
    console.log('1');
  }

  changeAddToTrash() {
    this.addButton.setAttribute('src',`${trash}`)
    this.addButton.style.color = 'hsl(0 72.2% 50.6%)';
  }

  changeTrashToAdd() {
    this.addButton.setAttribute('src',`${add}`)
    this.addButton.style.color = 'hsl(200.4 98% 39.4%)';
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
    this.saveInteractionConfig();
    this.updateBaublePositions();
    this.dropArea.style.background =  'none';
    this.changeTrashToAdd();
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
  }
  

  handleBaubleDroppedOnAdd(e: DragEvent) {
    console.log('something was dropped on add, and it was',e.target);
    this.dropArea.style.background =  'none';
    this.deleteElement();
    this.changeActiveElement(parseInt(e.dataTransfer.getData('previousActive')));
    this.changeTrashToAdd();
  }

  handleBaubleDraggedOverDropArea(e: DragEvent) {
    this.dropArea.style.background = 'rgba(0.5,0.5,0.5,0.5)'
  }

  handleBaubleLeaveDropArea(e: DragEvent) {
    this.dropArea.style.background =  'none'
  }

  render() {
    return html`
    <div style='display:flex;' part='options'>
      <sl-checkbox @sl-change=${this.handleShowInteractionsChange} style='overflow: hidden'>Show Interactions</sl-checkbox>
      <input name="fileInput" id="fileInput" type="file" @change=${this.videoToBase64} />
    </div>

    ${this.videoBase64?
      this.widget()
      : html`<sl-button @click=${() => this.fileInput.click()}>Upload</sl-button>`
    }
    `
  };

  widget() {
    return html`
      <div id='container-vertical'>
        <!-- container for the video element -->
        <div class='container-video' @click=${this.handleVideoClick}>
          ${this.video}
          ${this.videoLoaded ? this.renderOverlays() : undefined}
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
        <sl-drawer style="z-index: 100;"label='Add Interaction' contained id='interactions-drawer'>
          <sl-dropdown label='Interaction Type' id='interaction-type-dropdown' @sl-select=${this.handleInteractionTypeSelected}>
            <sl-button slot='trigger' id='interaction-type-button' caret>Interaction Type</sl-button>
            <sl-menu>
              <sl-menu-item value='1'>Replace</sl-menu-item>
              <sl-menu-item value='2'>Overlay</sl-menu-item>
            </sl-menu>
          </sl-dropdown>
          <div id='interaction-settings-container'>
            <div id='replace-interaction-settings' hidden>
              <sl-input id='replace-timestamp' label='Timestamp' @sl-change=${this.handleTimeInputChange}></sl-input>
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
            <sl-input label='Start Time' @sl-change=${this.handleTimeInputChange}></sl-input>
            <sl-input label='End Time' @sl-change=${this.handleTimeInputChange}></sl-input>
            <sl-input label='X Position' type="number" @sl-change=${this.handleOverlayPositionChange}></sl-input>
            <sl-input label='Y Position' type="number" @sl-change=${this.handleOverlayPositionChange}></sl-input>
            <sl-textarea label='Content' @sl-change=${this.handleOverlayContentChange}></sl-textarea>
            <sl-input label='Width' type="number" @sl-change=${this.handleOverlaySizeChange}></sl-input>
            <sl-input label='Height' type="number" @sl-change=${this.handleOverlaySizeChange}></sl-input>
          </div>
          <sl-button slot="footer" style="margin-top: 10px" variant="primary" @click=${this.closeDrawer}>Close</sl-button>
        </sl-drawer>
      </div>`;
  }
  
  handleOverlayPositionChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      const data = this.videoData.get(this.activeElement);
      data.position = data.position || { x: 0, y: 0 };
      data.position[input.label.toLowerCase() as 'x' | 'y'] = value;
      this.saveInteractionConfig();
    }
  }
  
  handleOverlayContentChange(e: CustomEvent) {
    const textarea = e.target as SlTextarea;
    this.videoData.get(this.activeElement).content = textarea.value;
    this.saveInteractionConfig();
  }
  
  handleOverlaySizeChange(e: CustomEvent) {
    const input = e.target as SlInput;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value > 0) {
      const data = this.videoData.get(this.activeElement);
      data.size = data.size || { width: 100, height: 100 };
      data.size[input.label.toLowerCase() as 'width' | 'height'] = value;
      this.saveInteractionConfig();
    }
  }

  deleteElement() {
    let activeId; 
    this.interactionSlot.assignedElements().forEach((element) => {
      if(element instanceof WwVideoInteraction && element.active) {
         activeId = element.id;
        element.remove();
      }
    });
    this.videoData.delete(activeId);
    this.saveInteractionConfig();
    this.closeDrawer();
    this.updateBaublePositions();
    this.requestUpdate();
  }



  updateBaublePositions() {
    const children = this.upperControls.children as any;
    for(let child of children)  {
      if(!(child instanceof WwInteractiveBauble)) continue;
      const newOffset = this.calculateOffset(this.videoData.get(child.id).startTime)
      if(newOffset) {
        child.setAttribute('offset',`${newOffset}`);
        console.log('puttin child with id ' + child.id + ' to ' + newOffset);
      }
    }
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
    this.drawer.hide();
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
    this.overlayZIndex = 0;
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
    this.videoLoaded = false;
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.loadInteractionConfig();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
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

  videoToBase64(e: Event) {
    this.files = (e.target as HTMLInputElement).files ?? this.files;
    let audioFile = this.files[0];

    console.log('reader');

    let reader = new FileReader();

    reader.onloadstart = (e) => {
        console.log('onloadstart', e);
    };

    reader.onprogress = (e) => {
        console.log('onprogress', e);
    };

    reader.onload = (e) => {
        console.log('onload', e);
        const video = document.createElement('video');
        video.src = e.target?.result as string;

        video.addEventListener('loadedmetadata', () => {
          console.log('loadedmetadata', video.duration);
            this.videoBase64 = e.target?.result as string;
        });
    };
    reader.readAsDataURL(audioFile);
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

  closeDrawer() {
    if (!this.videoLoaded) return;
    this.overlayZIndex = 50;
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

  renderOverlays() {
    return Array.from(this.videoData.entries())
      .filter(([_, data]) => !data.isReplace)
      .map(([id, data]) => {
        if (this.video.currentTime >= data.startTime && this.video.currentTime <= data.endTime) {
          return html`
            <div class="overlay-interaction" 
                 id="overlay-${id}"
                 @mousedown="${this.startDragging}"
                 @click="${this.handleOverlayClicked}"
                 style="position: absolute;
                        left: ${data.position?.x || 0}px; 
                        top: ${data.position?.y || 0}px; 
                        width: ${data.size?.width || 100}px; 
                        height: ${data.size?.height || 100}px;
                        z-index: ${this.overlayZIndex};
                        background: green;">
              ${(data.content || '')}
              <sl-icon style="position: absolute; bottom: 0; right: 0; ${this.overlayZIndex+1};"  @mousedown="${this.startResizing}" src=${resize}></sl-icon>
            </div>
          `;
        }
        return null;
      });
  }
  
  handleOverlayClicked = (event: MouseEvent) => {
    event.stopPropagation();
    if(this.isDragging){
      this.isDragging = false;
      return;
    }
    this.clickEventHelper(parseInt((event.currentTarget as HTMLElement).id.split('-')[1]));
  }

  startDragging(e: MouseEvent) {
    if(this.drawer.open) return;
    const overlay = e.currentTarget as HTMLElement;
    const startX = e.clientX - overlay.offsetLeft;
    const startY = e.clientY - overlay.offsetTop;
  
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;

      let newX = e.clientX - startX;
      let newY = e.clientY - startY;
      
      // Constrain to video boundaries
      const videoRect = this.video.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, videoRect.width - overlay.offsetWidth));
      newY = Math.max(0, Math.min(newY, videoRect.height - overlay.offsetHeight));
  
      overlay.style.left = `${newX}px`;
      overlay.style.top = `${newY}px`;
  
      // Update videoData
      const id = parseInt(overlay.id.split('-')[1]);
      this.videoData.get(id).position = { x: newX, y: newY };
    };
  
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.saveInteractionConfig();

    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  startResizing(e: MouseEvent) {
    if(this.drawer.open) return;
    e.stopPropagation();
    const overlay = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = overlay.offsetWidth;
    const startHeight = overlay.offsetHeight;
  
    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;
      let newWidth = startWidth + e.clientX - startX;
      let newHeight = startHeight + e.clientY - startY;
      
      // Constrain to video boundaries
      const videoRect = this.video.getBoundingClientRect();
      newWidth = Math.min(newWidth, videoRect.width - overlay.offsetLeft);
      newHeight = Math.min(newHeight, videoRect.height - overlay.offsetTop);
  
      overlay.style.width = `${newWidth}px`;
      overlay.style.height = `${newHeight}px`;
  
      // Update videoData
      const id = parseInt(overlay.id.split('-')[1]);
      this.videoData.get(id).size = { width: newWidth, height: newHeight };
    };
  
    const onMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.saveInteractionConfig();
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
    this.updateBaublePositions();
  }


}  

// TODOS:
// 
// video upload fixen
// first updated wird auch beim neu aufbauen aufgerufen
// choose which methods should only be applicable when content is editable