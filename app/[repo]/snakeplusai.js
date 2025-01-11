'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from 'react';
import * as ort from 'onnxruntime-web';
import NavBar from '../../components/NavBar';
import Image from 'next/image';


export default function Snakeplusai({ repos }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null); 
  const speedChangeTimer = useRef(null);

  const [gridSize, setGridSize] = useState(4);
  // `speed` is the actual speed used by the game
  const [speed, setSpeed] = useState(200);  
  // `tempSpeed` is used while dragging the slider
  const [tempSpeed, setTempSpeed] = useState(200);
  
  const [isGameReady, setIsGameReady] = useState(false);
  const [finishImageExists, setFinishImageExists] = useState(false);

  const commentary = useMemo(() => ({
    4: "Trained in roughly 5 hours. Model is pretty solid overall. Still some rough edges, could be perfected in more training time.",
    5: "Trained in roughly 18 and a half hours. Much harder to perfect a 5x5 grid due to the odd nature. A 5x5 board has an odd number of total cells making it impossible to execute one sustainable pattern as seen in the endgame of the 4x4. Given further training the model could likely perfect a 5x5",
    6: "Trained in roughly 76 hours. For 4x4 and 5x5 the input is the entire grid. For the 6x6, 4 inputs were added in addition to the grid. Four new boolean inputs depict whether or not the model will die if it moves in each of the four directions. This helps the model converge much faster. I had trained a model over 3.5 days without this addition and it was ineffective.",
  }), []);

  const stopActiveGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
  }, []);

  const checkImageExists = (imagePath, callback) => {
    const img = new window.Image(); // Use `window.Image` to avoid conflict with `next/image`
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
    img.src = imagePath;
  };


  const startNewGame = useCallback(async (size) => {
    setIsGameReady(false);
    stopActiveGame();

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const newGameInstance = new Game(canvas, context, size);

    newGameInstance.msbetweenframes = speed;
    await newGameInstance.loadModel(size);
    newGameInstance.start();

    gameRef.current = newGameInstance;
    setIsGameReady(true);

    const imagePath = `/models/ppo${size}finish.png`;
    checkImageExists(imagePath, setFinishImageExists);
  }, [speed, stopActiveGame]);

  // This function is called repeatedly while the user is dragging the slider
  const handleSliderChange = (e) => {
    setTempSpeed(Number(e.target.value));
  };

  // This function is called when the user releases the mouse/touch
  const handleSliderChangeDone = () => {
    setSpeed(tempSpeed); 
    // Because we want the new speed to take effect now
  };

  // Watch for changes in `speed` with a 0.6s debounce to restart the game
  useEffect(() => {
    if (speedChangeTimer.current) {
      clearTimeout(speedChangeTimer.current);
    }

    // Only if there's already a running game do we schedule a restart
    if (gameRef.current) {
      speedChangeTimer.current = setTimeout(() => {
        stopActiveGame();
        startNewGame(gridSize);
      }, 600);
    }

    return () => {
      if (speedChangeTimer.current) {
        clearTimeout(speedChangeTimer.current);
      }
    };
  }, [speed, gridSize, stopActiveGame, startNewGame]);

  // Start a new game on mount or whenever `gridSize` changes
  useEffect(() => {
    startNewGame(gridSize);
    return () => {
      stopActiveGame();
    };
  }, [gridSize, startNewGame, stopActiveGame]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopActiveGame();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopActiveGame]);

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
          <label htmlFor="speed-slider">Frame Spacing: {tempSpeed}ms</label>
          <input
            id="speed-slider"
            type="range"
            min="35"
            max="500"
            step="10"
            value={tempSpeed}
            onChange={handleSliderChange}
            onMouseUp={handleSliderChangeDone}
            onTouchEnd={handleSliderChangeDone}
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
              <Image
                  src={`/models/ppo${gridSize}graph.png`}
                  alt={`Graph for PPO model with grid size ${gridSize}`}
                  width={500} // Provide a width (adjust as needed)
                  height={300} // Provide a height (adjust as needed)
                  style={{ marginTop: '10px', maxWidth: '100%', height: 'auto' }}
              />
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#a12aff' }}>
                  {commentary[gridSize]}
              </p>
          </div>
      )}

      {finishImageExists && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Image
                  src={`/models/ppo${gridSize}finish.png`}
                  alt={`Finish image for PPO model with grid size ${gridSize}`}
                  width={500} // Provide a width (adjust as needed)
                  height={300} // Provide a height (adjust as needed)
                  style={{ maxWidth: '100%', height: 'auto' }}
              />
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#555' }}>
                  Evaluated over 1000 games. Note - all snakes start at size 2, so the first score is only when they reach length 3.
              </p>
          </div>
      )}

    </>
  );
}


// Game class (unchanged except for your specific logic)
class Game {
  constructor(canvas, context, gridsize = 4) {
    this.canvas = canvas;
    this.context = context;
    this.gridsize = gridsize;
    this.player = new Player(this.gridsize);
    this.window_width = canvas.width;
    this.window_height = canvas.height;
    this.msbetweenframes = 200;

    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;

    this.top = this.window_height / 6;
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
    this.model = null;
    this.gameOver = false;
  }

