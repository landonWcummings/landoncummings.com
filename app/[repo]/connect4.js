// src/app/[repo]/Connect4WithBot.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '../../components/NavBar';
import * as ort from 'onnxruntime-web';

const ROWS = 6;
const COLS = 7;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Copy the board
const copyBoard = board => board.map(row => [...row]);

// Drop a piece
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

// Valid moves
const getValidMoves = board =>
  Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === 0);

// Win check
const checkWin = (board, player) => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r].slice(c, c + 4).every(v => v === player)) return true;
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      if ([0,1,2,3].every(i => board[r+i][c] === player)) return true;
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r+i][c+i] === player)) return true;
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r-i][c+i] === player)) return true;
    }
  }
  return false;
};

// Flatten to [1×126]
const boardToObservation = board => {
  const obs = new Float32Array(ROWS * COLS * 3);
  let idx = 0;
  for (let ch = 0; ch < 3; ch++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = board[r][c];
        obs[idx++] = ch === 0
          ? (v === 1 ? 1 : 0)
          : ch === 1
            ? (v === -1 ? 1 : 0)
            : (v === 0 ? 1 : 0);
      }
    }
  }
  return obs;
};

export default function Connect4WithBot({ repos }) {
  const sessionRef = useRef(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [board, setBoard] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState(1);  // bot first
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Load model
  useEffect(() => {
    (async () => {
      try {
        sessionRef.current = await ort.InferenceSession.create('/models/ppo_connect4.onnx');
        console.log('✅ Model loaded.');
        setModelLoaded(true);
      } catch (e) {
        console.error('❌ Model error:', e);
      }
    })();
  }, []);

  // Run bot
  const runAgentMove = useCallback(async cur => {
    const sess = sessionRef.current;
    if (!sess) return console.warn('⚠️ Session not ready');
    const obs = boardToObservation(cur);
    const input = new ort.Tensor('float32', obs, [1, obs.length]);
    let out;
    try {
      out = await sess.run({ [sess.inputNames[0]]: input });
    } catch (e) {
      return console.error('❌ Infer error', e);
    }
    let act = Number(out[sess.outputNames[0]].data[0]);
    const valid = getValidMoves(cur);
    if (!valid.includes(act)) act = valid[Math.floor(Math.random() * valid.length)];
    console.log('🎯 Bot plays', act);
    const next = dropPiece(cur, act, 1);
    setBoard(next);
    if (checkWin(next, 1)) return setWinnerAndEnd('Bot');
    if (getValidMoves(next).length === 0) return setWinnerAndEnd('Draw');
    setCurrentPlayer(-1);
  }, []);

  // Bot’s turn
  useEffect(() => {
    if (modelLoaded && currentPlayer === 1 && !gameOver) {
      console.log('🤖 Bot thinking…');
      runAgentMove(board);
    }
  }, [modelLoaded, currentPlayer, board, gameOver, runAgentMove]);

  // Set winner and end
  const setWinnerAndEnd = who => {
    console.log(who, 'wins!');
    setWinner(who);
    setGameOver(true);
  };

  // Reset
  const resetGame = () => {
    console.log('🔄 Reset');
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
  };

  // Human click
  const handleHumanMove = col => {
    if (gameOver || currentPlayer !== -1) return;
    if (board[0][col] !== 0) return;
    console.log('🖱️ Human plays', col);
    const next = dropPiece(board, col, -1);
    setBoard(next);
    if (checkWin(next, -1)) return setWinnerAndEnd('You');
    if (getValidMoves(next).length === 0) return setWinnerAndEnd('Draw');
    setCurrentPlayer(1);
  };

  return (
    <div style={{ maxWidth: 540, margin: 'auto', fontFamily: 'sans-serif' }}>
      <NavBar repos={repos} links={navLinks} />
      <h2 style={{ textAlign: 'center', margin: '16px 0' }}>Connect 4 vs PPO Bot</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 8,
        background: '#004aad',
        padding: 8,
        borderRadius: 12
      }}>
        {Array.from({ length: COLS }, (_, c) => (
          <div
            key={c}
            onClick={() => handleHumanMove(c)}
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              gap: 8,
              cursor: gameOver ? 'not-allowed' : 'pointer'
            }}
          >
            {board.map((row, r) => {
              const cell = row[c];
              return (
                <div key={r} style={{ position: 'relative', paddingTop: '100%' }}>
                  {cell === 0 && !gameOver && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)'
                    }}/>
                  )}
                  {cell !== 0 && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: '50%',
                      background: cell === 1 ? '#ff4d4d' : '#ffd700',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}/>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <h3>{winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}</h3>
          <button onClick={resetGame}
            style={{
              padding: '10px 20px', fontSize: 16, borderRadius: 8,
              border: 'none', background: '#28a745', color: 'white',
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
