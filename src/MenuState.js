import { lipsumText } from "./IntroState";

const creditsText = `Game created for Global Game Jam 2020 in 48 hours

A. B. "C" Gokhan (Graphical Design)
Ekrem "Secret weapon" Atamer (Graphical Design, Voice, Lore)
Gökçe "SUPERDAZE" Özaydın (Music, SFX, Trailer, Voice)
Kerem "Elvendor" Gokhan (Coding)
Martijn "Amarillion" van Iersel (Coding)

Find the code on http://github.com/amarillion/ggj2020/
`;

// import textPlugin from "../plugins/Text";

const GENERAL_STYLE = { font: "32px pixelFont", fill: "#Ab0000"};
const TITLE_STYLE = {font: "36px pixelFont", fontWeight: 'bold', fill: '#A10000'};

export default class {
	
	create() {
		this.game.sound.stopAll();
		
		var background = this.game.add.sprite(0, 0, "menubg");
		background.width = this.game.world.width;
		background.height = this.game.world.height;
		background.alpha = 0.8;
		background.inputEnabled = true;

		var menuPositionY = this.game.world.height * 0.4;
		var menuPositionX = this.game.world.width * 0.33;

		this.game.add.text(menuPositionX, menuPositionY, 'MENU', TITLE_STYLE);

		var entryPosition = 60;

		var newGame = this.game.add.text(menuPositionX, menuPositionY + entryPosition, 'New Game', GENERAL_STYLE);
		newGame.inputEnabled = true;
		entryPosition += 60;

		newGame.events.onInputDown.add(() => this.state.start("IntroState", true, false, lipsumText, "GameState"));


		var credits = this.game.add.text(menuPositionX, menuPositionY + entryPosition, 'Credits', GENERAL_STYLE);
		credits.inputEnabled = true;

		credits.events.onInputDown.add(function () {
			this.state.start("IntroState", true, false, creditsText, "MenuState");
		}, this);
	}

}