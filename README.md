# Mine-Detector

## Overview
Mine-Detector is a Minesweeper-inspired Discord activity built from scratch as a personal project.

The game preserves the core Minesweeper experience while allowing players to customize the board to their preferred difficulty.

## Gameplay
Once the game launches, you can choose between:
- Standard Game: 20×20 grid with 50 mines
- Custom Game: Configure the board size, number of mines, and optionally provide a [game seed](#about-the-seed)

Gameplay follows the same rules as standard Minesweeper:
- Left-click to uncover a square
- Right-click to place or remove a flag
- Numbered squares indicate the number of adjacent mines, including diagonals
- Blank squares indicate there are no adjacent mines

## Losing a Game
The game ends when a square containing a mine is uncovered. When this happens, a popup will appears that indicates:
1. How many mines that remained unflagged
2. The game seed 

The popup can be hidden to view the fully uncovered board. All correctly flagged mines will have a green background while missed mines and incorrectly flagged squares will have a red background, making it easy to identify any mistakes.

## Winning a Game
To win, all safe squares must be uncovered and all mines must be flagged.

Upon winning a agame, you will see a popup that displays:
1. The time it took you to finish
2. The game seed
3. For Standard Games, a message indicating that you have set a new record or your previous record, as applicable

The popup can be hidden to view the board.

Records are associated with your Discord user ID so that they persistant across game sessions.

## About the Seed
By defualt, games are seeded using the current time; however, when beginning a Custom Game, a numerical seed can be provided, allowing you to try speedrunning a known grid or share a interesting board with your friends.
<br>

## Acknowledgements
Special thanks to the friends who inspired me to make this game!

> ℹ️ This app is based on the template used in the [Building An Activity](https://discord.com/developers/docs/activities/building-an-activity) tutorial in the Discord Developer Docs.