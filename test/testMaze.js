import test from "ava";
import { Grid, binaryTree, recursiveBackTracker } from "../src/maze";

test("binary tree maze", t => {
	const grid = new Grid(10, 10);
	binaryTree(grid);
	console.log("\n\n", grid.renderToString(), "\n\n");
	t.assert(true);
});

test("recursive backtracker maze", t => {
	const grid = new Grid(10, 10);
	recursiveBackTracker(grid);
	console.log("\n\n", grid.renderToString(), "\n\n");
	t.assert(true);
});