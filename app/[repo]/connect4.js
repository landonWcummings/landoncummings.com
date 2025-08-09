// File: src/app/[repo]/Connect4WithBot.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '../../components/NavBar';
import * as ort from 'onnxruntime-web';

const ROWS = 6;
const COLS = 7;
const MODEL_PATH = '/models/ppo_connect4.onnx';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Deep‐copy the board array
const copyBoard = (board) => board.map((row) => [...row]);

// Drop a piece for `player` (1 = bot, -1 = human) into column `col`
const dropPiece = (board, col, player) => {
  const b = copyBoard(board);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][col] === 0) {
      b[r][col] = player;
      break;
    }
  }
  return b;
};

// Return all columns [0..6] whose top cell is empty
const getValidMoves = (board) =>
  Array.from({ length: COLS }, (_, c) => c).filter((c) => board[0][c] === 0);

// Return positions of a winning sequence for `player`, or null if none
const findWinningSequence = (board, player) => {
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const seq = [
        [r, c],
        [r, c + 1],
        [r, c + 2],
        [r, c + 3],
      ];
      if (seq.every(([rr, cc]) => board[rr][cc] === player)) return seq;
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const seq = [
        [r, c],
        [r + 1, c],
        [r + 2, c],
        [r + 3, c],
      ];
      if (seq.every(([rr, cc]) => board[rr][cc] === player)) return seq;
    }
  }
  // diagonal down‐right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const seq = [
        [r, c],
        [r + 1, c + 1],
        [r + 2, c + 2],
        [r + 3, c + 3],
      ];
      if (seq.every(([rr, cc]) => board[rr][cc] === player)) return seq;
    }
  }
  // diagonal up‐right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const seq = [
        [r, c],
        [r - 1, c + 1],
        [r - 2, c + 2],
        [r - 3, c + 3],
      ];
      if (seq.every(([rr, cc]) => board[rr][cc] === player)) return seq;
    }
  }
  return null;
};

// Convert board to Float32Array [1 × (ROWS*COLS*3)]
const boardToObservation = (board) => {
  const obs = new Float32Array(ROWS * COLS * 3);
  let idx = 0;
  for (let ch = 0; ch < 3; ch++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = board[r][c];
        obs[idx++] =
          ch === 0
            ? v === 1
              ? 1
              : 0
            : ch === 1
            ? v === -1
              ? 1
              : 0
            : v === 0
            ? 1
            : 0;
      }
    }
  }
  return obs;
};

