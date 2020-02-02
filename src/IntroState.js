// import textPlugin from "./Text.js";

const INTRO_STYLE = {font: "32px pixelFont", fill: "#FD88D5", align: "left"};

export default class {
	/**
	 * @param {String} displayText The lookup key of the text that's going to be displayed next time you switch to this state.
	 * The lookup key should match one of the keys found in text.json data.
	 * @param {String} nextState Constant that indicates which state should be switched to afterwards.
	 */
	init (displayText, nextState) {
		// this.game.Text = this.game.plugins.add(textPlugin);
		this.displayText = displayText;
		this.nextState = nextState;
	}
	
	create() {
		this.game.stage.backgroundColor = "#000000";

		this.margin = Math.min(this.game.width / 10, this.game.height / 10);
		// this.lineHeight = 100;

		this.y = this.margin;
		this.x = this.margin;
		this.w = this.game.width - 2 * this.margin;
		this.h = this.game.height - 2 * this.margin;

		// running y counter
		// let yy = this.y;

		this.text = this.game.add.text(this.margin, this.margin, this.displayText, INTRO_STYLE);
		this.text.wordWrap = true;
		this.text.wordWrapWidth = this.w;

		this.game.time.events.add(Phaser.Timer.SECOND * 4, () => this.state.start(this.nextState));

	}
}