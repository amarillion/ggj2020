export const GAME_SCALE = 3.0;

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;
export const NUM_TILES = 256;

export const BODY_W = 12;
export const BODY_H = 12;
export const BODY_LEFT = 2;
export const BODY_TOP = 2;

export const DEBUG_HIT = 1; 
export const MONSTER_HIT = 3;
export const TIME_HIT = 1;
export const KEY_GAIN = 3;
export const DOOR_GAIN = 4;
export const LEVEL_GAIN = 10;

/*
// placeholder graphics
export const WALL_TILE = 0;
export const DOOR_TILE = 5;
export const KEY_TILE = 4;
export const EMPTY_TILE = 6;
export const GOAL_TILE = 2;
export const START_TILE = 1;
export const ENEMY_TILE = 3;
*/

export const WALL_TILE = 0x51;

export const DOOR_TILE_BLUE = 0x20; // closed
export const DOOR_TILE_YELLOW = 0x30; // closed
export const DOOR_TILE_RED = 0x40; // closed

export const DOOR_OPEN_TILE_BLUE = 0x21; // open
export const DOOR_OPEN_TILE_YELLOW = 0x31; // open
export const DOOR_OPEN_TILE_RED = 0x41; // open

export const KEY_TILE_BLUE = 0x22;
export const KEY_TILE_YELLOW = 0x32;
export const KEY_TILE_RED = 0x42;

export const RED = KEY_TILE_RED;
export const YELLOW = KEY_TILE_YELLOW;
export const BLUE = KEY_TILE_BLUE;

export const ALL_KEYS = [ KEY_TILE_RED, KEY_TILE_YELLOW, KEY_TILE_BLUE ];
		
export const EMPTY_TILE = 0x50;
export const GOAL_TILE = 0x52; // tbd
export const START_TILE = 0x00;
export const ENEMY_TILE = 0x10;
