/**
 * Import Phaser dependencies using `expose-loader`.
 * This makes then available globally and it's something required by Phaser.
 * The order matters since Phaser needs them available before it is imported.
 */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';
import { Grid, recursiveBackTracker, addDoors } from './maze';
import { 
	GAME_SCALE, WALL_TILE, 
	KEY_TILE, KEY2_TILE, KEY3_TILE,
	DOOR_TILE, DOOR2_TILE, DOOR3_TILE,
	DOOR_OPEN_TILE, DOOR2_OPEN_TILE, DOOR3_OPEN_TILE,
	START_TILE, EMPTY_TILE, GOAL_TILE, ENEMY_TILE, 
	TILE_WIDTH, TILE_HEIGHT, NUM_TILES, BODY_H, BODY_LEFT, BODY_TOP, BODY_W 
} from './constants';

import MenuState from './MenuState';
import { levelData } from './level';

class Game extends Phaser.Game {
	
	constructor() {
		let cfg = {
			width: "100%",
			height: "100%",
			// multiTexture: true,	// disabled - this causes problems with the firefox/linux/mesa combo.
			parent: "mainDiv",
			enableDebug: false,
			antialias: false
		};

		super(cfg);
	}
}

const TILES_IMG = "sprites1";
const SPRITESHEET = "sprites2";

const UNIT = 64 * GAME_SCALE; // size of the square tiles in pixels

class GameState {
	
	// called once per session
	constructor() {
		console.log("GameState.constructor");

		this.frustrationScore = 0;
		this.frustrationCoeff = 1;
		this.collectedKeys = {};
		this.doorsAndKeys = {
			[DOOR_TILE]: {
				'openTile': DOOR_OPEN_TILE,
				'requiredKey': KEY_TILE
			},
			[DOOR2_TILE]: {
				'openTile': DOOR2_OPEN_TILE,
				'requiredKey': KEY2_TILE
			},
			[DOOR3_TILE]: {
				'openTile': DOOR3_OPEN_TILE,
				'requiredKey': KEY3_TILE
			}
		};
	}

	preload() {		
		this.load.image(TILES_IMG, "assets/sprites.png");
		this.load.spritesheet(SPRITESHEET, "assets/sprites.png", TILE_WIDTH, TILE_HEIGHT, NUM_TILES);
		this.load.tilemap("level", "assets/placeholder-level.json", null, Phaser.Tilemap.TILED_JSON);
		this.load.audio('mainSoundtrack', ['assets/music.mp3', 'assets/music.ogg']);
		this.cursors = this.game.input.keyboard.createCursorKeys();
	}

	// called everytime state is entered
	create () {
		console.log("GameState.create");
		this.game.stage.smoothed = false; // disable antialiasing

		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.physics.arcade.gravity.y = 0;

		this.music = this.game.add.audio('mainSoundtrack');
		this.music.play();

		this.currentLevel = 0;
		this.levelConfig = levelData[this.currentLevel]; 
		this.initLevel();
		this.cursors = this.game.input.keyboard.createCursorKeys();
	}

