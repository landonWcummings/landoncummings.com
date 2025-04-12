'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '../../components/NavBar';
import * as ort from 'onnxruntime-web';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Utility: choose a random element from an array.
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Returns a background color for a given tile (tile value is stored as an exponent; e.g., 1 represents 2, 2 represents 4, etc.)
const getTileColor = (value) => {
  const colors = {
    0: "#cdc1b4",
    1: "#eee4da",
    2: "#ede0c8",
    3: "#f2b179",
    4: "#f59563",
    5: "#f67c5f",
    6: "#f65e3b",
    7: "#edcf72",
    8: "#edcc61",
    9: "#edc850",
    10: "#edc53f",
    11: "#edc22e",
    12: "#3c3a32"
  };
  return colors[value] || "#3c3a32";
};

// Returns an arrow symbol based on direction (0: up, 1: down, 2: left, 3: right)
const getArrowSymbol = (direction) => {
  switch (direction) {
    case 0:
      return '↑';
    case 1:
      return '↓';
    case 2:
      return '←';
    case 3:
      return '→';
    default:
      return '';
  }
};

// Game2048 class mimicking the training environment with traditional 2048 scoring.
class Game2048 {
  constructor(updateCallback) {
    this.size = 4;
    this.board = this.makeEmptyBoard();
    this.score = 0;
    this.numSteps = 0;
    this.done = false;
    this.lastAction = null; // Last valid move direction: 0 (up), 1 (down), 2 (left), 3 (right).
    this.updateCallback = updateCallback;
  }

