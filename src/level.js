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
		enemyCount: 2,
		introText: `Same slecht, different game. Play through the levels, fix issues, move on. Easy peasy. Let’s go`,
	},
	// 1
	{
		w: 6, h: 4,
		enemySpeedFactor: 0.9,
		doorFunc: addDoors1,
		enemyCount: 3,
		introText: `Well, that was easy.
Keys open same color doors. WHAT CREATIVE DESIGN!

And when the game is broken, I can always access debug tools with ENTER or TAB, and change things with SPACEBAR`,
	},
	// 2
	{
		w: 6, h: 5,
		enemySpeedFactor: 1.0,
		doorFunc: addDoors1,
		enemyCount: 5,
		introText: `Seriously? They can’t even match keys with doors?
Feels like they don’t even care about QA team. I mean, me.`,
	},
	// 3
	{
		w: 7, h: 8,
		enemySpeedFactor: 1.0,
		doorFunc: addDoors2,
		enemyCount: 8,
		introText: `Wrong keys and doors, now in THREE COLORS!
Maybe it was just the first levels that are buggy. Pretty please?`,
	},
	// 4
	{
		w: 12, h: 6,
		enemySpeedFactor: 1.1,
		doorFunc: addDoors2,
		enemyCount: 10,
		introText: `Why am I here? Really. Why. Am. I. Here.
I’m gonna quit after the next one if it’s broken too.`,
	},
	// 5
	{
		w: 10, h: 10,
		enemySpeedFactor: 1.2,
		doorFunc: addDoors2,
		enemyCount: 12,
		introText: `I’m DEFINITELY gonna quit if THIS one is broken.`,
	},
	// 6
	{
		w: 13, h: 9,
		enemySpeedFactor: 1.25,
		doorFunc: addDoors2,
		enemyCount: 14,
		introText: `Do they even try? And why can’t I just disable monsters or something?
Can I even fix this thing? I mean, the game is just bad.`,
	},
	// 7
	{
		w: 15, h: 8,
		enemySpeedFactor: 1.3,
		doorFunc: addDoors2,
		enemyCount: 16,
		introText: `Looking for “Passionate” colleagues, they said. Grow your skills, they said.
No one told me about modern servitude and endless fixing.`,
	},
	// 8
	{
		w: 8, h: 16,
		enemySpeedFactor: 1.4,
		doorFunc: addDoors2,
		enemyCount: 18,
		introText: `I could have learned something else. Like, ANYTHING ELSE. Nope, here I am, testing the latest GROUND BREAKING game for SLECHT SOFT. 
In their defense, the name was an obvious give-away.`,
	},
	// 9
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.5,
		doorFunc: addDoors2,
		enemyCount: 20,
		introText: `What if like, a meteor fell on the city and the powerline was gone and I couldn’t work. Or maybe a zombie apocalypse? 
Oooh, I could totally be a sarcastic guy with a barbed bat.`,
	},
	// 10
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.5,
		doorFunc: addDoors2,
		enemyCount: 22,
		introText: `Who am I kidding, if there was a zombie apocalypse I’d die the first day. So not zombie apocalypse. 
What if we cloned dinosaurs and life... uhm... found a way?`,
	},
	// 11
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.5,
		doorFunc: addDoors2,
		enemyCount: 25,
		introText: `Is there an end to these fixes? Is there a point to life? Oooh, I should do laundry tomorrow!
		`,
	},
	// 12
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.5,
		doorFunc: addDoors2,
		enemyCount: 30,
		introText: `The fact that I’m here means one of two things: I have no life or I’ve just mastered life and the universe.
		`,
	},
	// 13
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.6,
		doorFunc: addDoors2,
		enemyCount: 34,
		introText: `Is this the real life? Is this just slechtasie?
		`,
	},
	// 13
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.6,
		doorFunc: addDoors2,
		enemyCount: 36,
		introText: `I won’t be surprised if the next level doesn’t exist or something (please don’t exist)
		`,
	},
	// 14
	{
		w: 15, h: 15,
		enemySpeedFactor: 1.6,
		doorFunc: addDoors2,
		enemyCount: 40,
		introText: `Nope, it exists. F.M.L.
		`
	},
	// the end?
];


