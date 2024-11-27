'use client';

import React, { useEffect, useRef } from 'react';
import NavBar from '../../components/NavBar'; // Adjust the path as needed

export default function Snakeplusai({ repos }) { // Accept repos as a prop
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const gameInstance = new Game(canvas, context);
    gameInstance.start();

    // Cleanup on unmount
    return () => {
      gameInstance.stop();
    };
  }, []);

  return (
    <>
      <NavBar repos={repos} /> {/* Pass repos to NavBar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <canvas ref={canvasRef} width={500} height={600}></canvas>
      </div>
    </>
  );
}

// Constants
const SCORE_FONT = '50px Comic Sans MS';
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#FF0000';
const GRAY = '#6E6E6E';


class Game {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;

    this.player = new Player();
    this.window_width = canvas.width;
    this.window_height = canvas.height;

    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;

    this.top = this.window_height / 6;

    this.gridsize = 6;
    this.cellspacing = 3;
    this.cellh = (this.window_height - this.top) / this.gridsize - this.cellspacing;
    this.cellw = this.window_width / this.gridsize - this.cellspacing;

    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }

    this.score = 0;
    this.tries = 0;
    this.states = 0;

    this.animationFrameId = null;
    this.lastTime = 0;
    this.keysPressed = {};

    this.setupKeyListeners();
  }

  setupKeyListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }

  start() {
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    if (deltaTime >= 200) {
      this.update();
      this.draw();
      this.lastTime = timestamp;
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    let dir = 0;
    if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
      dir = 12;
    } else if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
      dir = 3;
    } else if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
      dir = 6;
    } else if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
      dir = 9;
    }

    this.player.updatedir(dir);

    // Update game grid
    [this.gamegrid, this.score] = this.player.move(this.gamegrid);

    if (this.gamegrid.length === 1 && this.gamegrid[0][0] === -10) {
      this.reset();
      return;
    }

    this.states += 1;
  }

  draw() {
    const ctx = this.context;
    // Clear canvas
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Draw game grid background
    ctx.fillStyle = GRAY;
    ctx.fillRect(0, this.HEIGHT / 6, this.WIDTH, this.HEIGHT);

    // Draw grid cells
    for (let i = 0; i < this.gridsize; i++) {
      for (let j = 0; j < this.gridsize; j++) {
        if (this.gamegrid[i][j] === 0) {
          ctx.fillStyle = BLACK;
        } else if (this.gamegrid[i][j] === 1) {
          ctx.fillStyle = RED;
        } else {
          ctx.fillStyle = WHITE;
        }

        ctx.fillRect(
          this.cellspacing * (i + 1) + this.cellw * i,
          this.cellspacing * (j + 1) + this.cellh * j + this.top,
          this.cellw,
          this.cellh
        );
      }
    }

    // Draw score
    this._draw_score();
  }

  _draw_score() {
    const ctx = this.context;
    ctx.font = SCORE_FONT;
    ctx.fillStyle = BLACK;
    ctx.textBaseline = 'top';

    const scoreText = `${this.score}`;
    ctx.fillText(scoreText, this.window_width / 2 - 50, 20);

    const triesText = `${this.tries}`;
    ctx.fillText(triesText, 20, 20);

    const statesText = `${this.player.static_states}`;
    ctx.fillText(statesText, this.window_width - 50, 20);
  }

  reset() {
    this.score = 0;
    this.tries += 1;
    this.states = 0;
    this.player.reset();
    // Reset game grid
    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }
  }
}

class Player {
  constructor() {
    this.length = 2;
    this.orientation = 3;
    this.cantgo = 9;
    this.score = 0;
    this.curplace = [0, 0];
    this.static_states = 0;

    this.gridsize = 6;

    // Initialize locations deque
    this.locations = [];
    const z = Math.floor(Math.random() * 5) + 1; // random int between 1 and 5
    this.locations.unshift([0, z]);
    this.locations.unshift([1, z]);

    this.foodplace = [
      Math.floor(Math.random() * 2) + 4,
      Math.floor(Math.random() * 2) + 4,
    ]; // random int between 4 and 5
  }

  reset() {
    this.orientation = 3;
    this.cantgo = 9;
    this.score = 0;
    this.length = 2;
    this.static_states = 0;
    this.locations = [];
    const z = Math.floor(Math.random() * 5) + 1;
    this.locations.unshift([0, z]);
    this.locations.unshift([1, z]);
    this.foodplace = [
      Math.floor(Math.random() * 2) + 4,
      Math.floor(Math.random() * 2) + 4,
    ];
  }

  updatedir(dir) {
    if (dir === 0) return;
    if (dir === this.cantgo) return;
    this.orientation = dir;
    this.cantgo = 12 - dir;
    if (dir === 6) this.cantgo = 12;
    if (dir === 12) this.cantgo = 6;
  }

  move(gamegrid) {
    this.static_states += 1;
    let trimsize = true;
    const gridsize = this.gridsize;

    const newfood = () => {
      let zx = Math.floor(Math.random() * gridsize);
      let zy = Math.floor(Math.random() * gridsize);
      let test = [zx, zy];
      while (this.locations.some((loc) => loc[0] === test[0] && loc[1] === test[1])) {
        zx = Math.floor(Math.random() * gridsize);
        zy = Math.floor(Math.random() * gridsize);
        test = [zx, zy];
      }
      return test;
    };

    let nextplace = null;
    const curplace = this.locations[0];

    if (this.orientation === 3) {
      nextplace = [curplace[0] + 1, curplace[1]];
    } else if (this.orientation === 6) {
      nextplace = [curplace[0], curplace[1] + 1];
    } else if (this.orientation === 9) {
      nextplace = [curplace[0] - 1, curplace[1]];
    } else if (this.orientation === 12) {
      nextplace = [curplace[0], curplace[1] - 1];
    }

    this.curplace = nextplace;

    // Logic to end the game
    if (
      nextplace[0] >= gridsize ||
      nextplace[0] < 0 ||
      nextplace[1] >= gridsize ||
      nextplace[1] < 0
    ) {
      return [[[-10]], 0];
    }

    for (let location of this.locations) {
      if (nextplace[0] === location[0] && nextplace[1] === location[1]) {
        return [[[-10]], 0];
      }
    }

    this.locations.unshift(nextplace);

    // Clear previous positions
    for (let i = 0; i < gridsize; i++) {
      for (let j = 0; j < gridsize; j++) {
        if (gamegrid[i][j] > 1) {
          gamegrid[i][j] = 0;
        }
      }
    }

    // Update game grid with new positions
    let i = 0;
    for (let location of this.locations) {
      if (i === 0) {
        // Snake head
        gamegrid[location[0]][location[1]] = 2;
      } else {
        // Snake body
        gamegrid[location[0]][location[1]] = 2 + (47 - i);
      }
      i += 1;
    }

    if (
      nextplace[0] === this.foodplace[0] &&
      nextplace[1] === this.foodplace[1]
    ) {
      this.foodplace = newfood();
      trimsize = false;
      this.score += 1;
      this.static_states = 0;
      this.length += 1;
    }

    if (trimsize) {
      const deletethis = this.locations.pop();
      gamegrid[deletethis[0]][deletethis[1]] = 0;
    }

    gamegrid[this.foodplace[0]][this.foodplace[1]] = 1;

    return [gamegrid, this.score];
  }

}
