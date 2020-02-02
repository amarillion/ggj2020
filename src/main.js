/**
 * Import Phaser dependencies using `expose-loader`.
 * This makes then available globally and it's something required by Phaser.
 * The order matters since Phaser needs them available before it is imported.
 */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';
import { genMazeAndAddDoors, pickOne } from './maze';
import { 
	GAME_SCALE, WALL_TILE, 
	KEY_TILE_BLUE, KEY_TILE_YELLOW, KEY_TILE_RED,
	DOOR_TILE_BLUE, DOOR_TILE_YELLOW, DOOR_TILE_RED,
	DOOR_OPEN_TILE_BLUE, DOOR_OPEN_TILE_YELLOW, DOOR_OPEN_TILE_RED,
	START_TILE, EMPTY_TILE, GOAL_TILE, ENEMY_TILE, 
	TILE_WIDTH, TILE_HEIGHT, NUM_TILES, BODY_H, BODY_LEFT, BODY_TOP, BODY_W,
	MONSTER_HIT, TIME_HIT, KEY_GAIN, DOOR_GAIN, LEVEL_GAIN, // frustration related
	DEBUG_HIT, AUDIO_VOLUME, YELLOW, RED, BLUE
} from './constants';

import MenuState from './MenuState';
import { levelData } from './level';
import KeyDialog, { KeyManager } from './KeyDialog';
import IntroState from './IntroState';

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

const UNIT = 100 * GAME_SCALE; // size of the square tiles in pixels

class GameState {
	
	// called once per session
	constructor() {
		console.log("GameState.constructor");

		this.collectedKeys = {};
		this.doorsAndKeys = {
			[DOOR_TILE_BLUE]: {
				'openTile': DOOR_OPEN_TILE_BLUE,
				'requiredKey': KEY_TILE_BLUE
			},
			[DOOR_TILE_YELLOW]: {
				'openTile': DOOR_OPEN_TILE_YELLOW,
				'requiredKey': KEY_TILE_YELLOW
			},
			[DOOR_TILE_RED]: {
				'openTile': DOOR_OPEN_TILE_RED,
				'requiredKey': KEY_TILE_RED
			}
		};
	}

