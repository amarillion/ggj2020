import { assert } from "./assert";
import { 
	TILE_WIDTH, TILE_HEIGHT, 
	EMPTY_TILE, WALL_TILE, 
	START_TILE, GOAL_TILE, 
	KEY_TILE, KEY2_TILE, KEY3_TILE,
	DOOR_TILE, DOOR2_TILE, DOOR3_TILE
} from "./constants";

/*
Generate a maze
*/

export const NORTH = 0x01;
export const EAST = 0x02;
export const SOUTH = 0x04;
export const WEST = 0x08;

const reverse = {
	[NORTH]: SOUTH,
	[SOUTH]: NORTH,
	[EAST]: WEST,
	[WEST]: EAST
};

export class Cell {
	
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.links = {};
		this.linkTypes = {};
		this.object = null;
	}

	link(other, dir, bidi=true, linkType = 1) {
		if (dir in this.links) {
			console.log("WARNING: creating link that already exists");
		}
		this.links[dir] = other;
		this.linkTypes[dir] = linkType;
		if (bidi) { other.link(this, reverse[dir], false, linkType); }
	}

	// 0 means: no link
	// 1 or higher means: some kind of door
	linkType(dir) {
		return dir in this.links ? this.linkTypes[dir] : 0; 
	}

	linked(dir) {
		return dir in this.links;
	}

	unlink(other, bidi=true) {
		console.log({other, bidi});
		assert(false, "Unimplemented");
	}

	listNeighbors() {
		const result = [];
		for (const [k, v] of Object.entries(this.links)) {
			result.push({ dir: k, cell : v });
		}
		return result;
	}
}

export class Grid {

	constructor (w, h) {
		this.w = w;
		this.h = h;
		this.data = [];

		this.prepareGrid();
	}

	prepareGrid() {
		for(let x = 0; x < this.w; ++x) {
			for (let y = 0; y < this.h; ++y) {
				this.data[this._index(x, y)] = new Cell(x, y);
			}
		}
	}

	eachCell(f) {
		for (const cell of this.data) {
			f(cell);
		}
	}

	_index(x, y) {
		return x + y * this.w;
	}

	inRange(x, y) {
		return (x >= 0 && y >= 0 && x < this.w && y < this.h);
	}

	get(x, y) {
		assert (this.inRange(x, y), "Out of bounds");
		return this.data[this._index(x, y)];
	}

	// list neighbors, not necessarily linked
	// returns array of dir, cell pairs
	allNeighbors(cell) {
		const result = [];
		for (const dirKey of [NORTH, EAST, SOUTH, WEST]) {
			const n = this.findNeighbor(cell, dirKey);
			if (n) result.push( { dir: dirKey, cell : n });
		}
		return result;
	}

	// find neighboring cell in given dir, not necessarily linked
	// may return null, e.g. when at edge of map
	findNeighbor(cell, dir) {
		const x = cell.x;
		const y = cell.y;
		let nx = x;
		let ny = y;
		switch (dir) {
		case NORTH: ny -= 1; break;
		case EAST: nx += 1; break;
		case SOUTH: ny += 1; break;
		case WEST: nx -= 1; break;
		default: assert(false, "Impossible direction");
		}
		if (this.inRange(nx, ny)) return this.get(nx, ny); else return null;
	}

	renderToString() {
		
		const rep = (str, n) => {
			let result = "";
			for (let i = 0; i < n; ++i) {
				result += str;
			}
			return result;
		};

		// top-row
		let output = "+" + rep("---+", this.w) + "\n";

		for (let y = 0; y < this.h; ++y) {

			let top = "|";
			let bottom = "-";

			for (let x = 0; x < this.w; ++x) {
				const cell = this.get(x, y);
				top += "   " + (cell.linked(EAST) ? " " : "|");
				bottom += (cell.linked(SOUTH) ? "   " : "---") + "+";
			}

			output += top + "\n";
			output += bottom + "\n";
		}
		return output;
	}