  makeEmptyBoard() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(0));
  }

  reset() {
    this.board = this.makeEmptyBoard();
    this.score = 0;
    this.numSteps = 0;
    this.done = false;
    this.lastAction = null;
    this.addTile();
    this.addTile();
    this.updateCallback(this.getState());
  }

  getState() {
    return {
      board: this.board.map(row => row.slice()),
      score: this.score,
      done: this.done,
      lastAction: this.lastAction,
    };
  }

  copyBoard() {
    return this.board.map(row => row.slice());
  }

  step(action) {
    if (this.done) return;
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) {
      this.done = true;
      this.updateCallback(this.getState());
      return;
    }
    if (!legalMoves.includes(action)) return;

    const boardBefore = this.copyBoard();
    let mergeResult = 0;
    if (action === 0) {
      [this.board, mergeResult] = this.moveUp(this.board);
    } else if (action === 1) {
      [this.board, mergeResult] = this.moveDown(this.board);
    } else if (action === 2) {
      [this.board, mergeResult] = this.moveLeft(this.board);
    } else if (action === 3) {
      [this.board, mergeResult] = this.moveRight(this.board);
    }
    if (!this.boardsEqual(this.board, boardBefore)) {
      this.lastAction = action;
      this.score += mergeResult;
      this.score = Math.floor(this.score);
      this.addTile();
    }
    this.numSteps += 1;
    this.done = this.checkGameOver();
    this.updateCallback(this.getState());
  }

  boardsEqual(b1, b2) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (b1[i][j] !== b2[i][j]) return false;
      }
    }
    return true;
  }

  getLegalMoves() {
    const legal = [];
    for (let move = 0; move < 4; move++) {
      const boardCopy = this.copyBoard();
      let newBoard;
      if (move === 0) newBoard = this.moveUp(boardCopy)[0];
      else if (move === 1) newBoard = this.moveDown(boardCopy)[0];
      else if (move === 2) newBoard = this.moveLeft(boardCopy)[0];
      else if (move === 3) newBoard = this.moveRight(boardCopy)[0];
      if (!this.boardsEqual(newBoard, boardCopy)) legal.push(move);
    }
    return legal;
  }

  addTile() {
    const emptyCells = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) emptyCells.push([i, j]);
      }
    }
    if (emptyCells.length === 0) return;
    const [i, j] = randomChoice(emptyCells);
    this.board[i][j] = Math.random() < 0.9 ? 1 : 2;
  }

  mergeLine(line) {
    const nonZero = line.filter(num => num !== 0);
    const merged = [];
    let score = 0;
    let skip = false;
    for (let i = 0; i < nonZero.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        let newValue = nonZero[i] < 12 ? nonZero[i] + 1 : 12;
        merged.push(newValue);
        score += Math.pow(2, newValue);
        skip = true;
      } else {
        merged.push(nonZero[i]);
      }
    }
    while (merged.length < line.length) merged.push(0);
    return { line: merged, score };
  }

  moveLeft(board) {
    let totalScore = 0;
    const newBoard = board.map(row => {
      const { line, score } = this.mergeLine(row);
      totalScore += score;
      return line;
    });
    return [newBoard, totalScore];
  }

  moveRight(board) {
    const reversed = board.map(row => row.slice().reverse());
    const [movedBoard, score] = this.moveLeft(reversed);
    const newBoard = movedBoard.map(row => row.slice().reverse());
    return [newBoard, score];
  }

  transpose(board) {
    return board[0].map((_, i) => board.map(row => row[i]));
  }

  moveUp(board) {
    const transposed = this.transpose(board);
    const [moved, score] = this.moveLeft(transposed);
    const newBoard = this.transpose(moved);
    return [newBoard, score];
  }

  moveDown(board) {
    const transposed = this.transpose(board);
    const [moved, score] = this.moveRight(transposed);
    const newBoard = this.transpose(moved);
    return [newBoard, score];
  }

  checkGameOver() {
    if (this.board.flat().includes(0)) return false;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size - 1; j++) {
        if (this.board[i][j] === this.board[i][j + 1]) return false;
      }
    }
    for (let j = 0; j < this.size; j++) {
      for (let i = 0; i < this.size - 1; i++) {
        if (this.board[i][j] === this.board[i + 1][j]) return false;
      }
    }
    return true;
  }

  // Uses the ONNX model to choose an action.
  async aiMove(session) {
    if (!session) {
      console.error("Model session not loaded yet.");
      return;
    }
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) return;
    const inputData = new Float32Array(this.size * this.size);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        inputData[i * this.size + j] = this.board[i][j];
      }
    }
    const tensor = new ort.Tensor("float32", inputData, [1, this.size * this.size]);
    const feeds = { input: tensor };
    console.log("Sending tensor with shape [1, 16]:", tensor.dims, tensor.data);
    
    try {
      const results = await session.run(feeds);
      console.log("Model returned results:", results);
      const logitsTensor = results.action_logits;
      if (!logitsTensor || !logitsTensor.cpuData) {
        throw new Error("Invalid model output structure: " + JSON.stringify(results));
      }
      const logits = Array.from(logitsTensor.cpuData);
      console.log("Extracted logits:", logits);
      let chosenAction = logits.indexOf(Math.max(...logits));
      if (!legalMoves.includes(chosenAction)) {
        console.log("Chosen action not legal, selecting random legal move.");
        chosenAction = randomChoice(legalMoves);
      }
      console.log("Chosen action:", chosenAction);
      this.step(chosenAction);
    } catch (err) {
      console.error("Error during model inference:", err);
      const chosenAction = randomChoice(legalMoves);
      this.step(chosenAction);
    }
  }
}

