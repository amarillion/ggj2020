import { 
	addDoors1, 
	addDoors2,
	addDoors0, 
	// addDoors3
} from "./maze";

export const levelData = [
	// 0
	{
		w: 5, h: 4,
		enemySpeedFactor: 0.8,
		doorFunc: addDoors0,
		enemyCount: 2
	},
	// 1
	{
		w: 6, h: 4,
		enemySpeedFactor: 0.9,
		doorFunc: addDoors1,
		enemyCount: 3
	},
	// 2
	{
		w: 6, h: 5,
		enemySpeedFactor: 1.0,
		doorFunc: addDoors1,
		enemyCount: 5
	},
	// 3
	{
		w: 7, h: 8,
		enemySpeedFactor: 1.0,
		doorFunc: addDoors2,
		enemyCount: 8
	},
	// 4
	{
		w: 12, h: 6,
		enemySpeedFactor: 1.1,
		doorFunc: addDoors2,
		enemyCount: 10
	},
	// 5
	{
		w: 10, h: 10,
		enemySpeedFactor: 1.2,
		doorFunc: addDoors2,
		enemyCount: 12
	},
	// 6
	{
		w: 13, h: 9,
		enemySpeedFactor: 1.25,
		doorFunc: addDoors2,
		enemyCount: 14
	},
	// 7
	{
		w: 15, h: 8,
		enemySpeedFactor: 1.3,
		doorFunc: addDoors2,
		enemyCount: 16
	},
	// 8
	{
		w: 8, h: 16,
		enemySpeedFactor: 1.4,
		doorFunc: addDoors2,
		enemyCount: 18
	},
	// 9
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.5,
		doorFunc: addDoors2,
		enemyCount: 20
	}
];


