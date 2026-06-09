# Mine-Detector

## Quick Intro
This is a fun clone I created from scratch to mimick the gameplay of the classic game Minesweeper. This version, however, was built to run as a Discord activity.

## Gameplay
Once the game launches, you can choose between a Standard Game and a Custom Game. A Standard Game consists of a 20X20 grid with 50 mines while a custom game lets you choose the size of the grid as well as the number of mines (and even the [game seed](#about-the-seed))!

Gameplay follows the same rules as standard Minesweeper: left-click to uncover a square, right-click to flag a square. A number indicates the amount of adjacent mines (including diagonals) and no number means there are no adjacent mines.

## Losing the Game
The game is over when you click on a square containing a mine. When this happens, a popup will appear, telling you how many mines you still had to flag as well as the game seed. You can hide this popup to see the board where all squares are now uncovered to show you what the correct answer was. All correctly flagged mines will have a green background, and all mines that were not flagged (and safe squares that _were_ flagged) will have a red background so you can understand where you made your mistake.

## Winning the Game
If you manage to uncover all safe squares _and_ flag all mines on the grid, you have won! You will then see a popup that tells you your time and the game seed. Like with losing the game, you can hide the popup to view the board.

## About the Seed
This version of Minesweeper is seeded using the current time (if no seed is provided). However, when creating a Custom Game, a seed can be given, allowing you to try getting a very fast time with a known grid, or even just to share a funny-looking game with your friends.


## Acknowledgements
Thank you to the friends who inspired me to make this game!

> ℹ️ This app is based on the template used in the [Building An Activity](https://discord.com/developers/docs/activities/building-an-activity) tutorial in the Discord Developer Docs.