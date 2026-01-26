'use client';
import * as ort from 'onnxruntime-web';

export class Game {
  constructor(canvas, context, gridsize = 4, isAI = true, onGameEnd = null) {
    this.canvas = canvas;
    this.context = context;
    this.gridsize = gridsize;
    this.isAI = isAI;
    this.onGameEnd = onGameEnd;
    this.instanceId = Math.random().toString(36).substr(2, 9); // Unique instance ID
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
      try {
        this.model = await ort.InferenceSession.create(modelPath);
        console.log(`[${this.isAI ? 'AI' : 'User'}] Model loaded from ${modelPath}`);
      } catch (error) {
        console.error(`[AI] Failed to load model from ${modelPath}:`, error.message);
        console.warn(`[AI] No model available for grid size ${gridSize}. AI mode disabled.`);
        this.isAI = false;
        this.model = null;
      }
    }
  }

  stop() {
    this.gameActive = false;
    this.hasEnded = true; // Ensure the game is marked as ended
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log(`[${this.isAI ? 'AI' : 'User'}][${this.instanceId}] Animation loop stopped.`);
    }
    // Additional cleanup
    this.lastTime = 0;
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
    // Match training encoding: head (idx=0) = 2, tail (last) = 100, body = 2+idx
    this.player.locations.forEach(([x, y], index) => {
      if (this.gridsize === 6) {
        if (index === this.player.locations.length - 1) {
          // Tail is 100
          this.gamegrid[y][x] = 100;
        } else {
          // Head (idx=0) is 2, body is 2+idx
          this.gamegrid[y][x] = 2 + index;
        }
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
    console.log(`[${this.isAI ? 'AI' : 'User'}][${this.instanceId}] Game started.`);
  }

  async gameLoop(timestamp) {
    // Additional safety check to prevent orphaned loops
    if (!this.gameActive || this.hasEnded) {
      this.animationFrameId = null;
      return;
    }
    
    const deltaTime = timestamp - this.lastTime;
    if (deltaTime >= this.msbetweenframes && this.gameActive) {
      await this.update();
      this.draw();
      this.lastTime = timestamp;
    }
    if (this.gameActive && !this.hasEnded) {
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
    
    // Draw top bar with gradient
    const topBarGradient = ctx.createLinearGradient(0, 0, 0, this.topBarHeight);
    if (this.isAI) {
      topBarGradient.addColorStop(0, PURPLE);
      topBarGradient.addColorStop(1, DARK_BLUE);
    } else {
      topBarGradient.addColorStop(0, GREEN);
      topBarGradient.addColorStop(1, '#065f46');
    }
    ctx.fillStyle = topBarGradient;
    ctx.fillRect(0, 0, this.WIDTH, this.topBarHeight);
    
    // Add subtle border to top bar
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, this.WIDTH - 2, this.topBarHeight - 2);
    
    // Draw label with better typography
    ctx.font = "bold 48px 'Arial', sans-serif";
    ctx.fillStyle = WHITE;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const label = this.isAI ? "🤖 AI" : "👤 YOU";
    ctx.fillText(label, this.WIDTH / 2, this.topBarHeight / 2);
    
    // Add score display
    ctx.font = "bold 20px 'Arial', sans-serif";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 10, this.topBarHeight - 15);
    
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
    
    // Draw game area background with gradient
    const gameAreaGradient = ctx.createLinearGradient(0, this.topBarHeight, 0, this.HEIGHT);
    gameAreaGradient.addColorStop(0, '#1f2937');
    gameAreaGradient.addColorStop(1, '#111827');
    ctx.fillStyle = gameAreaGradient;
    ctx.fillRect(0, this.topBarHeight, this.WIDTH, this.HEIGHT - this.topBarHeight);
    
    // Draw cells with enhanced visuals
    for (let y = 0; y < this.gridsize; y++) {
      for (let x = 0; x < this.gridsize; x++) {
        const value = this.gamegrid[y][x];
        const cellX = this.cellspacing * (x + 1) + this.cellw * x;
        const cellY = this.cellspacing * (y + 1) + this.cellh * y + this.topBarHeight;
        
        // Create rounded rectangles for all cells
        const radius = 8;
        
        if (value === 0) {
          // Empty cell with subtle grid pattern
          ctx.fillStyle = '#374151';
          this.drawRoundedRect(ctx, cellX, cellY, this.cellw, this.cellh, radius);
          ctx.fill();
          
          // Add inner shadow effect
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1;
          this.drawRoundedRect(ctx, cellX + 1, cellY + 1, this.cellw - 2, this.cellh - 2, radius - 1);
          ctx.stroke();
        } else if (value === 1) {
          // Static food
          const foodSize = Math.min(this.cellw, this.cellh) * 0.9;
          const offsetX = (this.cellw - foodSize) / 2;
          const offsetY = (this.cellh - foodSize) / 2;
          
          // Glow effect
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#ef4444';
          this.drawRoundedRect(ctx, cellX + offsetX, cellY + offsetY, foodSize, foodSize, radius);
          ctx.fill();
          
          // Inner highlight
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fca5a5';
          this.drawRoundedRect(ctx, cellX + offsetX + 2, cellY + offsetY + 2, foodSize - 4, foodSize - 4, radius - 2);
          ctx.fill();
        } else if (this.gridsize === 6) {
          // 6x6 grid snake rendering
          if (value === 2) {
            // Snake head (idx=0) = 2
            this.drawSnakeHead(ctx, cellX, cellY, this.cellw, this.cellh, radius);
          } else if (value === 100) {
            // Snake tail (last idx) = 100
            this.drawSnakeBody(ctx, cellX, cellY, this.cellw, this.cellh, radius, this.player.locations.length - 1);
          } else if (value >= 3 && value < 100) {
            // Snake body with gradient
            this.drawSnakeBody(ctx, cellX, cellY, this.cellw, this.cellh, radius, value - 2);
          }
        } else {
          // 4x4 and 5x5 grid snake rendering
          if (value === 2) {
            // Snake head
            this.drawSnakeHead(ctx, cellX, cellY, this.cellw, this.cellh, radius);
          } else {
            // Snake body
            const bodyIndex = 47 - (value - 2);
            this.drawSnakeBody(ctx, cellX, cellY, this.cellw, this.cellh, radius, bodyIndex);
          }
        }
        
        // Draw eyes on snake head
        const isHead = (value === 2); // Head is always 2 for all grid sizes
        if (isHead && this.player.locations.length > 0) {
          const [headX, headY] = this.player.locations[0];
          if (headX === x && headY === y) {
            this.drawSnakeEyes(ctx, cellX, cellY, this.cellw, this.cellh, this.player.orientation);
          }
        }
      }
    }
  }

  // Helper method to draw rounded rectangles
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Draw snake head with gradient
  drawSnakeHead(ctx, x, y, width, height, radius) {
    const gradient = ctx.createRadialGradient(
      x + width / 2, y + height / 2, 0,
      x + width / 2, y + height / 2, Math.min(width, height) / 2
    );
    
    if (this.isAI) {
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(1, '#7c3aed');
    } else {
      gradient.addColorStop(0, '#34d399');
      gradient.addColorStop(1, '#10b981');
    }
    
    ctx.shadowColor = this.isAI ? '#a855f7' : '#10b981';
    ctx.shadowBlur = 10;
    ctx.fillStyle = gradient;
    this.drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw snake body with fading gradient
  drawSnakeBody(ctx, x, y, width, height, radius, segmentIndex) {
    const maxSegments = 20;
    const intensity = Math.max(0.3, 1 - (segmentIndex / maxSegments));
    
    if (this.isAI) {
      const r = Math.floor(168 * intensity + 80 * (1 - intensity));
      const g = Math.floor(85 * intensity + 60 * (1 - intensity));
      const b = Math.floor(247 * intensity + 120 * (1 - intensity));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.floor(52 * intensity + 80 * (1 - intensity));
      const g = Math.floor(211 * intensity + 120 * (1 - intensity));
      const b = Math.floor(153 * intensity + 100 * (1 - intensity));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }
    
    this.drawRoundedRect(ctx, x + 1, y + 1, width - 2, height - 2, radius - 1);
    ctx.fill();
    
    // Add subtle highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * intensity})`;
    this.drawRoundedRect(ctx, x + 2, y + 2, width - 4, height - 4, radius - 2);
    ctx.fill();
  }

  // Draw eyes on the snake head pointing in the direction of movement
  drawSnakeEyes(ctx, cellX, cellY, cellW, cellH, orientation) {
    const centerX = cellX + cellW / 2;
    const centerY = cellY + cellH / 2;
    
    // Eye size relative to cell size
    const eyeRadius = Math.min(cellW, cellH) * 0.08; // Small eyes
    const pupilRadius = eyeRadius * 0.6; // Pupil is smaller than eye
    
    // Calculate eye positions and pupil offsets based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    let pupilOffsetX = 0, pupilOffsetY = 0;
    
    // Eye spacing from center
    const eyeSpacing = Math.min(cellW, cellH) * 0.25;
    
    switch (orientation) {
      case 3: // Moving right
        leftEyeX = centerX + eyeSpacing * 0.3;
        leftEyeY = centerY - eyeSpacing * 0.6;
        rightEyeX = centerX + eyeSpacing * 0.3;
        rightEyeY = centerY + eyeSpacing * 0.6;
        pupilOffsetX = eyeRadius * 0.4; // Pupils look right
        pupilOffsetY = 0;
        break;
      case 6: // Moving down
        leftEyeX = centerX - eyeSpacing * 0.6;
        leftEyeY = centerY + eyeSpacing * 0.3;
        rightEyeX = centerX + eyeSpacing * 0.6;
        rightEyeY = centerY + eyeSpacing * 0.3;
        pupilOffsetX = 0;
        pupilOffsetY = eyeRadius * 0.4; // Pupils look down
        break;
      case 9: // Moving left
        leftEyeX = centerX - eyeSpacing * 0.3;
        leftEyeY = centerY - eyeSpacing * 0.6;
        rightEyeX = centerX - eyeSpacing * 0.3;
        rightEyeY = centerY + eyeSpacing * 0.6;
        pupilOffsetX = -eyeRadius * 0.4; // Pupils look left
        pupilOffsetY = 0;
        break;
      case 12: // Moving up
        leftEyeX = centerX - eyeSpacing * 0.6;
        leftEyeY = centerY - eyeSpacing * 0.3;
        rightEyeX = centerX + eyeSpacing * 0.6;
        rightEyeY = centerY - eyeSpacing * 0.3;
        pupilOffsetX = 0;
        pupilOffsetY = -eyeRadius * 0.4; // Pupils look up
        break;
      default:
        // Default to right-facing
        leftEyeX = centerX + eyeSpacing * 0.3;
        leftEyeY = centerY - eyeSpacing * 0.6;
        rightEyeX = centerX + eyeSpacing * 0.3;
        rightEyeY = centerY + eyeSpacing * 0.6;
        pupilOffsetX = eyeRadius * 0.4;
        pupilOffsetY = 0;
    }
    
    // Draw left eye
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw left pupil
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right eye
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right pupil
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Drawing constants.
const WHITE = '#FFFFFF';
const BLACK = '#1a1a1a';
const RED = '#FF4444';
const DARK_BLUE = '#1e3a8a';
const GREEN = '#10b981';
const PURPLE = '#8b5cf6';

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
    // Match training encoding: head (idx=0) = 2, tail (last) = 100, body = 2+idx
    if (this.gridsize === 6) {
      this.locations.forEach(([x, y], idx) => {
        if (idx === this.locations.length - 1) {
          // Tail is 100
          gamegrid[y][x] = 100;
        } else {
          // Head (idx=0) is 2, body is 2+idx
          gamegrid[y][x] = 2 + idx;
        }
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