export default function Connect4WithBot({ repos }) {
  const sessionRef = useRef(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [board, setBoard] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 = bot starts first
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningPositions, setWinningPositions] = useState(null);
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'

  // ─── Load ONNX model once ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        sessionRef.current = await ort.InferenceSession.create(MODEL_PATH);
        console.log('✅ Model loaded from', MODEL_PATH);
        setModelLoaded(true);
      } catch (e) {
        console.error('❌ Failed to load ONNX model:', e);
      }
    })();
  }, []);

  // ─── Helper to declare winner, store sequence, and end game ──────────────────
  const setWinnerAndEnd = (who, sequence) => {
    console.log(who, 'wins!');
    setWinner(who);
    setWinningPositions(sequence);
    setGameOver(true);
  };

  // ─── AI: Easy moves ─────────────────────────────────────────────────────────
  // Easy: win if possible; else random
  const runEasyMove = useCallback(
    (curBoard) => {
      const valid = getValidMoves(curBoard);
      // 1) Try winning move
      for (const col of valid) {
        const test = dropPiece(curBoard, col, 1);
        const seq = findWinningSequence(test, 1);
        if (seq) {
          setBoard(test);
          setWinnerAndEnd('Bot', seq);
          return;
        }
      }
      // 2) Else random
      const randCol = valid[Math.floor(Math.random() * valid.length)];
      const next = dropPiece(curBoard, randCol, 1);
      setBoard(next);
      const seq = findWinningSequence(next, 1);
      if (seq) {
        setWinnerAndEnd('Bot', seq);
      } else if (getValidMoves(next).length === 0) {
        setWinnerAndEnd('Draw', null);
      } else {
        setCurrentPlayer(-1);
      }
    },
    []
  );

  // ─── AI: Medium moves ───────────────────────────────────────────────────────
  // Medium: win if possible; block opponent's win; else random
  const runMediumMove = useCallback(
    (curBoard) => {
      const valid = getValidMoves(curBoard);
      // 1) Try winning move
      for (const col of valid) {
        const test = dropPiece(curBoard, col, 1);
        const seq = findWinningSequence(test, 1);
        if (seq) {
          setBoard(test);
          setWinnerAndEnd('Bot', seq);
          return;
        }
      }
      // 2) Try block opponent's winning move
      for (const col of valid) {
        const testOpp = dropPiece(curBoard, col, -1);
        if (findWinningSequence(testOpp, -1)) {
          const next = dropPiece(curBoard, col, 1);
          const seq = findWinningSequence(next, 1);
          setBoard(next);
          if (seq) {
            setWinnerAndEnd('Bot', seq);
          } else if (getValidMoves(next).length === 0) {
            setWinnerAndEnd('Draw', null);
          } else {
            setCurrentPlayer(-1);
          }
          return;
        }
      }
      // 3) Else random
      const randCol = valid[Math.floor(Math.random() * valid.length)];
      const next = dropPiece(curBoard, randCol, 1);
      setBoard(next);
      const seq = findWinningSequence(next, 1);
      if (seq) {
        setWinnerAndEnd('Bot', seq);
      } else if (getValidMoves(next).length === 0) {
        setWinnerAndEnd('Draw', null);
      } else {
        setCurrentPlayer(-1);
      }
    },
    []
  );

  // ─── AI: Hard moves ─────────────────────────────────────────────────────────
  // Hard: win if possible; block opponent's win; else model with safety check; else random
  const runHardMove = useCallback(
    async (curBoard) => {
      const valid = getValidMoves(curBoard);

      // 1) Try winning move
      for (const col of valid) {
        const test = dropPiece(curBoard, col, 1);
        const seq = findWinningSequence(test, 1);
        if (seq) {
          setBoard(test);
          setWinnerAndEnd('Bot', seq);
          return;
        }
      }

      // 2) Try block opponent's winning move
      for (const col of valid) {
        const testOpp = dropPiece(curBoard, col, -1);
        if (findWinningSequence(testOpp, -1)) {
          const next = dropPiece(curBoard, col, 1);
          const seq = findWinningSequence(next, 1);
          setBoard(next);
          if (seq) {
            setWinnerAndEnd('Bot', seq);
          } else if (getValidMoves(next).length === 0) {
            setWinnerAndEnd('Draw', null);
          } else {
            setCurrentPlayer(-1);
          }
          return;
        }
      }

      // 3) Call model
      const sess = sessionRef.current;
      if (!sess) return console.warn('⚠️ Session not ready');
      const obs = boardToObservation(curBoard);
      const inputTensor = new ort.Tensor('float32', obs, [1, obs.length]);
      let out;
      try {
        out = await sess.run({ [sess.inputNames[0]]: inputTensor });
      } catch (e) {
        return console.error('❌ Inference error:', e);
      }
      let act = Number(out[sess.outputNames[0]].data[0]);
      if (!valid.includes(act)) {
        act = valid[Math.floor(Math.random() * valid.length)];
      }

      // 4) Safety check: if model's move allows human to win by placing on top, then random
      const tempBoard = dropPiece(curBoard, act, 1);
      // simulate human drop on same column
      const humanBoard = dropPiece(tempBoard, act, -1);
      if (findWinningSequence(humanBoard, -1)) {
        // choose a different random column
        const altMoves = valid.filter((c) => c !== act);
        if (altMoves.length > 0) {
          const randCol = altMoves[Math.floor(Math.random() * altMoves.length)];
          act = randCol;
        }
      }

      // Finalize bot move
      const nextBoard = dropPiece(curBoard, act, 1);
      setBoard(nextBoard);
      const seq = findWinningSequence(nextBoard, 1);
      if (seq) {
        setWinnerAndEnd('Bot', seq);
      } else if (getValidMoves(nextBoard).length === 0) {
        setWinnerAndEnd('Draw', null);
      } else {
        setCurrentPlayer(-1);
      }
    },
    []
  );

  // ─── Perform bot turn when appropriate ───────────────────────────────────────
  useEffect(() => {
    if (!modelLoaded && difficulty === 'hard') return;
    if (gameOver || currentPlayer !== 1) return;

    if (difficulty === 'easy') {
      runEasyMove(board);
    } else if (difficulty === 'medium') {
      runMediumMove(board);
    } else {
      runHardMove(board);
    }
  }, [modelLoaded, currentPlayer, board, gameOver, difficulty, runEasyMove, runMediumMove, runHardMove]);

  // ─── Human click handler ─────────────────────────────────────────────────────
  const handleHumanMove = (col) => {
    if (gameOver || currentPlayer !== -1) return;
    if (board[0][col] !== 0) return; // column full
    console.log('🖱️ Human plays', col);
    const nextBoard = dropPiece(board, col, -1);
    setBoard(nextBoard);

    const seq = findWinningSequence(nextBoard, -1);
    if (seq) {
      return setWinnerAndEnd('You', seq);
    }
    if (getValidMoves(nextBoard).length === 0) {
      return setWinnerAndEnd('Draw', null);
    }
    setCurrentPlayer(1);
  };

  // ─── Reset entire game state ─────────────────────────────────────────────────
  const resetGame = () => {
    console.log('🔄 Resetting game');
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
    setWinningPositions(null);
  };

  // ─── Button styles for difficulty ────────────────────────────────────────────
  const difficultyStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 16,
      background: '#FFFFFF',         // white background around difficulty
      padding: 8,
      borderRadius: 8,
    },
    button: (level) => ({
      padding: '8px 16px',
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      background:
        level === 'easy'
          ? difficulty === level
            ? '#2f8a2f'
            : '#28a428'
          : level === 'medium'
          ? difficulty === level
            ? '#1f4caf'
            : '#2470e0'
          : difficulty === level
          ? '#8a1f1f'
          : '#c62828',
      boxShadow: difficulty === level ? '0 0 0 3px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
    }),
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', fontFamily: 'sans-serif' }}>
      <NavBar repos={repos} links={navLinks} />
      <h2 style={{ textAlign: 'center', margin: '16px 0', fontSize: '2.5rem', color: '#333' }}>Connect 4 vs Bot</h2>
      
      {/* Description Section */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        color: 'white',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '10px', fontWeight: '500' }}>
          🔴 Challenge our AI in the classic Connect 4 game! 🔵
        </p>
        <p style={{ fontSize: '0.95rem', opacity: '0.9', lineHeight: '1.5' }}>
          You play as <strong>Blue</strong>, the bot plays as <strong>White</strong>. 
          Get four in a row horizontally, vertically, or diagonally to win!
        </p>
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>
            <strong>💡 How to play:</strong> Click on any column to drop your piece. Choose your difficulty below!
          </p>
        </div>
      </div>

      {/* Difficulty selectors */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#555', fontSize: '1.2rem' }}>
          🎯 Choose Your Challenge
        </h3>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
            <strong>Easy:</strong> Random moves • <strong>Medium:</strong> Blocks your wins • <strong>Hard:</strong> Uses trained AI model
          </p>
        </div>
        <div style={difficultyStyles.container}>
          {['easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                resetGame();
              }}
              style={difficultyStyles.button(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Board container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          aspectRatio: '7 / 6',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: 8,
            background: '#FFD700', // gold background
            borderRadius: 12,
            padding: 8,
          }}
        >
          {Array.from({ length: COLS }, (_, c) => (
            <div
              key={c}
              onClick={() => handleHumanMove(c)}
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                gap: 8,
                cursor: gameOver ? 'not-allowed' : 'pointer',
              }}
            >
              {board.map((row, r) => {
                const cell = row[c];
                return (
                  <div key={r} style={{ position: 'relative', paddingTop: '100%' }}>
                    {/* Always show outline for empty slot */}
                    {cell === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.7)',
                        }}
                      />
                    )}
                    {/* Bot piece (white) */}
                    {cell === 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      />
                    )}
                    {/* Human piece (cool blue) */}
                    {cell === -1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: '50%',
                          background: '#1E90FF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Overlay winning line if someone wins */}
        {winningPositions && (
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            viewBox="0 0 7 6"
            preserveAspectRatio="none"
          >
            {(() => {
              const [[r0, c0], , , [r3, c3]] = winningPositions;
              const x1 = c0 + 0.5;
              const y1 = r0 + 0.5;
              const x2 = c3 + 0.5;
              const y2 = r3 + 0.5;
              const lineColor = winner === 'Bot' ? '#1E90FF' : '#FFFFFF';
              return (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={lineColor}
                  strokeWidth="0.15"
                  strokeLinecap="round"
                />
              );
            })()}
          </svg>
        )}
      </div>

      {/* Winner and Restart below the board */}
      {gameOver && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 12 }}>
            {winner === 'Draw' ? "It's a draw!" : winner === 'You' ? 'You win!' : 'Bot wins!'}
          </h3>
          <button
            onClick={resetGame}
            style={{
              padding: '10px 24px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#28a745',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
