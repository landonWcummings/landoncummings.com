'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';
import NavBar from '../../components/NavBar'; // Adjust the path as needed

let activeGames = []; // Array to track all active game instances

export default function Snakeplusai({ repos }) {
  const canvasRef = useRef(null);
  const [gridSize, setGridSize] = useState(4); // Default grid size
  const [speed, setSpeed] = useState(200); // Default game speed (ms between frames)
  const [isGameReady, setIsGameReady] = useState(false); // Track if the game is ready

  const commentary = {
    4: "Trained in roughly 5 hours. Model is pretty solid overall. Still some rough edges, could be perfected in more training time.",
    5: "Trained in roughly 18 and a half hours. Much harder to perfect a 5x5 grid due to the odd nature. A 5x5 board has an odd number of total cells making it impossible to execute one sustainable pattern as seen in the endgame of the 4x4. Given further training the model could likely perfect a 5x5",
    6: "The largest grid, challenging and rewarding for advanced players.",
  };

  const stopAllGames = () => {
    // Stop and clear all active game instances
    activeGames.forEach((game) => game.stop());
    activeGames = [];
  };

  const startNewGame = async (size) => {
    setIsGameReady(false); // Set game as not ready while loading

    // Stop all existing games before starting a new one
    stopAllGames();

    // Create a new game instance
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const newGameInstance = new Game(canvas, context, size);

    newGameInstance.msbetweenframes = speed; // Set initial speed
    await newGameInstance.loadModel(size);
    newGameInstance.start();

    activeGames.push(newGameInstance); // Add the new game to the active games array
    setIsGameReady(true); // Set game as ready
  };

  const updateGameSpeed = (newSpeed) => {
    setSpeed(newSpeed); // Update speed in state
    activeGames.forEach((game) => {
      game.msbetweenframes = newSpeed; // Update speed for all active games
    });
  };

  useEffect(() => {
    // Start a new game whenever the grid size changes
    startNewGame(gridSize);

    // Stop all games when the component unmounts
    return () => {
      stopAllGames();
    };
  }, [gridSize]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllGames();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleGridSizeChange = (size) => {
    setGridSize(size);
  };

  return (
    <>
      <NavBar repos={repos} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
        <p>Snake model trained with Proximal Policy Optimization</p>
        <canvas ref={canvasRef} width={500} height={600}></canvas>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="speed-slider">Frame Spacing: {speed}ms</label>
          <input
            id="speed-slider"
            type="range"
            min="50"
            max="500"
            step="10"
            value={speed}
            onChange={(e) => updateGameSpeed(Number(e.target.value))}
            style={{ width: '300px', marginTop: '5px' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
        {[4, 5, 6].map((size) => (
          <button
            key={size}
            onClick={() => handleGridSizeChange(size)}
            style={{
              padding: '10px 20px',
              border: '2px solid #000',
              borderRadius: '5px',
              backgroundColor: size === gridSize ? '#4CAF50' : '#FFF',
              color: size === gridSize ? '#FFF' : '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
              outline: size === gridSize ? '2px solid #4CAF50' : 'none',
            }}
          >
            {size}x{size}
          </button>
        ))}
      </div>
      {isGameReady && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <img
            src={`/models/ppo${gridSize}graph.png`}
            alt={`Graph for PPO model with grid size ${gridSize}`}
            style={{ marginTop: '10px', maxWidth: '100%', height: 'auto' }}
          />
          <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#a12aff' }}>
            {commentary[gridSize]}
          </p>
        </div>
      )}
    </>
  );
}

// Game class remains unchanged
class Game {
  constructor(canvas, context, gridsize = 4) {
    this.canvas = canvas;
    this.context = context;
    this.gridsize = gridsize;
    this.player = new Player(this.gridsize);
    this.window_width = canvas.width;
    this.window_height = canvas.height;
    this.msbetweenframes = 200

    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;

    this.top = this.window_height / 6;

    this.cellspacing = 3;
    this.cellh = (this.window_height - this.top) / this.gridsize - this.cellspacing;
    this.cellw = this.window_width / this.gridsize - this.cellspacing;

    // Initialize the game grid
    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }

    this.score = 0;
    this.tries = 0;
    this.states = 0;

    this.animationFrameId = null;
    this.lastTime = 0;

    this.model = null; // ONNX Runtime model session
  }

  async loadModel(gridSize) {
    const modelPath = `/models/ppo_policy${gridSize}.onnx`;
    this.model = await ort.InferenceSession.create(modelPath);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null; // Ensure it's properly cleared
    }
  }


  // Prepare observation by flattening the grid
  getObservation() {
    const obs = this.gamegrid.flat();
    return new Float32Array(obs);
  }

  // Get action from the AI model
  async getAction(obs) {
    if (!this.model) {
      console.error('Model not loaded');
      return 0; // Default action if model isn't ready
    }

    try {
      // Prepare input tensor
      const tensor = new ort.Tensor('float32', obs, [1, obs.length]);
      const feeds = { obs: tensor };

      // Run the model
      const results = await this.model.run(feeds);

      console.log('Model outputs:', results);

      // Access the action tensor
      const actionTensor = results.action;

      let actionArray;
      if (actionTensor.data instanceof BigInt64Array || actionTensor.data instanceof BigUint64Array) {
        actionArray = Array.from(actionTensor.data).map(Number);
      } else if (actionTensor.data instanceof Int32Array || actionTensor.data instanceof Float32Array) {
        actionArray = Array.from(actionTensor.data);
      } else {
        console.error('Unexpected data type for action tensor:', actionTensor.data);
        return 0; // Default action on error
      }

      const action = actionArray[0];

      // Ensure action is within valid bounds
      if (action >= 0 && action <= 3) {
        return action; // Return valid action
      } else {
        console.error('Invalid action value received:', action);
        return 0; // Default action on error
      }
    } catch (error) {
      console.error('Error running the model:', error);
      return 0; // Default action on error
    }
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

  async gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    if (deltaTime >= this.msbetweenframes) {
      await this.update(); // Wait for the async update
      this.draw();
      this.lastTime = timestamp;
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  async update() {
    const obs = this.getObservation();
    let action = await this.getAction(obs);
  
    if (action === undefined || action < 0 || action > 3) {
      console.warn('Invalid action received:', action, '- Using fallback');
      action = 0; // Default to 'up'
    }
  
    const directionMap = [12, 3, 6, 9]; // Up, Right, Down, Left
    const dir = directionMap[action];
  
    this.player.updatedir(dir);
  
    // Continue with game logic
    [this.gamegrid, this.score] = this.player.move(this.gamegrid);
  
    // Handle game over state triggered by move logic
    if (this.gamegrid.length === 1 && this.gamegrid[0][0] === -10) {
      this.reset();
      return;
    }
  
    // Check if player has won
    if (this.player.hasWon) {
      console.log('Player has won the game.');
      // Allow one frame to display the full snake, then reset
      this.gameOver = true;
    }
  
    if (this.gameOver) {
      this.reset();
      this.gameOver = false;
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
    for (let y = 0; y < this.gridsize; y++) {
      for (let x = 0; x < this.gridsize; x++) {
        if (this.gamegrid[y][x] === 0) {
          ctx.fillStyle = BLACK; // Empty cell
        } else if (this.gamegrid[y][x] === 1) {
          ctx.fillStyle = RED; // Food
        } else if (this.gamegrid[y][x] === 2) {
          ctx.fillStyle = WHITE; // Snake head
        } else {
          // Snake body with fading effect based on value
          const shade =  Math.min((this.gamegrid[y][x] - 2) * 5, 200);
          const shade2 = (this.gamegrid[y][x] - 2) 
          ctx.fillStyle = `rgb(${shade}, ${shade2}, ${shade})`;
        }
        ctx.fillRect(
          this.cellspacing * (x + 1) + this.cellw * x,
          this.cellspacing * (y + 1) + this.cellh * y + this.top,
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
    this.player.hasWon = false; // Reset the hasWon flag


    this.player.reset();

    // Reinitialize the grid
    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }

    // Place the snake and food on the grid
    this.player.locations.forEach(([x, y], index) => {
      this.gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index); // Head is 2, body has unique values
    });

    const [foodX, foodY] = this.player.foodplace;
    this.gamegrid[foodY][foodX] = 1; // Food is 1

    console.log('Game grid after reset:', this.gamegrid);
  }
}
// Constants
const SCORE_FONT = '50px Comic Sans MS';
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#FF0000';
const GRAY = '#6E6E6E';

const oppositeDirection = {
  3: 9,   // Right's opposite is Left
  6: 12,  // Down's opposite is Up
  9: 3,   // Left's opposite is Right
  12: 6,  // Up's opposite is Down
};

class Player {
  constructor(gridsize) {
    this.length = 2;
    this.gridsize = gridsize;
    this.score = 0;
    this.static_states = 0;
    this.hasWon = false;

    this.orientation = 3; // Initial direction: Right
    this.cantgo = oppositeDirection[this.orientation]; // Correctly set to Left

    // Set initial positions explicitly
    this.locations = [
      [1, 1], // Head at (second row, second column)
      [0, 1], // Body at (first row, second column)
    ];

    // Place food randomly on the grid
    this.foodplace = this._generateFoodPlace();
  }
  

  reset() {
    this.orientation = 3; // Default direction: Right
    this.cantgo = oppositeDirection[this.orientation]; // Correctly set to Left
    this.score = 0;
    this.length = 2;
    this.static_states = 0;

    // Explicitly set the snake's starting position
    this.locations = [
      [1, 1], // Head at (second row, second column)
      [0, 1], // Body at (first row, second column)
    ];

    // Generate food in a random position not overlapping with the snake
    this.foodplace = this._generateFoodPlace();
    console.log('Reset: Snake locations:', this.locations, 'Food:', this.foodplace);
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
      return null; // No space left for food
    }

    const [zx, zy] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    console.log('Generated food position:', zx, zy);
    return [zx, zy];
  }



  updatedir(dir) {
    if (dir === 0 || dir === this.cantgo) return;
    this.orientation = dir;
    this.cantgo = oppositeDirection[dir]; // Correctly set the opposite direction
  }

  move(gamegrid) {
    this.static_states += 1;
    let trimsize = true;
    const gridsize = this.gridsize;

    let nextplace;
    const [curX, curY] = this.locations[0]; // Head of the snake

    // Determine the next position based on the direction
    if (this.orientation === 3) {
      nextplace = [curX + 1, curY]; // Right
    } else if (this.orientation === 6) {
      nextplace = [curX, curY + 1]; // Down
    } else if (this.orientation === 9) {
      nextplace = [curX - 1, curY]; // Left
    } else if (this.orientation === 12) {
      nextplace = [curX, curY - 1]; // Up
    }

    // Check bounds and collisions
    if (
      nextplace[0] < 0 ||
      nextplace[0] >= gridsize ||
      nextplace[1] < 0 ||
      nextplace[1] >= gridsize ||
      this.locations.some(([x, y]) => x === nextplace[0] && y === nextplace[1])
    ) {
      console.log('Collision or out-of-bounds!');
      return [[[-10]], 0]; // Signal game over
    }

    // Update snake positions
    this.locations.unshift(nextplace);

    // Check for food
    if (
      this.foodplace &&
      nextplace[0] === this.foodplace[0] &&
      nextplace[1] === this.foodplace[1]
    ) {
      this.foodplace = this._generateFoodPlace(); // Attempt to generate new food
      trimsize = false; // Keep snake length
      this.score += 1;
      this.static_states = 0;
      this.length += 1;
  
      if (this.foodplace === null) {
        // No space for new food; snake has filled the grid
        console.log('Snake has filled the entire grid.');
        this.hasWon = true; // Set hasWon flag
      }
    }
  
    // Trim tail if no food eaten
    if (trimsize) {
      this.locations.pop();
    }

    // Update gamegrid with snake and food
    for (let y = 0; y < gridsize; y++) {
      for (let x = 0; x < gridsize; x++) {
        gamegrid[y][x] = 0; // Clear previous values
      }
    }

    this.locations.forEach(([x, y], index) => {
      gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index); // Head is 2, body has unique values
    });

    if (this.foodplace) {
      const [foodX, foodY] = this.foodplace;
      gamegrid[foodY][foodX] = 1; // Food is 1
    }


    console.log('Updated gamegrid:', gamegrid);

    return [gamegrid, this.score];
  }
}
