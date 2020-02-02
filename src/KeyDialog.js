import { YELLOW, BLUE, RED, ALL_KEYS } from "./constants.js";
import { shuffle } from "./maze.js";

const OPTION_STYLE = {font: "32px pixelFont", fill: '#00FFA5'};
const NUM_KEYS = 3;

export class KeyManager {
	
	constructor() {
		this.reset();
	}

	reset() {
		// door to key mapping
		this.mapping = {
			[RED] : RED,
			[BLUE] : BLUE,
			[YELLOW]: YELLOW
		};
	}

	getKeyNeededForDoor(key) {
		return this.mapping[key];
	}

	randomize() {
		const [ key1, key2, key3 ] = shuffle(ALL_KEYS);
		this.mapping = {
			[RED]: key1,
			[BLUE]: key2,
			[YELLOW]: key3
		};
	}

	getReplyOptions() {
		const result = [];
		const color = {
			[RED]: "red",
			[BLUE]: "blue",
			[YELLOW]: "yellow",
		};
		let i = 0;
		for (const key of ALL_KEYS) {
			result.push({
				idx: i++,
				id: key,
				msg: `The ${color[this.mapping[key]]} key opens ${color[key]} doors`
			});
		}
		return result;
	}

	swapKey(index) {
		const i = ALL_KEYS[(index) % NUM_KEYS];
		const j = ALL_KEYS[(index + 1) % NUM_KEYS];
		[ this.mapping[i], this.mapping[j] ] = [ this.mapping[j], this.mapping[i] ];
	}
}


export default class {

	constructor(state, keyManager) {
		this.state = state;
		this.game = state.game;
		this.keyManager = keyManager;
		this.keyManager.randomize();
	}

	showDialog() {
		if (this.active) return;

		this.active = true;
		this.state.uiBlocked = true;

		// calculate a reasonable margin, 10% of width or 10% of height, whichever is smaller.
		this.margin = Math.min(this.game.width / 10, this.game.height / 10);
		this.lineHeight = 100;

		this.y = this.margin;
		this.x = this.margin;
		this.w = this.game.width - 2 * this.margin;
		this.h = this.game.height - 2 * this.margin;

		// running y counter
		var yy = this.y;

		this.objects = [];
		this.options = [];
		this.optionWidgets = [];

		// semi-transparent black background
		var bg = this.game.add.graphics(this.game.width, this.game.height);
		bg.beginFill("#000000", 0.7);
		bg.x = this.x;
		bg.y = this.y;
		bg.drawRect(0, 0, this.w, this.h);
		bg.fixedToCamera = true;

		this.objects.push(bg);

		const replyOptions = this.keyManager.getReplyOptions();
		const PADDING = 16;

		for (let replyOption of replyOptions) {

			var optionWidget = this.game.add.text(this.x, yy, "PLACEHOLDER", OPTION_STYLE);
			optionWidget.wordWrap = true;
			optionWidget.wordWrapWidth = this.w;

			yy += optionWidget.height + PADDING;

			optionWidget.fixedToCamera = true;
			optionWidget.inputEnabled = true;
			optionWidget.events.onInputDown.add(function () {
				this.activate(replyOption.idx);
			}, this);

			this.options.push(replyOption);
			this.objects.push(optionWidget);
			this.optionWidgets.push(optionWidget);
		}

		this.refreshOptions();
		this.focusOption(0);
	}

	refreshOptions() {
		const replyOptions = this.keyManager.getReplyOptions();
		for (let i = 0; i < replyOptions.length; ++i) {
			this.optionWidgets[i].text = replyOptions[i].msg;
		}
	}

	activate(idx) {
		console.log("activated", idx);
		this.keyManager.swapKey(idx);
		this.refreshOptions();
		this.focusOption(idx + 1);
	}

	hasActiveDialog() {
		return this.active;
	}

	spacePressed() {
		let option = this.options[this.selectedIndex];
		if (option !== undefined) {
			this.activate(option.idx);
		}
	}

	upPressed() {
		this.focusOption(this.selectedIndex - 1);
	}

	downPressed() {
		this.focusOption(this.selectedIndex + 1);
	}

	focusOption(index) {
		// clear the animation on the old option
		if (this.tween !== undefined) { this.tween.stop(); }
		let oldOption = this.optionWidgets[this.selectedIndex];
		if (oldOption !== undefined) oldOption.alpha = 1.0;

		// selected a new option and wrap around the index
		this.selectedIndex = index;
		if (this.selectedIndex < 0) this.selectedIndex = this.optionWidgets.length-1;
		if (this.selectedIndex >= this.optionWidgets.length) this.selectedIndex = 0;

		// animate the newly selected option
		let option = this.optionWidgets[this.selectedIndex];
		this.tween = this.game.add.tween(option).to( { alpha: 0.5 }, 300, "Linear", true).yoyo().loop();
	}

	close() {
		this.state.uiBlocked = false;
		this.active = false;

		// destroy all components of the dialog
		this.objects.forEach(function (element) {
			element.destroy();
		});
	}
	
}
