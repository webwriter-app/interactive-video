# Interactive Video (`@webwriter/interactive-video@4.0.0`)
[License: MIT](LICENSE) | Version: 4.0.0

Add interactive popups to audio and video content. Supports several providers (YouTube, Vimeo, TikTok, direct links).

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Mondlandung | `@webwriter/interactive-video/snippets/Mondlandung.html` |



## `WebwriterInteractiveVideo` (`<webwriter-interactive-video>`)
An audio or video player to which authors add interactions: popups that appear at a given time and pause the media, and chapters.
The media is a file (stored as base64 in the widget's JSON data block, together with its details, the waveform and the chapters)
or a link to YouTube, Vimeo, TikTok, Spotify or a direct file. The player libraries for each kind of source are loaded when it is first used.
Interactions are `webwriter-video-interaction` children; keys the data block does not know are kept.
Space and K play and pause, F toggles fullscreen, M mutes, the arrow keys change volume and skip 5 s, J and L skip 10 s, C opens the chapters.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/interactive-video/widgets/webwriter-interactive-video.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/interactive-video/widgets/webwriter-interactive-video.js"></script>
<webwriter-interactive-video></webwriter-interactive-video>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/interactive-video
```

```html
<link href="@webwriter/interactive-video/widgets/webwriter-interactive-video.css" rel="stylesheet">
<script type="module" src="@webwriter/interactive-video/widgets/webwriter-interactive-video.js"></script>
<webwriter-interactive-video></webwriter-interactive-video>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterInteractiveVideo.dataType` | `string` | - | `"application/json"` | ✗ |
| `WebwriterInteractiveVideo.scopedElements` | `object` | The custom elements that can be used within the scope of the `webwriter-interactive-video` component. | `{ "sl-range": SlRange, "sl-dialog": SlDialog, "sl-button": SlButton, "sl-checkbox": SlCheckbox, "video-input-overlay": VideoInputOverlay, "video-controls-bar": VideoControlsBar, "video-chapter-drawer": VideoChapterDrawer, "interactions-progress-bar": InteractionsProgressBar, "video-player": VideoPlayer, }` | ✗ |
| `WebwriterInteractiveVideo.options` | `object` | - | `{ "hide-interactions": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Hide interactions") }, "hide-chapters": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Hide chapters") }, "disable-playback-rate-change": { type: "boolean" as const, group: "playback", label: (widget: Labelled) => widget.msg("Disable playback rate changes") }, }` | ✗ |
| `WebwriterInteractiveVideo.optionGroups` | `object` | - | `{ playback: { label: (widget: Labelled) => widget.msg("Playback"), collapsible: true, advanced: false }, }` | ✗ |
| `WebwriterInteractiveVideo.actions` | `object` | - | `{ importMedia: { label: (widget: Labelled) => widget.msg("Import media file"), group: "playback", icon: "Upload", input: { type: "file" as const, accept: "video/*,audio/*", multiple: false }, }, removeMedia: { label: (widget: Labelled) => widget.msg("Remove media"), group: "playback", icon: "Delete", intent: "danger" as const, confirm: (widget: Labelled) => widget.msg("Remove the current media and keep its interactions and chapters?"), }, // Player keys. They have no button in the editor's drawer. playPause: { hidden: true, shortcut: ["Space", "K"] }, toggleFullscreenByKey: { hidden: true, shortcut: "F" }, toggleMuteByKey: { hidden: true, shortcut: "M" }, volumeUp: { hidden: true, shortcut: "ArrowUp" }, volumeDown: { hidden: true, shortcut: "ArrowDown" }, skipForward: { hidden: true, shortcut: "ArrowRight" }, skipBackward: { hidden: true, shortcut: "ArrowLeft" }, skipForwardLong: { hidden: true, shortcut: "L" }, skipBackwardLong: { hidden: true, shortcut: "J" }, toggleChapters: { hidden: true, shortcut: "C" }, }` | ✗ |
| `localize` | - | - | - | ✗ |
| `msg` | - | - | - | ✗ |
| `fullscreen` | - | - | `new FullscreenController(this)` | ✗ |
| `interactions` | - | - | `new InteractionsController(this)` | ✗ |
| `loading` | - | - | `new LoadingController(this)` | ✗ |
| `playback` | - | - | `new PlaybackController(this)` | ✗ |
| `hideInteractions` (`hide-interactions`) | `boolean` | Whether interactions should be shown | `false` | ✓ |
| `hideChapters` (`hide-chapters`) | `boolean` | Whether the video has chapters and they should be shown | `false` | ✓ |
| `disablePlaybackRateChange` (`disable-playback-rate-change`) | `boolean` | Whether the user is allowed to change the playback rate | `false` | ✓ |
| `videoBase64` | `string` | Video file as a base64 string for offline storage. | `""` | ✗ |
| `videoURL` (`video-url`) | `string` | Video URL for online playback. | `""` | ✓ |
| `videoLoaded` (`videoLoaded`) | `boolean` | Indicates whether the video is currently loaded. | `false` | ✗ |
| `videoType` (`video-type`) | `string` | Type of the video source. | `"placeholder"` | ✓ |
| `videoDetails` | `{ title: string; author: string; duration: number }` | Details of the video, such as title, author, and duration. | `{ title: "", author: "", duration: 0, }` | ✗ |
| `waveformData` | `number[][] \| null` | Waveform data for audio visualization generated by WaveSurfer.js. | `null` | ✗ |
| `chapterConfig` | `Chapter[]` | Contains the current chapter configuration as an object. | `[]` | ✗ |
| `selectedInteractionId` (`selectedInteractionId`) | `number` | Contains the ID of the selected interaction. | `-1` | ✗ |
| `videoInteractions` | `WebwriterVideoInteraction[]` | The list of video interaction elements slotted into the component. | - | ✗ |
| `tabIndex` (`tabIndex`) | `number` | The tab index of the component. | `-1` | ✓ |
| `lastTimeUpdate` | `number` | The current time as last reported by the player; its change renders the widget again, which shows the interactions that are due. | `0` | ✗ |
| `videoContainerHeight` | `number` | - | `0` | ✗ |
| `videoContainerWidth` | `number` | - | `0` | ✗ |
| `videoPlayer` | `VideoPlayer` | The video player element | - | ✗ |
| `controlsElement` | `HTMLElement` | - | - | ✗ |
| `videoControlsBar` | `VideoControlsBar` | - | - | ✗ |
| `progressBar` | `SlRange` | - | - | ✗ |
| `videoAreaSize` | - | The size of the area that the player fills. | - | ✗ |
| `videoBaseSize` | - | The size of the player that interactions are positioned against. | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `importMedia` | - | `files: File[]`
| `removeMedia` | - | -
| `playPause` | Player keys, see `static actions`. | -
| `toggleFullscreenByKey` | - | -
| `toggleMuteByKey` | - | -
| `volumeUp` | - | -
| `volumeDown` | - | -
| `skipForward` | - | -
| `skipBackward` | - | -
| `skipForwardLong` | - | -
| `skipBackwardLong` | - | -
| `toggleChapters` | - | -
| `playVideo` | - | -
| `pauseVideo` | - | -
| `updateContext` | Writes the widget's state to its data block and renders it again. | -
| `updateBaublePositions` | - | -
| `clearVideo` | Clears the media and resets the player; the interactions and chapters go with it unless asked to stay. | `removeInteractions: boolean=true`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `draggable` | `false` |
| `definingAsContext` | `true` |
| `content` | `(webwriter-video-interaction)*` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, events, custom CSS properties, or CSS parts.*


## `WebwriterVideoInteraction` (`<webwriter-video-interaction>`)
`webwriter-video-interaction` is a custom element that represents an interaction in a `replace` interaction.
It extends `LitElementWw` and provides a slot for content insertion.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/interactive-video/widgets/webwriter-video-interaction.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/interactive-video/widgets/webwriter-video-interaction.js"></script>
<webwriter-video-interaction></webwriter-video-interaction>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/interactive-video
```

```html
<link href="@webwriter/interactive-video/widgets/webwriter-video-interaction.css" rel="stylesheet">
<script type="module" src="@webwriter/interactive-video/widgets/webwriter-video-interaction.js"></script>
<webwriter-video-interaction></webwriter-video-interaction>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterVideoInteraction.scopedElements` | `object` | - | `{ "sl-icon": SlIcon, }` | ✗ |
| `WebwriterVideoInteraction.options` | `object` | - | `{ startTime: { type: "number" as const, control: "duration" as const, min: 0, step: 0.1, group: "timing", label: (widget: Labelled) => widget.msg("Start time") }, endTime: { type: "number" as const, control: "duration" as const, min: 0, step: 0.1, group: "timing", label: (widget: Labelled) => widget.msg("End time") }, noInitialPause: { type: "boolean" as const, group: "timing", label: (widget: Labelled) => widget.msg("Do not pause when shown") }, posX: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("X position (%)"), min: 0, max: 100, step: 0.1, unit: "%" }, posY: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Y position (%)"), min: 0, max: 100, step: 0.1, unit: "%" }, width: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Width"), min: 10, step: 1, unit: "px" }, height: { type: "number" as const, group: "position", label: (widget: Labelled) => widget.msg("Height"), min: 10, step: 1, unit: "px" }, backgroundColor: { type: "color" as const, group: "appearance", label: (widget: Labelled) => widget.msg("Overlay color") }, }` | ✗ |
| `WebwriterVideoInteraction.optionGroups` | `object` | - | `{ timing: { label: (widget: Labelled) => widget.msg("Interaction timing"), collapsible: true, advanced: false }, position: { label: (widget: Labelled) => widget.msg("Position and size"), collapsible: true, advanced: true }, appearance: { label: (widget: Labelled) => widget.msg("Appearance"), collapsible: true, advanced: true }, }` | ✗ |
| `WebwriterVideoInteraction.actions` | `object` | - | `{ deleteInteraction: { label: (widget: Labelled) => widget.msg("Delete interaction"), group: "timing", icon: "Delete", intent: "danger" as const, confirm: (widget: Labelled) => widget.msg("Delete this interaction?"), }, }` | ✗ |
| `localize` | - | - | - | ✗ |
| `msg` | - | - | - | ✗ |
| `tabIndex` (`tabIndex`) | `number` | The tab index of the component. | `-1` | ✓ |
| `id` (`id`) | `string` | The interaction id. Must be unique. HTMLElement types `id` as a string, the Number converter turns the attribute into a number at runtime. | - | ✓ |
| `startTime` (`startTime`) | `number` | The interaction start time in seconds. | - | ✓ |
| `endTime` (`endTime`) | `number` | The interaction end time in seconds. | - | ✓ |
| `noInitialPause` (`noInitialPause`) | `boolean` | Whether the interaction should pause the video when shown. | `false` | ✓ |
| `hasPaused` (`hasPaused`) | `boolean` | Whether the interaction has already paused the video. | `false` | ✗ |
| `posX` (`posX`) | `number` | The x position of the interaction as a percentage of the video width. | - | ✓ |
| `posY` (`posY`) | `number` | The y position of the interaction as a percentage of the video height. | - | ✓ |
| `width` (`width`) | `number` | The width of the interaction in pixels. | - | ✓ |
| `height` (`height`) | `number` | The height of the interaction in pixels. | - | ✓ |
| `backgroundColor` (`background-color`) | `string \| undefined` | The background color of the interaction overlay. | `undefined` | ✓ |
| `parentWidth` (`parentWidth`) | `number` | The width of the parent video player. | - | ✗ |
| `parentHeight` (`parentHeight`) | `number` | The height of the parent video player. | - | ✗ |
| `videoBaseWidth` (`videoBaseWidth`) | `number` | The video width in non-full-screen mode. | `800` | ✗ |
| `videoBaseHeight` (`videoBaseHeight`) | `number` | The video height in non-full-screen mode. | `450` | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `deleteInteraction` | - | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Events
| Name | Description |
| :--: | :---------: |
| positionChanged | - |
| interactionClicked | - |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `draggable` | `false` |
| `definingForContent` | `true` |
| `isolating` | `true` |
| `content` | `(flow)*` |
| `uninsertable` | `true` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*