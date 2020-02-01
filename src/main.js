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
const SPRITESHEET = "sprites2";

const UNIT = 320; // size of the square tiles in pixels

class GameState {
	
	// called once per session
	constructor() {
		console.log("GameState.constructor");
	}

	preload() {		
		this.load.image(TILES_IMG, "assets/placeholder-sprites.png");
		this.load.spritesheet(SPRITESHEET, "assets/placeholder-sprites.png", 8, 8, 63);
		this.load.tilemap("level", "assets/placeholder-level.json", null, Phaser.Tilemap.TILED_JSON);
		this.cursors = this.game.input.keyboard.createCursorKeys();
	}

	// called everytime state is entered
	create () {
		console.log("GameState.create");
		this.game.stage.smoothed = false; // disable antialiasing

		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.physics.arcade.gravity.y = 0;

		// create a tilemap
		this.map = this.game.add.tilemap("level");
		console.log(this.map);
		this.map.addTilesetImage("sprites", TILES_IMG);
		this.l1 = this.map.createLayer("Tile Layer 1");
		console.log(this.l1);
		this.l1.scale.setTo(6.0);
		this.l1.resizeWorld();

		const map = this.map;

		let playerTile;
		let goal;

		// extract player, target and and enemy locations
		for (let x = 0; x < map.width; ++x) {
			for (let y = 0; y < map.height; ++y) {
				const tile = map.getTile(x, y);
				const index = tile && tile.index;
				switch (index) {
				case 1: // wall
					this.map.setCollision(index, true, this.l1);
					break;
				case 2: // player
					playerTile = tile;
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
		
		this.player = this.game.add.sprite(100, 100, SPRITESHEET, 2);
		
		this.player.anchor.set(0.5);
		this.game.physics.arcade.enable(this.player);
		
		//  This adjusts the collision body size.
		this.player.body.setSize(32, 32, 0, 0);

		this.game.camera.follow(this.player);

		this.cursors = this.game.input.keyboard.createCursorKeys();
		//console.log ({this.player, goal});

		//this.player = player;

		// const text = "- phaser -\n with a sprinkle of \n pixi dust.";
		// const style = { font: "65px Arial", fill: "#ff0044", align: "center" };
	
		/* const t = */ // this.add.text(this.world.centerX - 300, 0, text, style);	
	}


	update() {
		this.player.body.velocity.x = 0;
		this.player.body.velocity.y = 0;
		
		//this.game.physics.arcade.collide(this.player, this.l1);
		// console.log ("Old position x: " + this.player.x + ", y: " + this.player.y);

		if (this.cursors.left.isDown)
		{
			this.player.body.velocity.x = -UNIT;
		}
		else if (this.cursors.right.isDown)
		{
			this.player.body.velocity.x = UNIT;
		}

		if (this.cursors.up.isDown)
		{
			this.player.body.velocity.y = -UNIT;
		}
		else if (this.cursors.down.isDown)
		{
			this.player.body.velocity.y = UNIT;
		}

	}
}

window.onload = () => {
	const game = new Game();
	game.state.add("GameState", GameState);
	game.state.start("GameState");
};
