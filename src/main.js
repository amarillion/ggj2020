/**
 * Import Phaser dependencies using `expose-loader`.
 * This makes then available globally and it's something required by Phaser.
 * The order matters since Phaser needs them available before it is imported.
 */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';
import { Grid, binaryTree } from './maze';

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

const UNIT = 160; // size of the square tiles in pixels

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

		const grid = new Grid(10, 10);
		binaryTree(grid);
	
		// create a tilemap
		this.map = this.game.add.tilemap();
		this.map.setTileSize(8, 8);
		this.map.addTilesetImage(TILES_IMG);
		const map = this.map;

		this.l1 = grid.convertToMap(this.map);

		//this.game.world.scale.setTo(3.0);
		this.l1.resizeWorld();

		let playerTile;
		let goal;

		// extract player, target and and enemy locations
		for (let x = 0; x < map.width; ++x) {
			for (let y = 0; y < map.height; ++y) {
				const tile = map.getTile(x, y);
				const index = tile && tile.index;
				switch (index) {
					case 0: // wall
						//tile.setCollision(true, true, true, true);
						//console.log(tile);
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


		this.map.setCollision(0, true, this.l1);
		
		this.player = this.game.add.sprite(100, 100, SPRITESHEET, 3);
		
		this.player.anchor.set(0.5);
		this.game.physics.arcade.enable([this.player, this.l1], Phaser.Physics.ARCADE);
		
		//  This adjusts the collision body size.
		this.player.body.setSize(8, 8, 0, 0);

		this.game.camera.follow(this.player);

		this.cursors = this.game.input.keyboard.createCursorKeys();

		//this.player = player;

		// const text = "- phaser -\n with a sprinkle of \n pixi dust.";
		// const style = { font: "65px Arial", fill: "#ff0044", align: "center" };
	
		/* const t = */ // this.add.text(this.world.centerX - 300, 0, text, style);	
	}


	update() {
		this.player.body.velocity.x = 0;
		this.player.body.velocity.y = 0;
		
		this.game.physics.arcade.collide(this.player, this.l1, null, null, this);

		if (this.cursors.left.isDown)
		{
			this.player.body.velocity.x = -UNIT;
		}
		if (this.cursors.right.isDown)
		{
			this.player.body.velocity.x = UNIT;
		}

		if (this.cursors.up.isDown)
		{
			this.player.body.velocity.y = -UNIT;
		}

		if (this.cursors.down.isDown)
		{
			this.player.body.velocity.y = UNIT;
		}

	}

	render() {

		if ( this.game.enableDebug ) {
			this.game.debug.bodyInfo(this.player, 32, 32);
		
			this.game.debug.body(this.player);
		}
	
	}
}

window.onload = () => {
	const game = new Game();
	game.state.add("GameState", GameState);
	game.state.start("GameState");
};