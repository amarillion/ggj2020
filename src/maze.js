import { assert } from "./assert";
import { 
	TILE_WIDTH, TILE_HEIGHT, 
	EMPTY_TILE, WALL_TILE, 
	START_TILE, GOAL_TILE, 
	KEY_TILE_BLUE, KEY_TILE_YELLOW, KEY_TILE_RED,
	DOOR_TILE_BLUE, DOOR_TILE_YELLOW, DOOR_TILE_RED,
	ALL_KEYS
} from "./constants";
import { bfsGenerator } from "@amarillion/helixgraph/src/pathFinding.js";
import { randomInt, pickOne, shuffle } from "@amarillion/helixgraph/src/random.js";

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
		return Object.entries(this.links);
	}

	nonDoorLinks() {
		return Object.entries(this.links).
			filter(([dir,]) => this.linkTypes[dir] === 1);
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

	randomCell() {
		return pickOne(this.data);
	}

	recursiveBackTracker() {
		recursiveBackTracker(
			this.randomCell(), 
			c => this.allNeighbors(c),
			(src, dir, dest) => {
				const linkType = 1; // open, no door
				src.link(dest, dir, true, linkType);
			}
		);
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
			if (n) result.push( [ dirKey, n ]);
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
		if (north) neighbors.push([ NORTH, north ]);
		
		const east = grid.findNeighbor(cell, EAST);
		if (east) neighbors.push([ EAST, east ]);
		
		const item = pickOne(neighbors);
		if (item) { 
			const [dir, node] = item;
			// add door sometimes...
			const linkType  = Math.random() > 0.95 ? 2 : 1;	
			cell.link(node, dir, true, linkType); 
		}

		// add key sometimes
		if (Math.random() > 0.95) {
			cell.object = 2;
		}
	});
	
}

export function recursiveBackTracker(start, listAdjacent, linkNodes) {
	assert(typeof(listAdjacent) === 'function');
	assert(typeof(linkNodes) === 'function');
	
	const stack = [];
	stack.push(start);
	const visited = new Set();
	visited.add(start);

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		const unvisitedNeighbors = listAdjacent(current).
			filter(([, node]) => !visited.has(node));

		if (unvisitedNeighbors.length === 0) {
			stack.pop();
		}
		else {
			const [dir, node] = pickOne(unvisitedNeighbors);
			
			linkNodes(current, dir, node);
			stack.push(node); 
			visited.add(node);
		}
	}
}

function oldAddDoors(grid) {
	const stack = [];
	const visited = new Set();

	const end = grid.get(grid.w-1, grid.h-1);
	let start;
	do {
		start = grid.get(randomInt(grid.w), randomInt(grid.h));
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
			const key = randomInt(3) + 2;
			keyState[key] += 1;
			current.object = key;
			console.log({keyState});
		}

		const unvisitedNeighbors = current.listNeighbors().
			filter(([, node]) => !visited.has(node));

		if (unvisitedNeighbors.length === 0) {
			stack.pop();
		}
		else {
			const [dir, node] = pickOne(unvisitedNeighbors);
			
			// add door sometimes...
			
			let linkType = 1; // base
			if (Math.random() > 0.60) {
				const availableKey = pickOne(Object.keys(keyState).filter(key => keyState[key] > 0));
				if (availableKey) {
					linkType = +availableKey;
					keyState[availableKey] -= 1;

					current.makeDoor(dir, linkType);
				}
			}

			stack.push(node);
			visited.add(node);
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
	while (!isValid(randomCell));
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
			grid.recursiveBackTracker();
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
	makeStart(expandUntilDoors(b));
	dropKey(expandUntilDoors(b), key2);
	dropKey(expandUntilDoors(aa), key3);
	makeGoal(expandUntilDoors(ab));
}

// only possible by changing mapping
export function addDoors1(grid) {
	const [ , key2, key3 ] = shuffle(ALL_KEYS);

	const allNodes = grid.allNodes();
	const randomPivot = pickOne(allNodes);
	const [ a, b ] = splitMaze(randomPivot, key2);
	const [ aa, ab ] = splitMaze(a, key3); // aa is linked to a. ab is linked to aa
	makeStart(expandUntilDoors(b));
	dropKey(expandUntilDoors(b), key3);
	dropKey(expandUntilDoors(aa), key2);
	makeGoal(expandUntilDoors(ab));
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
	makeStart(expandUntilDoors(ba));
	dropKey(expandUntilDoors(ba), key3);
	dropKey(expandUntilDoors(bb), key2);
	dropKey(expandUntilDoors(aa), key1);
	makeGoal(expandUntilDoors(ab));
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

	makeStart(expandUntilDoors(ba));
	dropKey(expandUntilDoors(ba), YELLOW);
	dropKey(expandUntilDoors(ba), BLUE);
	
	dropKey(expandUntilDoors(bba), RED);
	dropKey(expandUntilDoors(bbb), YELLOW);

	dropKey(expandUntilDoors(aa), BLUE);
	makeGoal(expandUntilDoors(abb));
}
*/

const expandUntilDoors = (cells) => expandNodes(cells, n => n.nonDoorLinks());

// use bfs to find all freely linked nodes
export function expandNodes(node, listNeighbors) {
	assert(typeof(listNeighbors) === 'function');
	return [ ...bfsGenerator(node, listNeighbors) ];
}

export function reachable(src, dest, listNeighbors) {
	assert(typeof(listNeighbors) === 'function', `Parameter listNeighbors must be a function but is ${typeof(listNeighbors)}`);
	for (const node of bfsGenerator(src, listNeighbors)) {
		if (node === dest) {
			return true; // found!
		}
	}
	return false; // not found
}

function splitMaze(pivot, keyType) {
	let it = 100;
	let valid = false;
	do {
		// pick a random cell
		const expanse = expandUntilDoors(pivot);
		const randomCell = pickOne(expanse);

		const links = randomCell.nonDoorLinks();
		
		if (links.length > 0) {
			valid = true;
			
			const [ doorDir, doorCell ] = pickOne(links);
			
			// upgrade linkType
			randomCell.makeDoor(doorDir, keyType);

			if (reachable(randomCell, pivot, n => n.nonDoorLinks())) {
				return [ randomCell, doorCell ];
			}
			else {
				assert (reachable(doorCell, pivot, n => n.nonDoorLinks()), "Something went wrong while making doors");
				return [ doorCell, randomCell ]; 
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