	convertToMap(map) {
		const SCALE = 4;
		const MID = 2;

		const mapw = this.w * SCALE + 1;
		const maph = this.h * SCALE + 1;

		// const map = new Phaser.Tilemap(game, TILE_WIDTH, TILE_HEIGHT, this.w * SCALE + 1, this.h * SCALE + 1);
		// const layer = map.create(this.w * SCALE + 1, this.h * SCALE + 1, TILE_WIDTH, TILE_HEIGHT);
		const layer = map.create('level1', mapw, maph, TILE_WIDTH, TILE_HEIGHT);

		// clear the entire map
		for (let x = 0; x < mapw; ++x) {
			for (let y = 1; y < maph - 1; ++y) {
				map.putTile(EMPTY_TILE, x, y);
			}
		}

		// draw a box around
		for (let x = 0; x < mapw; ++x) {
			map.putTile(WALL_TILE, x, 0);
			map.putTile(WALL_TILE, x, maph-1);
		}
		for (let y = 1; y < maph - 1; ++y) {
			map.putTile(WALL_TILE, 0, y);
			map.putTile(WALL_TILE, mapw-1, y);
		}

		map.putTile(START_TILE, mapw - 1 - MID, MID);
		map.putTile(GOAL_TILE, MID, maph - 1 - MID);
	
		this.eachCell(cell => {
			const xx = cell.x * SCALE;
			const yy = cell.y * SCALE;
			
			if (cell.object) {
				switch (cell.object) {
				case 2: map.putTile(KEY_TILE, xx + MID, yy + MID); break;
				case 3: map.putTile(KEY2_TILE, xx + MID, yy + MID); break;
				case 4: map.putTile(KEY3_TILE, xx + MID, yy + MID); break;
				}
			}

			// draw EAST
			const eastLink = cell.linkType(EAST);
			if (eastLink !== 1) {
				for (let d = 0; d < SCALE + 1; ++d) {
					map.putTile(WALL_TILE, xx + SCALE, yy + d);
				}
				switch (eastLink) {
				case 0: break; // full wall 
				case 2: map.putTile(DOOR_TILE, xx + SCALE, yy + MID); break;
				case 3: map.putTile(DOOR2_TILE, xx + SCALE, yy + MID); break;
				case 4: map.putTile(DOOR3_TILE, xx + SCALE, yy + MID); break;
				default: assert(false, `Error in eastLink, got ${eastLink}`);
				}
			}

			// draw SOUTH
			const southLink = cell.linkType(SOUTH);
			if (southLink !== 1) {
				for (let d = 0; d < SCALE + 1; ++d) {
					map.putTile(WALL_TILE, xx + d, yy + SCALE);
				}
				switch (southLink) {
				case 0: break; // full wall 
				case 2: map.putTile(DOOR_TILE,  xx + MID, yy + SCALE); break;
				case 3: map.putTile(DOOR2_TILE, xx + MID, yy + SCALE); break;
				case 4: map.putTile(DOOR3_TILE, xx + MID, yy + SCALE); break;	
				default: assert(false, `Error in southLink, got ${southLink}`);
				}
			}
			
		});

		return layer;
	}
}

export function binaryTree(grid) {

	grid.eachCell(cell => {
		
		const neighbors = [];
		
		const north = grid.findNeighbor(cell, NORTH);
		if (north) neighbors.push({ dir: NORTH, cell: north });
		
		const east = grid.findNeighbor(cell, EAST);
		if (east) neighbors.push({ dir: EAST, cell: east });
		
		const item = pickOne(neighbors);
		if (item) { 
			// add door sometimes...
			const linkType  = Math.random() > 0.95 ? 2 : 1;	
			cell.link(item.cell, item.dir, true, linkType); 
		}

		// add key sometimes
		if (Math.random() > 0.95) {
			cell.object = 2;
		}
	});
	
}

export function randomNumber(range) {
	return Math.floor(Math.random() * range);
}

export function pickOne(list) {
	const idx = randomNumber(list.length);
	return list[idx];
}

export function recursiveBackTracker(grid) {
	const stack = [];
	const start = grid.get(randomNumber(grid.w), randomNumber(grid.h));
	stack.push(start);

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		const unvisitedNeighbors = grid.allNeighbors(current).filter(item => {
			return (Object.entries(item.cell.links).length === 0);
		});

		if (unvisitedNeighbors.length === 0) {
			stack.pop();
		}
		else {
			const item = pickOne(unvisitedNeighbors);
			
			let linkType = 1; // base
			current.link(item.cell, item.dir, true, linkType);
			stack.push(item.cell); 
		}
	}
}

export function addDoors(grid) {
	const stack = [];
	const visited = new Set();

	const start = grid.get(randomNumber(grid.w), randomNumber(grid.h));
	stack.push(start);
	visited.add(start);

	const keyState = {
		2: 0,
		3: 0,
		4: 0
	};

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		
		// add object sometimes.
		if (Math.random() > 0.98) {
			const key = randomNumber(3) + 2;
			keyState[key] += 1;
			current.object = key;
			console.log({keyState});
		}

		const unvisitedNeighbors = current.listNeighbors().
			filter(item => !visited.has(item.cell));

		if (unvisitedNeighbors.length === 0) {
			stack.pop();
		}
		else {
			const item = pickOne(unvisitedNeighbors);
			
			// add door sometimes...
			
			let linkType = 1; // base
			if (Math.random() > 0.75) {
				const availableKey = pickOne(Object.keys(keyState).filter(key => keyState[key] > 0));
				if (availableKey) {
					linkType = +availableKey;
					keyState[availableKey] -= 1;

					assert(current.linkType(item.dir)) == 1;
					current.linkTypes[item.dir] = linkType;
				}
			}

			// current.link(item.cell, item.dir, true, linkType);
			stack.push(item.cell);
			visited.add(item.cell);
		}
	}
}