import { assert } from "./assert";

export const TILE_WIDTH = 8;
export const TILE_HEIGHT = 8;

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
	}

	link(other, dir, bidi=true) {
		console.log({other, dir});
		if (dir in this.links) {
			console.log("WARNING: creating link that already exists");
		}
		this.links[dir] = other;
		if (bidi) { other.link(this, reverse[dir], false); }
	}

	linked(dir) {
		return dir in this.links;
	}

	unlink(other, bidi=true) {
		console.log({other, bidi});
		assert(false, "Unimplemented");
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
		const SCALE = 5;

		const WALL_TILE = 0;
		const EMPTY_TILE = 6;
		const GOAL_TILE = 2;
		const START_TILE = 1;

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

		map.putTile(START_TILE, mapw - 4, 2);
		map.putTile(GOAL_TILE, 2, maph - 4);
	
		this.eachCell(cell => {
			const xx = cell.x * SCALE;
			const yy = cell.y * SCALE;
			
			// draw EAST
			if (!cell.linked(EAST)) {
				for (let d = 0; d < SCALE + 1; ++d) {
					map.putTile(WALL_TILE, xx + SCALE, yy + d);
				}
			}

			// draw SOUTH
			if (!cell.linked(SOUTH)) {
				for (let d = 0; d < SCALE + 1; ++d) {
					map.putTile(WALL_TILE, xx + d, yy + SCALE);
				}
			}
			
		});

		return layer;
	}
}

export function pickOne(list) {
	const idx = Math.floor(Math.random() * list.length);
	return list[idx];
}

export function binaryTree(grid) {

	grid.eachCell(cell => {
		
		const neighbors = [];
		
		const north = grid.findNeighbor(cell, NORTH);
		if (north) neighbors.push({ dir: NORTH, cell: north });
		
		const east = grid.findNeighbor(cell, EAST);
		if (east) neighbors.push({ dir: EAST, cell: east });
		
		const item = pickOne(neighbors);
		if (item) { cell.link(item.cell, item.dir); }

	});
	
}