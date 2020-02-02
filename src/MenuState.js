import { lipsumText } from "./IntroState";

// import textPlugin from "../plugins/Text";

const MENU_BACKGROUND = 'TODO';
const GENERAL_STYLE = { font: "32px pixelFont", fill: "#5b5b5b"};
const TITLE_STYLE = {font: "36px pixelFont", fill: '#61447F'};

export default class {
	
	create() {
		this.game.sound.stopAll();
		
		var background = this.game.add.sprite(0, 0, MENU_BACKGROUND);
		background.width = this.game.world.width;
		background.height = this.game.world.height;
		background.alpha = 0.8;
		background.inputEnabled = true;

		var menuPositionY = this.game.world.height / 3;
		var menuPositionX = this.game.world.width / 3;

		this.game.add.text(menuPositionX, menuPositionY, 'MENU', TITLE_STYLE);

		var entryPosition = 60;

		var newGame = this.game.add.text(menuPositionX, menuPositionY + entryPosition, 'New Game', GENERAL_STYLE);
		newGame.inputEnabled = true;
		entryPosition += 60;

		newGame.events.onInputDown.add(() => this.state.start("IntroState", true, false, lipsumText, "GameState"));

		// var credits = this.game.add.text(menuPositionX, menuPositionY + entryPosition, 'Credits', GENERAL_STYLE);
		// credits.inputEnabled = true;

		// credits.events.onInputDown.add(function () {
		// 	this.state.start(Constants.TEXT_STATE, true, false, "credits", "MenuState");

		// }, this);
	}

}