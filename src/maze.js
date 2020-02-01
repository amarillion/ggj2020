import { assert } from "./assert";

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