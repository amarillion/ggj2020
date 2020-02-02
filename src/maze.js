import { assert } from "./assert";
import { 
	TILE_WIDTH, TILE_HEIGHT, 
	EMPTY_TILE, WALL_TILE, 
	START_TILE, GOAL_TILE, 
	KEY_TILE_BLUE, KEY_TILE_YELLOW, KEY_TILE_RED,
	DOOR_TILE_BLUE, DOOR_TILE_YELLOW, DOOR_TILE_RED,
	ALL_KEYS
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
		this.playerStart = false;
		this.endGoal = false;
	}

	makeDoor(dir, doorType, bidi=true) {
		assert(this.linkType(dir)) == 1; // must already be open link
		assert(ALL_KEYS.indexOf(doorType) >= 0, `${doorType} must be in range ${ALL_KEYS}`);
		this.linkTypes[dir] = doorType;
		if (bidi) {
			const other = this.links[dir];
			other.makeDoor (reverse[dir], doorType, false);
		}
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

	nonDoorLinks() {
		const result = [];
		for (const [k, v] of Object.entries(this.links)) {
			if (this.linkTypes[k] === 1) {
				result.push({ dir: k, cell : v });
			}
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

	allNodes() {
		return this.data;
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
	
		this.eachCell(cell => {
			const xx = cell.x * SCALE;
			const yy = cell.y * SCALE;
			
			if (cell.object) {
				assert (ALL_KEYS.indexOf(cell.object) >= 0);
				map.putTile(cell.object, xx + MID, yy + MID);
			}

			if (cell.playerStart) {
				// slightly off-set to make sure it doesn't get overwritten by keys
				map.putTile(START_TILE, xx + MID, yy + MID - 1);
			}

			if (cell.endGoal) {
				// slightly off-set to make sure it doesn't get overwritten by keys
				map.putTile(GOAL_TILE, xx + MID + 1, yy + MID + 1);
			}

			// draw EAST
			const eastLink = cell.linkType(EAST);
			if (eastLink !== 1) {
				for (let d = 0; d < SCALE + 1; ++d) {
					map.putTile(WALL_TILE, xx + SCALE, yy + d);
				}
				switch (eastLink) {
				case 0: break; // full wall 
				case KEY_TILE_BLUE: map.putTile(DOOR_TILE_BLUE, xx + SCALE, yy + MID); break;
				case KEY_TILE_YELLOW: map.putTile(DOOR_TILE_YELLOW, xx + SCALE, yy + MID); break;
				case KEY_TILE_RED: map.putTile(DOOR_TILE_RED, xx + SCALE, yy + MID); break;
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
				case KEY_TILE_BLUE: map.putTile(DOOR_TILE_BLUE,  xx + MID, yy + SCALE); break;
				case KEY_TILE_YELLOW: map.putTile(DOOR_TILE_YELLOW, xx + MID, yy + SCALE); break;
				case KEY_TILE_RED: map.putTile(DOOR_TILE_RED, xx + MID, yy + SCALE); break;	
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

function oldAddDoors(grid) {
	const stack = [];
	const visited = new Set();

	const end = grid.get(grid.w-1, grid.h-1);
	let start;
	do {
		start = grid.get(randomNumber(grid.w), randomNumber(grid.h));
	} while (start === end);

	stack.push(start);
	visited.add(start);

	start.playerStart = true;
	end.endGoal = true;

	const keyState = {
		2: 0,
		3: 0,
		4: 0
	};

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		
		// add object sometimes.
		if (Math.random() > 0.90) {
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
			if (Math.random() > 0.60) {
				const availableKey = pickOne(Object.keys(keyState).filter(key => keyState[key] > 0));
				if (availableKey) {
					linkType = +availableKey;
					keyState[availableKey] -= 1;

					current.makeDoor(item.dir, linkType);
				}
			}

			// current.link(item.cell, item.dir, true, linkType);
			stack.push(item.cell);
			visited.add(item.cell);
		}
	}
}

function applyToRandomCell(cells, isValid, apply) {

	let randomCell;
	let it = 100;
	do {
		randomCell = pickOne(cells);
		it--;
		assert(it > 0, "Maximum iterations reached");
	}
	while (!isValid(randomCell))
	apply(randomCell);
}

function isEmptyCell(cell) {
	return !(cell.object || cell.playerStart || cell.endGoal);
}

function makeStart(cells) {
	applyToRandomCell(cells,
		isEmptyCell,
		(c) => { c.playerStart = true; }
	);
}

function makeGoal(cells) {
	applyToRandomCell(cells,
		isEmptyCell,
		(c) => { c.endGoal = true; }
	);
}

function dropKey(cells, key) {
	applyToRandomCell(cells,
		isEmptyCell,
		(c) => { c.object = key; }
	);
}

export function genMazeAndAddDoors(w, h, doorFunc = addDoors2) {
	while(true) {
		try {
			const grid = new Grid(w, h);
			recursiveBackTracker(grid);
			doorFunc(grid);
			return grid;
		}
		catch (e) {
			console.log(e);
			// try again;
		}
	}
}

// possible with regular mapping
export function addDoors0(grid) {
	const [ , key2, key3 ] = shuffle(ALL_KEYS);

	const allNodes = grid.allNodes();
	const randomPivot = pickOne(allNodes);
	const [ a, b ] = splitMaze(randomPivot, key2);
	const [ aa, ab ] = splitMaze(a, key3); // aa is linked to a. ab is linked to aa
	makeStart(expandNodes(b));
	dropKey(expandNodes(b), key2);
	dropKey(expandNodes(aa), key3);
	makeGoal(expandNodes(ab));
}

// only possible by changing mapping
export function addDoors1(grid) {
	const [ , key2, key3 ] = shuffle(ALL_KEYS);

	const allNodes = grid.allNodes();
	const randomPivot = pickOne(allNodes);
	const [ a, b ] = splitMaze(randomPivot, key2);
	const [ aa, ab ] = splitMaze(a, key3); // aa is linked to a. ab is linked to aa
	makeStart(expandNodes(b));
	dropKey(expandNodes(b), key3);
	dropKey(expandNodes(aa), key2);
	makeGoal(expandNodes(ab));
}

// Fisher-Yates shuffle
export function shuffle(array) {
	
	let counter = array.length;

	// While there are elements in the array
	while (counter > 0) {
		let index = randomNumber(counter);
		counter--;

		// And swap the last element with it
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

// only possible by changing mapping
export function addDoors2(grid) {
	const [ key1, key2, key3 ] = shuffle(ALL_KEYS);
	
	const allNodes = grid.allNodes();
	const randomPivot = pickOne(allNodes);
	const [ a, b ] = splitMaze(randomPivot, key1);
	const [ aa, ab ] = splitMaze(a, key3); // aa is linked to a. ab is linked to aa
	const [ ba, bb ] = splitMaze(b, key2); // ba is linked to aa. bb is linked to ba
	
	// ab <-> aa <-> ba <-> bb
	makeStart(expandNodes(ba));
	dropKey(expandNodes(ba), key3);
	dropKey(expandNodes(bb), key2);
	dropKey(expandNodes(aa), key1);
	makeGoal(expandNodes(ab));
}
/*
export function addDoors3(grid) {
	const allNodes = grid.allNodes();
	const randomPivot = pickOne(allNodes);
	const [ a, b ] = splitMaze(randomPivot, RED);
	const [ aa, ab ] = splitMaze(a, BLUE); // aa is linked to a. ab is linked to aa
	const [ ba, bb ] = splitMaze(b, YELLOW); // ba is linked to aa. bb is linked to ba
	const [ aba, abb ] = splitMaze(ab, RED); // aaa is linked to aa. aab is linked to aaa
	const [ bba, bbb ] = splitMaze(bb, BLUE); // aaa is linked to aa. aab is linked to aaa
		// abb <-> aba <-> aa <-> ba <-> bba <-> bbb

	makeStart(expandNodes(ba));
	dropKey(expandNodes(ba), YELLOW);
	dropKey(expandNodes(ba), BLUE);
	
	dropKey(expandNodes(bba), RED);
	dropKey(expandNodes(bbb), YELLOW);

	dropKey(expandNodes(aa), BLUE);
	makeGoal(expandNodes(abb));
}
*/

// use bfs to find all freely linked nodes
export function expandNodes(node) {
	const visited = new Set();
	const stack = [];
	stack.push(node);
	visited.add(node);

	while(stack.length > 0) {

		const current = stack.pop();
		
		// find unvisited neighbors
		const unvisited = current.
			nonDoorLinks().
			filter(item => !visited.has(item.cell));

		for (const item of unvisited) {
			visited.add(item.cell);
			stack.push(item.cell);
		}
	}

	return [ ...visited.values() ];
}

export function reachable(src, dest) {

	const visited = new Set();
	const stack = [];
	stack.push(src);
	visited.add(src);

	while(stack.length > 0) {

		const current = stack.pop();
		
		// find unvisited neighbors
		const unvisited = current.
			nonDoorLinks().
			filter(item => !visited.has(item.cell));

		for (const item of unvisited) {
			if (item.cell === dest) {
				return true; // found!
			}
			visited.add(item.cell);
			stack.push(item.cell);
		}
	}

	return false; // not found
}

function splitMaze(pivot, keyType) {
	let it = 100;
	let valid = false;
	do {
		// pick a random cell
		const expanse = expandNodes(pivot);
		const randomCell = pickOne(expanse);

		const links = randomCell.nonDoorLinks();
		
		if (links.length > 0) {
			valid = true;
			
			const doorLink = pickOne(links);
			
			// upgrade linkType
			randomCell.makeDoor(doorLink.dir, keyType);

			if (reachable(randomCell, pivot)) {
				return [ randomCell, doorLink.cell ];
			}
			else {
				assert (reachable(doorLink.cell, pivot), "Something went wrong while making doors");
				return [ doorLink.cell, randomCell ]; 
			}
		}
		else {
			valid = false;
			// try again
		}
		// pick a random link that is not a door
		assert ((--it) > 0, "Maximum iterations reached");
	}
	while (!valid);
}