  async loadModel(gridSize) {
    const modelPath = `/models/ppo_policy${gridSize}.onnx`;
    this.model = await ort.InferenceSession.create(modelPath);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
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
      console.error('Model not loaded');
      return 0; 
    }
    try {
      const tensor = new ort.Tensor('float32', obs, [1, obs.length]);
      const results = await this.model.run({ obs: tensor });
      console.log('Model outputs:', results);

      const actionTensor = results.action;
      let actionArray = Array.from(actionTensor.data);
      // Convert BigInt to Number if needed
      actionArray = actionArray.map((v) => Number(v));

      const action = actionArray[0];
      if (action >= 0 && action <= 3) {
        return action;
      } else {
        console.error('Invalid action value received:', action);
        return 0; 
      }
    } catch (error) {
      console.error('Error running the model:', error);
      return 0;
    }
  }

  start() {
    this.gameLoop = this.gameLoop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  async gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    if (deltaTime >= this.msbetweenframes) {
      await this.update();
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
      action = 0; 
    }
    const directionMap = [12, 3, 6, 9]; // Up, Right, Down, Left
    const dir = directionMap[action];
    this.player.updatedir(dir);

    [this.gamegrid, this.score] = this.player.move(this.gamegrid);

    if (this.gamegrid.length === 1 && this.gamegrid[0][0] === -10) {
      this.reset();
      return;
    }

    if (this.player.hasWon) {
      console.log('Player has won the game.');
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

    // Draw background
    ctx.fillStyle = GRAY;
    ctx.fillRect(0, this.HEIGHT / 6, this.WIDTH, this.HEIGHT);

    for (let y = 0; y < this.gridsize; y++) {
      for (let x = 0; x < this.gridsize; x++) {
        const value = this.gamegrid[y][x];

        if (value === 0) {
          ctx.fillStyle = BLACK;
        } else if (value === 1) {
          ctx.fillStyle = RED;
        } else if (this.gridsize === 6) {
          // Special coloring for 6x6
          if (value === 2) {
            ctx.fillStyle = WHITE; 
          } else if (value >= 3 && value < 100) {
            const shade = Math.max((value - 2) * 10, 150);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          } else if (value === 100) {
            ctx.fillStyle = 'rgb(100, 100, 255)'; 
          }
        } else {
          // Default coloring
          if (value === 2) {
            ctx.fillStyle = WHITE; 
          } else {
            const shade = Math.min((value - 2) * 5, 255);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          }
        }

        ctx.fillRect(
          this.cellspacing * (x + 1) + this.cellw * x,
          this.cellspacing * (y + 1) + this.cellh * y + this.top,
          this.cellw,
          this.cellh
        );
      }
    }

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
    this.player.hasWon = false;

    this.player.reset();

    this.gamegrid = [];
    for (let i = 0; i < this.gridsize; i++) {
      this.gamegrid.push(Array(this.gridsize).fill(0));
    }

    this.player.locations.forEach(([x, y], index) => {
      this.gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index);
    });

    const [foodX, foodY] = this.player.foodplace;
    this.gamegrid[foodY][foodX] = 1;

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

    this.orientation = 3; // Right
    this.cantgo = oppositeDirection[this.orientation];
    this.locations = [
      [1, 1], 
      [0, 1],
    ];
    this.foodplace = this._generateFoodPlace();
  }

  reset() {
    this.orientation = 3;
    this.cantgo = oppositeDirection[this.orientation];
    this.score = 0;
    this.length = 2;
    this.static_states = 0;

    this.locations = [
      [1, 1],
      [0, 1],
    ];

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
      return null;
    }

    const [zx, zy] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    console.log('Generated food position:', zx, zy);
    return [zx, zy];
  }

  updatedir(dir) {
    // Prevent 180-degree reversal
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
      nextplace = [curX + 1, curY]; // Right
    } else if (this.orientation === 6) {
      nextplace = [curX, curY + 1]; // Down
    } else if (this.orientation === 9) {
      nextplace = [curX - 1, curY]; // Left
    } else if (this.orientation === 12) {
      nextplace = [curX, curY - 1]; // Up
    }

    // Collision?
    if (
      nextplace[0] < 0 || 
      nextplace[0] >= this.gridsize ||
      nextplace[1] < 0 || 
      nextplace[1] >= this.gridsize ||
      this.locations.some(([x, y]) => x === nextplace[0] && y === nextplace[1])
    ) {
      console.log('Collision or out-of-bounds!');
      return [[[-10]], 0]; // Game over
    }

    this.locations.unshift(nextplace);

    // Eat food?
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

    // Rebuild game grid
    for (let y = 0; y < this.gridsize; y++) {
      for (let x = 0; x < this.gridsize; x++) {
        gamegrid[y][x] = 0;
      }
    }

    if (this.gridsize === 6) {
      this.locations.forEach(([x, y], idx) => {
        if (idx === this.locations.length - 1) {
          gamegrid[y][x] = 100; // Tail
        } else {
          gamegrid[y][x] = 2 + idx; // Head = 2
        }
      });
    } else {
      this.locations.forEach(([x, y], index) => {
        gamegrid[y][x] = index === 0 ? 2 : 2 + (47 - index);
      });
    }

    if (this.foodplace) {
      const [foodX, foodY] = this.foodplace;
      gamegrid[foodY][foodX] = 1;
    }

    console.log('Updated gamegrid:', gamegrid);
    return [gamegrid, this.score];
  }
}
