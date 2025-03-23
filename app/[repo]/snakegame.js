'use client';
import * as ort from 'onnxruntime-web';

export class Game {
  constructor(canvas, context, gridsize = 4, isAI = true, onGameEnd = null) {
    this.canvas = canvas;
    this.context = context;
    this.gridsize = gridsize;
    this.isAI = isAI;
    this.onGameEnd = onGameEnd;
    this.player = new Player(this.gridsize);
    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;
    this.topBarHeight = this.HEIGHT / 6;
    this.cellspacing = 3;
    this.cellh = (this.HEIGHT - this.topBarHeight) / this.gridsize - this.cellspacing;
    this.cellw = this.WIDTH / this.gridsize - this.cellspacing;
    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }
    this.score = 0;
    this.tries = 0;
    this.states = 0;
    this.animationFrameId = null;
    this.lastTime = 0;
    this.msbetweenframes = 300;
    this.model = null;
    this.gameActive = false;
    this.hasEnded = false; // ensure endGame runs only once
  }

  async loadModel(gridSize) {
    if (this.isAI) {
      const modelPath = `/models/ppo_policy${gridSize}.onnx`;
      this.model = await ort.InferenceSession.create(modelPath);
      console.log(`[${this.isAI ? 'AI' : 'User'}] Model loaded from ${modelPath}`);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log(`[${this.isAI ? 'AI' : 'User'}] Animation loop stopped.`);
    }
  }

  // Resets game state and redraws the board.
  reset() {
    this.score = 0;
    this.tries += 1;
    this.states = 0;
    this.hasEnded = false;
    this.player.hasWon = false;
    this.player.reset();
    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }
    this.player.locations.forEach(([x, y], index) => {
      if (this.gridsize === 6) {
        this.gamegrid[y][x] = index === this.player.locations.length - 1 ? 100 : 2 + index;
      } else {
        this.gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index);
      }
    });
    if (this.player.foodplace) {
      const [foodX, foodY] = this.player.foodplace;
      this.gamegrid[foodY][foodX] = 1;
    }
    this.gameActive = false;
  }

  start() {
    this.gameActive = true;
    this.hasEnded = false;
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    console.log(`[${this.isAI ? 'AI' : 'User'}] Game started.`);
  }

  async gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    if (deltaTime >= this.msbetweenframes && this.gameActive) {
      await this.update();
      this.draw();
      this.lastTime = timestamp;
    }
    if (this.gameActive) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  async update() {
    // If AI, update its direction.
    if (this.isAI) {
      const obs = this.getObservation();
      const action = await this.getAction(obs);
      const directionMap = [12, 3, 6, 9];
      const dir = directionMap[action];
      this.player.updatedir(dir);
      console.log(`[AI] Action: ${action} -> Direction: ${dir}`);
    }
    
    [this.gamegrid, this.score] = this.player.move(this.gamegrid);
    
    // Check for collision (loss).
    if (this.gamegrid.length === 1 && this.gamegrid[0][0] === -10) {
      console.log(`[${this.isAI ? 'AI' : 'User'}] Collision detected.`);
      this.endGame(false);
      return;
    }
    
    // Check if grid is completely filled.
    const gridFull = this.gamegrid.every(row => row.every(cell => cell !== 0));
    if (gridFull) {
      console.log("Hard reset triggered: Snake has filled the entire grid. Player has won the game.");
      this.endGame(true);
      return;
    }
    
    // Check player's win flag.
    if (this.player.hasWon) {
      console.log("Hard reset triggered: Player's win flag is true. Player has won the game.");
      this.endGame(true);
      return;
    }
    
    this.states += 1;
  }

  getObservation() {
    const flatGrid = this.gamegrid.flat();
    if (this.gridsize === 6) {
      const [headX, headY] = this.player.locations[0];
      const dangerUp = this.isCollision(headX, headY - 1);
      const dangerRight = this.isCollision(headX + 1, headY);
      const dangerDown = this.isCollision(headX, headY + 1);
      const dangerLeft = this.isCollision(headX - 1, headY);
      return new Float32Array(flatGrid.concat(dangerUp, dangerRight, dangerDown, dangerLeft));
    }
    return new Float32Array(flatGrid);
  }

  isCollision(x, y) {
    if (x < 0 || x >= this.gridsize || y < 0 || y >= this.gridsize) {
      return 1;
    }
    for (let i = 0; i < this.player.locations.length; i++) {
      const [sx, sy] = this.player.locations[i];
      if (sx === x && sy === y) {
        return 1;
      }
    }
    return 0;
  }

  async getAction(obs) {
    if (!this.model) {
      console.error('[AI] Model not loaded.');
      return 0;
    }
    try {
      const tensor = new ort.Tensor('float32', obs, [1, obs.length]);
      const results = await this.model.run({ obs: tensor });
      const actionTensor = results.action;
      let actionArray = Array.from(actionTensor.data).map(Number);
      const action = actionArray[0];
      if (action >= 0 && action <= 3) {
        return action;
      } else {
        console.error('[AI] Invalid action received:', action);
        return 0;
      }
    } catch (error) {
      console.error('[AI] Error during inference:', error);
      return 0;
    }
  }

  // endGame stops the loop, logs a hard reset, and calls the parent callback with a winner message.
  endGame(won) {
    if (!this.gameActive || this.hasEnded) return;
    this.hasEnded = true;
    console.log(`[${this.isAI ? 'AI' : 'User'}] endGame triggered. Won: ${won}`);
    this.stop();
    this.gameActive = false;
    
    let msg;
    if (this.player.hasWon) {
      const winner = this.isAI ? "AI" : "YOU";
      msg = `Congratulations, ${winner} wins!`;
    } else {
      // When the user loses, show only "AI wins!"
      msg = "AI wins!";
    }
    console.log(`[Game End] ${msg}`);
    
    // Call parent's callback with the winner message.
    if (this.onGameEnd) {
      this.onGameEnd(msg);
    }
  }

  // Draws the game board.
  draw() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    
    // Draw top bar.
    ctx.fillStyle = "#0000FF";
    ctx.fillRect(0, 0, this.WIDTH, this.topBarHeight);
    ctx.font = "bold 50px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = 'middle';
    const label = this.isAI ? "AI" : "YOU";
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, (this.WIDTH - textWidth) / 2, this.topBarHeight / 2);
    
    // Check for collision grid state and avoid out-of-bounds access.
    if (
      this.gamegrid.length !== this.gridsize ||
      this.gamegrid.some(row => row.length !== this.gridsize) ||
      (this.gamegrid.length === 1 && this.gamegrid[0].length === 1 && this.gamegrid[0][0] === -10)
    ) {
      ctx.fillStyle = RED;
      ctx.font = "bold 50px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", this.WIDTH / 2, this.HEIGHT / 2);
      return;
    }
    
    // Draw game area background.
    ctx.fillStyle = GRAY;
    ctx.fillRect(0, this.topBarHeight, this.WIDTH, this.HEIGHT - this.topBarHeight);
    
    // Draw cells.
    for (let y = 0; y < this.gridsize; y++) {
      for (let x = 0; x < this.gridsize; x++) {
        const value = this.gamegrid[y][x];
        if (value === 0) {
          ctx.fillStyle = BLACK;
        } else if (value === 1) {
          ctx.fillStyle = RED;
        } else if (this.gridsize === 6) {
          if (value === 2) {
            ctx.fillStyle = WHITE;
          } else if (value >= 3 && value < 100) {
            const shade = Math.max((value - 2) * 10, 150);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          } else if (value === 100) {
            ctx.fillStyle = 'rgb(100, 100, 255)';
          }
        } else {
          if (value === 2) {
            ctx.fillStyle = WHITE;
          } else {
            const shade = Math.min((value - 2) * 5, 255);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          }
        }
        ctx.fillRect(
          this.cellspacing * (x + 1) + this.cellw * x,
          this.cellspacing * (y + 1) + this.cellh * y + this.topBarHeight,
          this.cellw,
          this.cellh
        );
      }
    }
  }
}