	initLevel() {
		const grid = new Grid(this.levelConfig.w, this.levelConfig.h);
		recursiveBackTracker(grid);
		addDoors(grid);

		// create a tilemap
		this.map = this.game.add.tilemap();
		this.map.setTileSize(TILE_WIDTH, TILE_HEIGHT);
		this.map.addTilesetImage(TILES_IMG);
		const map = this.map;

		this.l1 = grid.convertToMap(this.map);

		// l1.setScale works. l1.scale.setTo(2) disables collision!
		// see https://github.com/photonstorm/phaser/issues/2305
		this.l1.setScale(GAME_SCALE);

		//this.game.world.scale.setTo(3.0);
		this.l1.resizeWorld();

		this.keys = this.game.add.group();

		let playerTile;

		// extract player, target and and enemy locations
		for (let x = 0; x < map.width; ++x) {
			for (let y = 0; y < map.height; ++y) {
				const tile = map.getTile(x, y);
				const index = tile && tile.index;
				switch (index) {
					case WALL_TILE: // wall
						//tile.setCollision(true, true, true, true);
						//console.log(tile);
						break;
					case START_TILE: // player
						playerTile = tile;
						map.putTile(EMPTY_TILE, x, y);
						break;
					case EMPTY_TILE: // open area
						break;
					case DOOR_TILE: // door closed
					case DOOR2_TILE: // door closed
					case DOOR3_TILE: // door closed
						tile.properties['is_closed_door'] = true;
						tile.properties['x'] = x;
						tile.properties['y'] = y;
						break;
					case GOAL_TILE: // goal
						this.goal = tile;
						break;
					case ENEMY_TILE: // enemy
						break;
					case KEY_TILE: // key1
					case KEY2_TILE: // key2
					case KEY3_TILE: // key3
						//create object
						let newKey = this.keys.create(tile.worldX/GAME_SCALE + BODY_W/2, tile.worldY/GAME_SCALE + BODY_H/2, SPRITESHEET, index);
						newKey.data = { 'key_id' : index};
						this.game.physics.arcade.enable(newKey, Phaser.Physics.ARCADE);
						newKey.anchor.set(0.5);
						newKey.body.setSize(BODY_W, BODY_H, BODY_LEFT, BODY_TOP);
						this.game.physics.arcade.enable(newKey, Phaser.Physics.ARCADE);
						map.putTile(EMPTY_TILE, x, y);
						break;
					default:
						break;
				}
			}
		}

		this.keys.scale.setTo(GAME_SCALE);
		this.map.setCollision(WALL_TILE, true, this.l1);
		this.map.setCollision(DOOR_TILE, true, this.l1);
		this.map.setCollision(DOOR2_TILE, true, this.l1);
		this.map.setCollision(DOOR3_TILE, true, this.l1);
		this.map.setCollision(GOAL_TILE, true, this.l1);

		// this.map.createFromObjects('Tile Layer 1', KEY_TILE, SPRITESHEET, KEY_TILE, true, false, this.keys);
		
		this.player = this.game.add.sprite(0, 0, SPRITESHEET, START_TILE);
		this.player.animations.add('idle', [ 0x00, 0x01, 0x02 ], 3, true);
		this.player.animations.add('walk', [ 0x03, 0x04 ], 2, true);
		this.player.animations.play('walk');
		this.player.scale.setTo(GAME_SCALE);
		this.player.position.setTo(
			(playerTile.worldX + (GAME_SCALE*TILE_WIDTH/2)),
			(playerTile.worldY + (GAME_SCALE*TILE_HEIGHT/2))
		);

		this.monsters = this.game.add.group();
		this.monsters.scale.setTo(GAME_SCALE);
		this.initMonsters();

		this.game.physics.arcade.enable(this.player, Phaser.Physics.ARCADE);
		this.game.physics.arcade.enable(this.l1, Phaser.Physics.ARCADE);
		//this.game.physics.arcade.enable(this.keys, Phaser.Physics.ARCADE);

		this.player.anchor.set(0.5);
		
		//  This adjusts the collision body size.
		this.player.body.setSize(BODY_W, BODY_H, BODY_LEFT, BODY_TOP);

		this.game.camera.follow(this.player);
	}

	clearLevel() {
		this.collectedKeys = {};
		this.game.world.removeAll();
	}

	nextLevel() {
		this.clearLevel();
		this.currentLevel += 1;
		this.levelConfig = levelData[this.currentLevel]; 
		this.initLevel(); // initialize next level again
	}

	update() {
		this.player.body.velocity.x = 0;
		this.player.body.velocity.y = 0;

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


		this.game.physics.arcade.collide(this.player, this.l1, this.playerHitsWall, null, this);
		this.game.physics.arcade.collide(this.player, this.monsters, this.playerHitsMonster, null, this);
		this.game.physics.arcade.collide(this.monsters, this.l1, this.monsterHitsWall, null, this);
		this.game.physics.arcade.overlap(this.player, this.keys, this.playerFindsKey, null, this);
	}