	// called everytime state is entered
	create () {
		console.log("GameState.create");
		this.cursors = this.game.input.keyboard.createCursorKeys();
		this.game.stage.smoothed = false; // disable antialiasing

		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.physics.arcade.gravity.y = 0;

		this.music = this.game.add.audio('mainSoundtrack');
		this.music.play();

		this.levelConfig = levelData[this.game.data.currentLevel]; 
		this.keyManager = new KeyManager();
		this.dialogs = new KeyDialog(this, this.keyManager);
		
		this.initLevel();
		
		this.cursors = this.game.input.keyboard.createCursorKeys();

		this.debugKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.escKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
		this.bsKey = this.game.input.keyboard.addKey(Phaser.Keyboard.TAB);

		this.spaceKey.onDown.add(function() {
			if (this.dialogs.hasActiveDialog()) {
				this.dialogs.spacePressed();
				this.sfx['sfx_menu2'].play();
				this.increaseFrustrationPoint(DEBUG_HIT);
			}
		}, this);

		const toggleDialog = () => {
			if (this.dialogs.hasActiveDialog()) {
				this.dialogs.close();
				this.sfx['sfx_menu5'].play();
			}
			else {
				this.sfx['sfx_menu4'].play();
				this.dialogs.showDialog();
				this.increaseFrustrationLevel();
			}
		};

		this.escKey.onDown.add(toggleDialog);
		this.bsKey.onDown.add(toggleDialog);
		this.debugKey.onDown.add(toggleDialog);

		// Capture key presses for dialogs
		this.cursors.up.onDown.add(function() {
			if (this.dialogs.hasActiveDialog()) {
				this.sfx['sfx_menu1'].play();
				this.dialogs.upPressed();
			}
		}, this);

		this.cursors.down.onDown.add(function() { 
			if (this.dialogs.hasActiveDialog()) {
				this.sfx['sfx_menu1'].play();
				this.dialogs.downPressed();
			}
		}, this);
		
		//Stop the following keys from propagating up to the browser
		this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR,
			Phaser.Keyboard.ENTER, Phaser.Keyboard.ESC, Phaser.Keyboard.DELETE]);

		// startFrustrationClock
		this.game.time.events.repeat(Phaser.Timer.SECOND * 60, 100, this.frustrationTicker, this);

		this.sfx = {};
		for (const key of ['sfx_dmg1',
			'sfx_dmg2', 'sfx_dmg3', 'sfx_dmg4', 'sfx_dmg5', 'sfx_dmg6',
			'sfx_dmg7', 'sfx_dmg8',	'sfx_dmg9', 'sfx_menu1', 'sfx_menu2',
			'sfx_menu3', 'sfx_menu4', 'sfx_menu5', 'sfx_foot1', 'sfx_foot2',
			'sfx_vic1','sfx_vic2','sfx_unlock', 'sfx_key1', 'sfx_key2', 'sfx_key3']) {
			this.sfx[key] = this.game.add.audio(key, AUDIO_VOLUME);
		}
	}

	initLevel() {
		this.grid = genMazeAndAddDoors(this.levelConfig.w, this.levelConfig.h, this.levelConfig.doorFunc);
		this.keyManager.reset();
		this.refreshLevel();
	}

	resetLevel() {
		this.clearLevel();
		// keep same grid as before
		this.refreshLevel();
	}

	refreshLevel() {
		this.playerAlreadyDead = false;
		
		// create a tilemap
		this.map = this.game.add.tilemap();
		this.map.setTileSize(TILE_WIDTH, TILE_HEIGHT);
		this.map.addTilesetImage(TILES_IMG);
		const map = this.map;

		this.l1 = this.grid.convertToMap(this.map);

		// l1.setScale works. l1.scale.setTo(2) disables collision!
		// see https://github.com/photonstorm/phaser/issues/2305
		this.l1.setScale(GAME_SCALE);

		//this.game.world.scale.setTo(3.0);
		this.l1.resizeWorld();

		this.keys = this.game.add.group();

		let playerTile;

		this.emptyTilesCoordinates = [];

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
						this.emptyTilesCoordinates.push({ 'x': tile.worldX, 'y': tile.worldY });
						break;
					case DOOR_TILE_BLUE: // door closed
					case DOOR_TILE_YELLOW: // door closed
					case DOOR_TILE_RED: // door closed
						tile.properties['is_closed_door'] = true;
						tile.properties['x'] = x;
						tile.properties['y'] = y;
						break;
					case GOAL_TILE: // goal
						this.goal = tile;
						break;
					case ENEMY_TILE: // enemy
						break;
					case KEY_TILE_BLUE: // key1
					case KEY_TILE_YELLOW: // key2
					case KEY_TILE_RED: // key3
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
		this.map.setCollision(DOOR_TILE_BLUE, true, this.l1);
		this.map.setCollision(DOOR_TILE_YELLOW, true, this.l1);
		this.map.setCollision(DOOR_TILE_RED, true, this.l1);
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

		this.levelText = this.game.add.text(16, 16, 'Level: ' + (this.game.data.currentLevel + 1), { fontSize: '32px', fill: '#FFF', stroke: '#000000', strokeThickness: 6 });
		this.levelText.fixedToCamera = true;
		this.frustrationText = this.game.add.text(16, 56, 'Frustration x' + this.game.data.frustrationLevel +': ' + this.game.data.frustrationScore, { fontSize: '32px', fill: '#FFF', stroke: '#000000', strokeThickness: 6 });
		this.frustrationText.fixedToCamera = true;

		this.redKeyText = this.game.add.text(16, 96, 'Red keys: 0', { fontSize: '24px', fill: '#E00', stroke: '#000000', strokeThickness: 6 });
		this.redKeyText.fixedToCamera = true;
		this.yellowKeyText = this.game.add.text(16, 128, 'Yellow keys: 0', { fontSize: '24px', fill: '#FE2', stroke: '#000000', strokeThickness: 6 });
		this.yellowKeyText.fixedToCamera = true;
		this.blueKeyText = this.game.add.text(16, 160, 'Blue keys: 0', { fontSize: '24px', fill: '#71F', stroke: '#000000', strokeThickness: 6 });
		this.blueKeyText.fixedToCamera = true;
	}

	updateText() {
		this.levelText.text = 'Level: ' + (this.game.data.currentLevel + 1);
		this.redKeyText.text =  'Red keys: ' + (this.collectedKeys[RED] || 0);
		this.yellowKeyText.text = 'Yellow keys: ' + (this.collectedKeys[YELLOW] || 0);
		this.blueKeyText.text = 'Blue keys: ' + (this.collectedKeys[BLUE] || 0);
		this.frustrationText.text = 'Frustration x' + this.game.data.frustrationLevel +': ' + this.game.data.frustrationScore;
	}

	clearLevel() {
		this.collectedKeys = {};
		this.game.world.removeAll();
	}

	nextLevel() {
		this.decreaseFrustrationPoint(LEVEL_GAIN);

		this.clearLevel();
		this.game.data.currentLevel += 1;
		this.levelConfig = levelData[this.game.data.currentLevel];
		this.music.stop();
		this.state.start("IntroState", true, false, this.levelConfig.introText, "GameState");
		// this.initLevel(); // initialize next level again
	}

	update() {
		this.player.body.velocity.x = 0;
		this.player.body.velocity.y = 0;

		if (!(this.uiBlocked || this.playerAlreadyDead)) {
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

		this.game.physics.arcade.collide(this.player, this.l1, this.playerHitsWall, null, this);
		this.game.physics.arcade.collide(this.player, this.monsters, this.playerHitsMonster, null, this);
		this.game.physics.arcade.collide(this.monsters, this.l1, this.monsterHitsWall, null, this);
		this.game.physics.arcade.overlap(this.player, this.keys, this.playerFindsKey, null, this);
	}

	initMonsters() {
		let count = this.levelConfig['enemyCount'];
		let speedFactor = this.levelConfig['enemySpeedFactor'];
		for (let i = 0; i < count; i++ ) {
			let newMonster = this.monsters.create(0, 0, SPRITESHEET, ENEMY_TILE);
			newMonster.animations.add('idle', [ 0x10, 0x11, 0x12 ], 3, true);
			newMonster.animations.add('walk', [ 0x13, 0x14 ], 2, true);
			newMonster.animations.play('walk');
			newMonster.data['isChangingDirection'] = false;
		
			
			this.game.physics.arcade.enable(newMonster, Phaser.Physics.ARCADE);

			newMonster.anchor.set(0.5);
			//  This adjusts the collision body size.
			newMonster.body.setSize(BODY_W, BODY_H, BODY_LEFT, BODY_TOP);
			newMonster.body.bounce.set(1);


			let numberOfEmptyTiles = this.emptyTilesCoordinates.length;
			let coordinate = this.emptyTilesCoordinates[Math.floor(Math.random()*numberOfEmptyTiles)];
			let spawnPointX = coordinate.x/GAME_SCALE + BODY_W/2;
			let spawnPointY = coordinate.y/GAME_SCALE + BODY_W/2;

			newMonster.position.setTo(
				spawnPointX,
				spawnPointY
			);

			let randomNumber = Math.floor((Math.random() * 4) + 1);
			switch (randomNumber) {
				case 1:
					newMonster.body.velocity.x = UNIT/10 * speedFactor;
					newMonster.body.velocity.y = UNIT/10 * speedFactor;
					break;
				case 2:
					newMonster.body.velocity.x = -UNIT/10 * speedFactor;
					newMonster.body.velocity.y = UNIT/10 * speedFactor;
					break;
				case 3:
					newMonster.body.velocity.x = UNIT/10 * speedFactor;
					newMonster.body.velocity.y = -UNIT/10 * speedFactor;
					break;
				case 4:
					newMonster.body.velocity.x = -UNIT/10 * speedFactor;
					newMonster.body.velocity.y = -UNIT/10 * speedFactor;
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
			if ( index in this.doorsAndKeys ) {
				let requiredKeyBefore = this.doorsAndKeys[index]['requiredKey'];
				let requiredKey = this.keyManager.getKeyNeededForDoor(requiredKeyBefore);

				if ( requiredKey && this.collectedKeys[requiredKey] ) {
					this.collectedKeys[requiredKey] -= 1;
					wall.properties['is_closed_door'] = false;
					let openTile = this.doorsAndKeys[index]['openTile'];
					let x = wall.x;
					let y = wall.y;
					this.map.putTile(openTile, x, y);
					// Unlocked!
					this.decreaseFrustrationPoint(DOOR_GAIN);
					this.sfx.sfx_unlock.play();
					this.updateText();
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
		this.decreaseFrustrationPoint(KEY_GAIN);
		this.sfx.sfx_key2.play();
		this.updateText();
	}

	playerHitsMonster(player, monster) {
		if (this.playerAlreadyDead) return;
		this.playerAlreadyDead = true; // prevent repeated trigger

		this.increaseFrustrationLevel();
		let frustrationToAdd = this.frustrationFactor() * MONSTER_HIT;
		this.increaseFrustrationPoint(frustrationToAdd);

		this.music.stop();

		// prevent monster from flying away
		monster.body.velocity.x = 0;
		monster.body.velocity.y = 0;

		const soundKey = pickOne(['sfx_dmg1',
			'sfx_dmg2',
			'sfx_dmg3',
			'sfx_dmg4',
			'sfx_dmg5',
			'sfx_dmg6',
			'sfx_dmg7',
			'sfx_dmg8',
			'sfx_dmg9']);
		this.sfx[soundKey].play();

		this.game.time.events.add(Phaser.Timer.SECOND * 2, () => {
			this.music.play();
			this.resetLevel();
			this.updateText();
			this.playerAlreadyDead = false;
		});
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

	// Just Fibonnacci Series with a loop
	frustrationFactor() {
		var a = 1, b = 0, temp;
		let frustrationLevelTmp = this.game.data.frustrationLevel;
		while ( frustrationLevelTmp >= 0){
			temp = a;
			a = a + b;
			b = temp;
			frustrationLevelTmp--;
		}
		
		return b;
	}

	increaseFrustrationLevel() {
		this.game.data.frustrationLevel++;
		this.updateText();
		console.log("INCREASED frustration level to " + this.game.data.frustrationLevel );
	}

	increaseFrustrationPoint(point) {
		this.game.data.frustrationScore += point;
		this.updateText();
		console.log("ADDED " + point + " frustration points!");
	}

	decreaseFrustrationPoint(point) {
		let newScore = this.game.data.frustrationScore - point;
		this.game.data.frustrationScore = newScore < 0 ? 0 : newScore;
		this.updateText();
		console.log("REMOVED " + point + " frustration points!");
	}

	frustrationTicker() {
		this.game.data.totalMinute++;
		this.increaseFrustrationLevel();
		let frustrationToAdd = this.frustrationFactor() * ( TIME_HIT + this.game.data.totalMinute );
		this.increaseFrustrationPoint(frustrationToAdd);
	}
}

class BootState {

	preload() {		
		this.load.image(TILES_IMG, "assets/sprites.png");
		this.load.image("menubg", "assets/menubg.png");
		this.load.spritesheet(SPRITESHEET, "assets/sprites.png", TILE_WIDTH, TILE_HEIGHT, NUM_TILES);
		this.load.tilemap("level", "assets/placeholder-level.json", null, Phaser.Tilemap.TILED_JSON);
		this.load.audio('mainSoundtrack', [ 'assets/music.ogg', 'assets/music.mp3' ]);
		this.load.audio('altSoundtrack', [ 'assets/music_alternate.ogg', 'assets/music_alternate.mp3' ]);
		this.load.audio('sfx_dmg1',  ['assets/sfx/Damage 3 Ow.ogg', 'assets/sfx/Damage 3 Ow.mp3']);
		this.load.audio('sfx_dmg2',  ['assets/sfx/Damage 6 Death-Why Me.ogg', 'assets/sfx/Damage 6 Death-Why Me.mp3']);
		this.load.audio('sfx_dmg3',  ['assets/sfx/Damage 8 That Hurt.ogg', 'assets/sfx/Damage 8 That Hurt.mp3']);
		this.load.audio('sfx_dmg4',  ['assets/sfx/Damage 5 Death-I Just Got Tinder!.ogg', 'assets/sfx/Damage 5 Death-I Just Got Tinder!.mp3']);
		this.load.audio('sfx_dmg5',  ['assets/sfx/Damage 7 Ow 2.ogg', 'assets/sfx/Damage 7 Ow 2.mp3']);
		this.load.audio('sfx_dmg6',  ['assets/sfx/Damage 2 Stop It!.ogg', 'assets/sfx/Damage 2 Stop It!.mp3']);
		this.load.audio('sfx_dmg7',  ['assets/sfx/Damage 4 Death-My Mortgage!.ogg', 'assets/sfx/Damage 4 Death-My Mortgage!.mp3']);
		this.load.audio('sfx_dmg8',  ['assets/sfx/Damage 9 Oh Man.ogg', 'assets/sfx/Damage 9 Oh Man.mp3']);
		this.load.audio('sfx_dmg9',  ['assets/sfx/Damage 1 Ouch.ogg', 'assets/sfx/Damage 1 Ouch.mp3']);
		this.load.audio('sfx_menu1', ['assets/sfx/Menu manipulation sound 1.ogg', 'assets/sfx/Menu manipulation sound 1.mp3']);
		this.load.audio('sfx_menu2', ['assets/sfx/Menu manipulation sound 2.ogg', 'assets/sfx/Menu manipulation sound 2.mp3']);
		this.load.audio('sfx_menu3', ['assets/sfx/Menu manipulation sound 3.ogg', 'assets/sfx/Menu manipulation sound 3.mp3']);
		this.load.audio('sfx_menu4', ['assets/sfx/Debug transition enter.ogg', 'assets/sfx/Debug transition enter.mp3']);
		this.load.audio('sfx_menu5', ['assets/sfx/Debug transition exit.ogg', 'assets/sfx/Debug transition exit.mp3']);
		this.load.audio('sfx_foot1', ['assets/sfx/Footsteps double.ogg', 'assets/sfx/Footsteps double.mp3']);
		this.load.audio('sfx_foot2', ['assets/sfx/Footsteps single.ogg', 'assets/sfx/Footsteps single.mp3']);
		this.load.audio('sfx_vic1',  ['assets/sfx/Victory 1.ogg', 'assets/sfx/Victory 1.mp3']);
		this.load.audio('sfx_vic2',  ['assets/sfx/Victory 2.ogg', 'assets/sfx/Victory 2.mp3']);
		this.load.audio('sfx_unlock',['assets/sfx/Door unlock.ogg', 'assets/sfx/Door unlock.mp3']);
		this.load.audio('sfx_key1',  ['assets/sfx/Pick up key 1.ogg', 'assets/sfx/Pick up key 1.mp3']);
		this.load.audio('sfx_key2',  ['assets/sfx/Pick up key 2.1.ogg', 'assets/sfx/Pick up key 2.1.mp3']);
		this.load.audio('sfx_key3',  ['assets/sfx/Pick up key 2.ogg', 'assets/sfx/Pick up key 2.mp3']);
	}

	create() {
		this.state.start("MenuState");
		this.game.data = { 
			currentLevel: 0,
			totalMinute: 0,
			frustrationScore: 0,
			frustrationLevel: 0,
		};
	}
}

window.onload = () => {
	const game = new Game();
	game.state.add("BootState", BootState);
	game.state.add("MenuState", MenuState);
	game.state.add("IntroState", IntroState);
	game.state.add("GameState", GameState);
	game.state.start("BootState");
};