// Drawing constants.
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#FF0000';
const GRAY = '#6E6E6E';

export class Player {
  constructor(gridsize) {
    this.length = 2;
    this.gridsize = gridsize;
    this.score = 0;
    this.static_states = 0;
    this.hasWon = false;
    this.orientation = 3;
    this.cantgo = oppositeDirection[this.orientation];
    this.locations = [
      [1, 1],
      [0, 1]
    ];
    this.foodplace = this._generateFoodPlace();
  }

  reset() {
    this.orientation = 3;
    this.cantgo = oppositeDirection[this.orientation];
    this.score = 0;
    this.length = 2;
    this.static_states = 0;
    this.hasWon = false;
    this.locations = [
      [1, 1],
      [0, 1]
    ];
    this.foodplace = this._generateFoodPlace();
  }

  _generateFoodPlace() {
    const emptyCells = [];
    for (let x = 0; x < this.gridsize; x++) {
      for (let y = 0; y < this.gridsize; y++) {
        if (!this.locations.some(([locX, locY]) => locX === x && locY === y)) {
          emptyCells.push([x, y]);
        }
      }
    }
    if (emptyCells.length === 0) {
      console.log('No space to place food.');
      return null;
    }
    const [zx, zy] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return [zx, zy];
  }

  updatedir(dir) {
    if (dir === 0 || dir === this.cantgo) return;
    this.orientation = dir;
    this.cantgo = oppositeDirection[dir];
  }