	initMonsters() {
		let count = 5;
		for (let i = 0; i < count; i++ ) {
			//let newMonster = this.game.add.sprite(100, 110, SPRITESHEET, 5);
			let newMonster = this.monsters.create(100, 110, SPRITESHEET, ENEMY_TILE);
			newMonster.animations.add('idle', [ 0x10, 0x11, 0x12 ], 3, true);
			newMonster.animations.add('walk', [ 0x13, 0x14 ], 2, true);
			newMonster.animations.play('walk');
			newMonster.data['isChangingDirection'] = false;
		
			
			this.game.physics.arcade.enable(newMonster, Phaser.Physics.ARCADE);

			newMonster.anchor.set(0.5);
			//  This adjusts the collision body size.
			newMonster.body.setSize(BODY_W, BODY_H, BODY_LEFT, BODY_TOP);
			newMonster.body.bounce.set(1);
			let randomNumber = Math.floor((Math.random() * 4) + 1);
			switch (randomNumber) {
				case 1:
					newMonster.body.velocity.x = UNIT/10;
					newMonster.body.velocity.y = UNIT/10;
					break;
				case 2:
					newMonster.body.velocity.x = -UNIT/10;
					newMonster.body.velocity.y = UNIT/10;
					break;
				case 3:
					newMonster.body.velocity.x = UNIT/10;
					newMonster.body.velocity.y = -UNIT/10;
					break;
				case 4:
					newMonster.body.velocity.x = -UNIT/10;
					newMonster.body.velocity.y = -UNIT/10;
					break;
				default:
					break;
			}
		}
	}

	playerHitsWall(player, wall) {
		//console.log(wall);
		player.body.velocity.x = 0;
		player.body.velocity.y = 0;

		if (wall == this.goal) {
			this.nextLevel();
		} else if ( wall.properties['is_closed_door'] ) {
			let index = wall.index;
			console.log("Index is: " + index);
			console.log(this.doorsAndKeys);
			if ( index in this.doorsAndKeys ) {
				let requiredKey = this.doorsAndKeys[index]['requiredKey'];
				console.log("Required Key: " + requiredKey);
				if ( requiredKey && this.collectedKeys[requiredKey] ) {
					this.collectedKeys[requiredKey] -= 1;
					wall.properties['is_closed_door'] = false;
					let openTile = this.doorsAndKeys[index]['openTile'];
					let x = wall.x;
					let y = wall.y;
					console.log({'x': x, 'y': y});
					this.map.putTile(openTile, x, y);
					console.log("Unlocked!" + openTile);
				}

			}
			else {
				console.log("You don't have key dude.");
			}

		}
	}

	playerFindsKey(player, key) {
		let keyId = key.data.key_id;
		this.collectedKeys[keyId] = (this.collectedKeys[keyId]+1) || 1 ;
		key.kill();
		console.log("Collected the key with ID: " + keyId);
	}

	playerHitsMonster(player, monster) {
		
		console.log("MONSTER BITES YOU");
	}

	monsterHitsWall(monster, wall) {
		if ( monster.data['isChangingDirection'] == false ) {
			monster.data['isChangingDirection'] = true;
			this.game.time.events.add(Phaser.Timer.SECOND/4, function() {

				monster.data['isChangingDirection'] = false;
				if ( monster.body.velocity.x ) {
					let direction = Math.round(Math.random()) ? 1 : -1;
					monster.body.velocity.y = monster.body.velocity.x * direction;
					direction = Math.round(Math.random()) ? 1 : -1;
					monster.body.velocity.x = monster.body.velocity.x * direction;
				}
				if ( monster.body.velocity.y ) {
					let direction = Math.round(Math.random()) ? 1 : -1;
					monster.body.velocity.x = monster.body.velocity.y * direction;
					direction = Math.round(Math.random()) ? 1 : -1;
					monster.body.velocity.y = monster.body.velocity.y * direction;
				}
			}, this);
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
	game.state.add("MenuState", MenuState);
	game.state.add("GameState", GameState);
	game.state.start("MenuState");
};