export default function Game2048App({ repos }) {
  // Default move delay is 200ms; slider range is 20–700ms.
  const [gameState, setGameState] = useState({ board: [], score: 0, done: false, lastAction: null });
  const [moveDelay, setMoveDelay] = useState(200);
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(true);
  const gameRef = useRef(null);
  const sessionRef = useRef(null);
  const intervalRef = useRef(null);
  // Store previous board state for per-cell animation.
  const prevBoardRef = useRef([]);

  // Wrap the game state update callback in useCallback so it’s stable.
  const handleGameState = useCallback((newState) => {
    setGameState((prev) => {
      // Save the previous board state for animations.
      prevBoardRef.current = prev.board || [];
      return newState;
    });
  }, []);
  

  // Load the ONNX model.
  useEffect(() => {
    (async () => {
      try {
        sessionRef.current = await ort.InferenceSession.create('/models/ppo_2048_model_huge_mlp.onnx');
        console.log("Model loaded successfully.");
      } catch (err) {
        console.error("Failed to load model:", err);
      }
    })();
  }, []);

  // Initialize game logic.
  useEffect(() => {
    gameRef.current = new Game2048(handleGameState);
    gameRef.current.reset();
  }, [handleGameState]);

  // Auto AI move using the current delay.
  useEffect(() => {
    if (!autoMoveEnabled) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (gameRef.current && sessionRef.current && !gameState.done) {
        gameRef.current.aiMove(sessionRef.current);
      }
    }, moveDelay);
    return () => clearInterval(intervalRef.current);
  }, [moveDelay, autoMoveEnabled, gameState.done]);

  const handleReset = () => {
    if (gameRef.current) {
      gameRef.current.reset();
    }
  };
  
  const toggleAutoMove = () => {
    setAutoMoveEnabled((prev) => !prev);
  };

  // Compare previous and current board states for per-cell animation.
  const cellMoved = (i, j) => {
    if (!prevBoardRef.current || !prevBoardRef.current[i] || !gameState.board[i]) return false;
    return prevBoardRef.current[i][j] !== gameState.board[i][j];
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <NavBar repos={repos} links={navLinks} />
      <div style={{ paddingTop: '80px', padding: '20px' }}>
        <h1>2048 AI Game</h1>
        <div id="score" style={{ fontSize: '20px', marginBottom: '10px' }}>
          Score: {gameState.score}
        </div>
        {/* Grid container positioned relatively to enable arrow overlay. */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            id="grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 100px)',
              gridGap: '10px',
              background: '#bbada0',
              padding: '10px',
              borderRadius: '5px',
              width: 'max-content'
            }}
          >
            {gameState.board.map((row, i) =>
              row.map((cell, j) => {
                const animate = cellMoved(i, j);
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`tile ${animate ? "anim-move" : ""}`}
                    data-direction={gameState.lastAction}
                    style={{
                      width: '100px',
                      height: '100px',
                      lineHeight: '100px',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderRadius: '5px',
                      background: getTileColor(cell),
                      color: '#776e65',
                      transition: 'background 0.2s'
                    }}
                  >
                    {cell > 0 ? Math.pow(2, cell) : ''}
                  </div>
                );
              })
            )}
          </div>
          {/* Arrow overlay: positioned so its vertical center is at the gap between the 2nd and 3rd rows. */}
          {gameState.lastAction !== null ? (
            <div className="arrow-overlay">
              {getArrowSymbol(gameState.lastAction)}
            </div>
          ) : null}
        </div>
        <div id="controls" style={{ marginTop: '10px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              margin: '0 5px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '3px',
              background: '#8f7a66',
              color: 'white',
              transition: 'background 0.2s'
            }}
          >
            Reset
          </button>
          <button
            onClick={toggleAutoMove}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              margin: '0 5px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '3px',
              background: autoMoveEnabled ? '#d9534f' : '#5cb85c',
              color: 'white',
              transition: 'background 0.2s'
            }}
          >
            {autoMoveEnabled ? 'Stop Auto Move' : 'Start Auto Move'}
          </button>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="moveDelay">Move Delay (ms): </label>
          <input
            id="moveDelay"
            type="range"
            min="20"
            max="700"
            value={moveDelay}
            onChange={(e) => setMoveDelay(Number(e.target.value))}
            style={{ verticalAlign: 'middle' }}
          />
          <span style={{ marginLeft: '10px' }}>{moveDelay} ms</span>
        </div>
        <style jsx>{`
        .tile.anim-move[data-direction="0"] {
            animation: tileSlideUp 0.3s ease-out forwards;
        }
        .tile.anim-move[data-direction="1"] {
            animation: tileSlideDown 0.3s ease-out forwards;
        }
        .tile.anim-move[data-direction="2"] {
            animation: tileSlideLeft 0.3s ease-out forwards;
        }
        .tile.anim-move[data-direction="3"] {
            animation: tileSlideRight 0.3s ease-out forwards;
        }
        @keyframes tileSlideUp {
            from { transform: translateY(10px); }
            to { transform: translateY(0); }
        }
        @keyframes tileSlideDown {
            from { transform: translateY(-10px); }
            to { transform: translateY(0); }
        }
        @keyframes tileSlideLeft {
            from { transform: translateX(10px); }
            to { transform: translateX(0); }
        }
        @keyframes tileSlideRight {
            from { transform: translateX(-10px); }
            to { transform: translateX(0); }
        }
        .arrow-overlay {
            position: absolute;
            top: 218px;
            left: 0;
            right: 0;
            pointer-events: none;
            text-align: center;
            font-size: 80px;
            color: rgba(0, 0, 255, 0.3);
            transform: translateY(-50%);
        }
        `}</style>

      </div>
    </div>
  );
}
