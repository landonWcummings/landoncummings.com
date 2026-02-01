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
  const difficultyRef = useRef('medium'); // Track current difficulty to avoid closure issues
  const [winrates, setWinrates] = useState({
    easy: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
    medium: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
    hard: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
  });
  const [winratesLoading, setWinratesLoading] = useState(true);
  const lastSaveTimeRef = useRef(0); // Track last save time for rate limiting (60 seconds)
  
  // Keep difficultyRef in sync with difficulty state
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // ─── Load ONNX model once ────────────────────────────────────────────────────
  useEffect(() => {
    // Configure ONNX Runtime logging to suppress warnings
    // Set log level to error only (suppresses warnings)
    if (ort.env && ort.env.logLevel !== undefined) {
      ort.env.logLevel = 'error'; // Only show errors, suppress warnings
    }

    // Also filter console output as a backup
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Filter out ONNX CPU vendor warnings
    const filterONNXWarnings = (...args) => {
      const message = args[0];
      if (message && typeof message === 'string') {
        // Suppress ONNX CPU vendor warnings and other harmless ONNX warnings
        if (message.includes('onnxruntime') || 
            message.includes('Unknown CPU vendor') ||
            message.includes('cpuid_info') ||
            message.includes('[W:onnxruntime')) {
          return; // Suppress these warnings
        }
      }
      // Also check for ANSI color codes that ONNX uses
      const fullMessage = args.join(' ');
      if (fullMessage.includes('onnxruntime') && fullMessage.includes('cpuid_info')) {
        return; // Suppress
      }
      originalWarn.apply(console, args);
    };
    
    console.warn = filterONNXWarnings;

    (async () => {
      try {
        // Try to create session with minimal logging options
        // Note: Some ONNX versions may not support these options
        const sessionOptions = {};
        try {
          // Try setting log severity if supported
          if (ort.env && typeof ort.env.logLevel !== 'undefined') {
            ort.env.logLevel = 'error';
          }
        } catch (e) {
          // Ignore if not supported
        }

        sessionRef.current = await ort.InferenceSession.create(MODEL_PATH, sessionOptions);
        console.log('✅ Model loaded from', MODEL_PATH);
        setModelLoaded(true);
      } catch (e) {
        console.error('❌ Failed to load ONNX model:', e);
        // Model failed to load, but game can still work with easy/medium difficulty
      } finally {
        // Restore original console methods after a delay to allow ONNX to finish loading
        setTimeout(() => {
          console.warn = originalWarn;
          console.error = originalError;
        }, 2000); // Increased delay to catch all ONNX initialization messages
      }
    })();
  }, []);

  // ─── Fetch winrates on component mount ────────────────────────────────────────
  useEffect(() => {
    const fetchWinrates = async () => {
      try {
        const response = await fetch('/api/connect4/winrates');
        if (response.ok) {
          const data = await response.json();
          if (data.winrates) {
            setWinrates(data.winrates);
          }
        } else {
          console.error('Failed to fetch winrates');
        }
      } catch (error) {
        console.error('Error fetching winrates:', error);
      } finally {
        setWinratesLoading(false);
      }
    };
    fetchWinrates();
  }, []);

  // ─── Update winrates locally ────────────────────────────────────────────────
  const updateWinratesLocally = (gameWinner) => {
    // Convert "You" to "human" for consistency
    const normalizedWinner = gameWinner === 'You' ? 'human' : gameWinner.toLowerCase();
    // Use ref to get current difficulty (avoids closure issues)
    const currentDifficulty = difficultyRef.current;
    
    setWinrates((prev) => {
      const newWinrates = { ...prev };
      // Ensure stats object exists and has all required properties
      const stats = {
        total: newWinrates[currentDifficulty]?.total || 0,
        userWins: newWinrates[currentDifficulty]?.userWins || 0,
        botWins: newWinrates[currentDifficulty]?.botWins || 0,
        draws: newWinrates[currentDifficulty]?.draws || 0,
        userWinRate: newWinrates[currentDifficulty]?.userWinRate || 0,
      };
      
      stats.total = (stats.total || 0) + 1;
      if (normalizedWinner === 'human') {
        stats.userWins = (stats.userWins || 0) + 1;
      } else if (normalizedWinner === 'bot') {
        stats.botWins = (stats.botWins || 0) + 1;
      } else if (normalizedWinner === 'draw') {
        stats.draws = (stats.draws || 0) + 1;
      }
      
      // Recalculate win rate (excluding draws)
      // Ensure no division by zero, NaN, or invalid values
      const nonDrawGames = Math.max(0, (stats.total || 0) - (stats.draws || 0));
      const userWins = stats.userWins || 0;
      stats.userWinRate = nonDrawGames > 0 && !isNaN(nonDrawGames) && !isNaN(userWins) && isFinite(userWins)
        ? Math.max(0, Math.min(100, (userWins / nonDrawGames) * 100))
        : 0;
      
      newWinrates[currentDifficulty] = stats;
      return newWinrates;
    });
  };

  // ─── Save game result to database ───────────────────────────────────────────
  const saveGameResult = async (gameWinner) => {
    // Rate limiting: Only allow 1 save per 60 seconds
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    // Use ref to get current difficulty (avoids closure issues)
    const currentDifficulty = difficultyRef.current;
    
    if (timeSinceLastSave < 60000) {
      console.log('Rate limited: Please wait before saving another game result');
      // Still update locally even if we can't save to DB
      updateWinratesLocally(gameWinner);
      return;
    }

    // Convert "You" to "human" for API
    const normalizedWinner = gameWinner === 'You' ? 'human' : gameWinner.toLowerCase();
    
    try {
      const response = await fetch('/api/connect4/game-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: currentDifficulty,
          winner: normalizedWinner,
        }),
      });

      if (response.ok) {
        lastSaveTimeRef.current = now;
        // Update locally (don't re-fetch from database)
        updateWinratesLocally(gameWinner);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          console.log('Rate limit exceeded:', errorData.error || 'Too many requests');
        } else {
          console.error('Failed to save game result:', errorData.error || 'Unknown error');
        }
        // Still update locally even if save failed
        updateWinratesLocally(gameWinner);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
      // Still update locally even if save failed
      updateWinratesLocally(gameWinner);
    }
  };

  // ─── Helper to declare winner, store sequence, and end game ──────────────────
  const setWinnerAndEnd = (who, sequence) => {
    console.log(who, 'wins!');
    setWinner(who);
    setWinningPositions(sequence);
    setGameOver(true);
    // Save game result to database
    saveGameResult(who);
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

      {/* Winrates Display */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333', fontSize: '1.3rem' }}>
          📊 Global Human Win Rate
        </h3>
        {winratesLoading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Loading statistics...</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px' 
          }}>
            {['easy', 'medium', 'hard'].map((level) => {
              const stats = winrates[level] || { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 };
              const winRate = (stats.userWinRate || 0).toFixed(1);
              return (
                <div
                  key={level}
                  style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: '8px',
                    textTransform: 'capitalize'
                  }}>
                    {level}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#667eea', marginBottom: '5px' }}>
                    {winRate}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {stats.userWins || 0}W / {stats.botWins || 0}L / {stats.draws || 0}D
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                    {stats.total || 0} games
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
