# 421 Dice Game App

![Game Screenshot](screenshot.png)

This repository contains the source code and assets for a browser-based dice game app. The game is based on the popular dice game called "421", where players roll three dice and aim to reach the highest score by combining different dice combinations.

## Demo

You can try out the live demo of the game [here](https://delcourtfl.github.io/421Destruction/).

## Features

- 1 to 7 players.
- Scores tracking according to 421 game rules.
- 3D dice rolling animation.

## Custom Installation

1. Clone the repository.
2. Launch `python server.py` to create a small http server.
3. Open `http://localhost:8000/` in your preferred web browser (no online dependencies).

## Usage

1. Select the number of players (1-7).
2. Click the 'Play' button to start the game.
2. Roll the dice by clicking the 'Dice roll' button.
3. Choose the dice combinations to keep or re-roll.
4. Continue rolling until you reach a good combination or the limit.
5. Push the 'Next Player' button to start the next player turn.
6. Once everyone has played, the results will be showed in an alert.

(Broken dice are rerolled automatically)

## Game Rules

- First Player set the maximum number of available throws.
- 3 dices are rolled and any of them can be kept for the next roll.
- Scoring is done as :

    | Score Range   | Score Formula       | Points |
    | ------------- | ------------------- | ------ |
    | 421           | 10,000              | 8pts   |
    | 111           | 7,000               | 7pts   |
    | 11x           | 1,000 * x           | xpts   |
    | xxx           | 1,000 + xxx         | xpts   |
    | x x+1 x+2     | 700 / 800 / 900 / 1,000 (4 possibilities) | 2pts   |
    | xyz           | xyz [0 - 666]       | 1pt    |
    | 221           | 221 (lowest)        | 4pts   |

## Technologies Used

- HTML, CSS, and JavaScript (+ Python for the simple webserver).
- [Three.js](https://github.com/mrdoob/three.js) for 3D graphics rendering.
- [Cannon.es](https://github.com/pmndrs/cannon-es) for physics simulation.

## License

[MIT License](LICENSE)

## Acknowledgements

- [Three.js Rolling Dice Tutorial](https://github.com/uuuulala/Threejs-rolling-dice-tutorial/) from this tutorial : [Crafting a Dice Roller with Three.js and Cannon.es](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/).
- 3D dice model from [Free3D](https://free3d.com/3d-model/dice-34662.html).
