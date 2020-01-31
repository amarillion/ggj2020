/**
 * Import Phaser dependencies using `expose-loader`.
 * This makes then available globally and it's something required by Phaser.
 * The order matters since Phaser needs them available before it is imported.
 */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

class Game extends Phaser.Game {
	
	constructor() {
		let cfg = {
			width: "100%",
			height: "100%",
			// multiTexture: true,	// disabled - this causes problems with the firefox/linux/mesa combo.
			parent: "mainDiv",
			enableDebug: false
		};

		super(cfg);
	}
}

const TILES_IMG = "sprites1";

class GameState {
	
	// called once per session
	constructor() {
		console.log("GameState.constructor");
	}

	preload() {		
		this.load.image(TILES_IMG, "assets/placeholder-sprites.png");
		this.load.tilemap("level", "assets/placeholder-level.json", null, Phaser.Tilemap.TILED_JSON);
	}

	// called everytime state is entered
	create () {
		console.log("GameState.create");
		this.game.stage.smoothed = false; // disable antialiasing

		// create a tilemap
		this.map = this.game.add.tilemap("level");
		console.log(this.map);
		this.map.addTilesetImage("sprites", TILES_IMG);
		this.l1 = this.map.createLayer("Tile Layer 1");
		console.log(this.l1);
		this.l1.scale.setTo(6.0);
		this.l1.resizeWorld();

		const map = this.map;

		let player;
		let goal;

		// extract player, target and and enemy locations
		for (let x = 0; x < map.width; ++x) {
			for (let y = 0; y < map.height; ++y) {
				const tile = map.getTile(x, y);
				const index = tile && tile.index;
				switch (index) {
				case 1: // wall
					break;
				case 2: // player
					player = tile;
					break;
				case 7: // open area
					break;
				case 3: // goal
					goal = tile;
					break;
				case 4: // enemy
					break;
				default:
					break;
				}
			}
		}
		
		console.log ({player, goal});

		const text = "- phaser -\n with a sprinkle of \n pixi dust.";
		const style = { font: "65px Arial", fill: "#ff0044", align: "center" };
	
		/* const t = */ this.add.text(this.world.centerX - 300, 0, text, style);	
	}
}

window.onload = () => {
	const game = new Game();
	game.state.add("GameState", GameState);
	game.state.start("GameState");
};