  move(gamegrid) {
    this.static_states += 1;
    let trimsize = true;
    const [curX, curY] = this.locations[0];
    let nextplace;
    if (this.orientation === 3) {
      nextplace = [curX + 1, curY];
    } else if (this.orientation === 6) {
      nextplace = [curX, curY + 1];
    } else if (this.orientation === 9) {
      nextplace = [curX - 1, curY];
    } else if (this.orientation === 12) {
      nextplace = [curX, curY - 1];
    }
    if (
      nextplace[0] < 0 ||
      nextplace[0] >= this.gridsize ||
      nextplace[1] < 0 ||
      nextplace[1] >= this.gridsize ||
      this.locations.some(([x, y]) => x === nextplace[0] && y === nextplace[1])
    ) {
      console.log('Collision or out-of-bounds!');
      return [[[-10]], 0];
    }
    this.locations.unshift(nextplace);
    if (this.foodplace && nextplace[0] === this.foodplace[0] && nextplace[1] === this.foodplace[1]) {
      this.foodplace = this._generateFoodPlace();
      trimsize = false;
      this.score += 1;
      this.static_states = 0;
      this.length += 1;
      if (this.foodplace === null) {
        console.log('Snake has filled the entire grid.');
        this.hasWon = true;
      }
    }
    if (trimsize) {
      this.locations.pop();
    }
    
    // Instead of modifying the passed grid directly,
    // check each row exists before setting its cells to 0.
    for (let y = 0; y < this.gridsize; y++) {
      if (!gamegrid[y]) {
        // If the row doesn't exist, create it.
        gamegrid[y] = new Array(this.gridsize).fill(0);
      } else {
        for (let x = 0; x < this.gridsize; x++) {
          gamegrid[y][x] = 0;
        }
      }
    }
    
    // Now assign snake cells and food.
    if (this.gridsize === 6) {
      this.locations.forEach(([x, y], idx) => {
        gamegrid[y][x] = idx === this.locations.length - 1 ? 100 : 2 + idx;
      });
    } else {
      this.locations.forEach(([x, y], index) => {
        gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index);
      });
    }
    if (this.foodplace) {
      const [foodX, foodY] = this.foodplace;
      if (gamegrid[foodY]) {
        gamegrid[foodY][foodX] = 1;
      }
    }
    return [gamegrid, this.score];
  }  
}

const oppositeDirection = {
  3: 9,
  6: 12,
  9: 3,
  12: 6
};
