/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import NavBar from '../../components/NavBar';
import Image from 'next/image';
import { Game } from './snakegame'; // adjust path if necessary

export default function SnakePlusAI({ repos }) {
  // Refs for compete mode
  const userCanvasRef = useRef(null);
  const aiCanvasRef = useRef(null);
  const userGameRef = useRef(null);
  const aiGameRef = useRef(null);
  // Ref for demo mode
  const demoCanvasRef = useRef(null);
  const demoGameRef = useRef(null);

  // Refs to store pending timeouts so they can be cleared.
  const popupTimeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const [mode, setMode] = useState("compete"); // "compete" or "demo"
  const [gridSize, setGridSize] = useState(4);
  const [speed, setSpeed] = useState(200);
  const [tempSpeed, setTempSpeed] = useState(200);
  const [gamesStarted, setGamesStarted] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState(null);
  const [inputEnabled, setInputEnabled] = useState(true);

  // States for bottom section (graph & commentary)
  const [isGameReady, setIsGameReady] = useState(false);
  const commentary = useMemo(() => ({
    4: "Trained in roughly 5 hours. Model is pretty solid overall. Still some rough edges, could be perfected in more training time.",
    5: "Trained in roughly 18 and a half hours. Much harder to perfect a 5x5 grid due to the odd nature. A 5x5 board has an odd number of total cells making it impossible to execute one sustainable pattern as seen in the endgame of the 4x4. Given further training the model could likely perfect a 5x5",
    6: "Trained in roughly 76 hours. For 4x4 and 5x5 the input is the entire grid. For the 6x6, 4 inputs were added in addition to the grid. Four new boolean inputs depict whether or not the model will die if it moves in each of the four directions. This helps the model converge much faster. I had trained a model over 3.5 days without this addition and it was ineffective.",
  }), []);

  // ----------------- Initialization Functions -----------------
  // Initialize the user game (compete mode).
  const initUserGame = useCallback(() => {
    if (!userCanvasRef.current) {
      setTimeout(initUserGame, 50);
      return;
    }
    if (userGameRef.current) userGameRef.current.stop();
    const canvas = userCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameInstance = new Game(canvas, ctx, gridSize, false, handleGameEnd);
    gameInstance.msbetweenframes = speed;
    gameInstance.reset();
    gameInstance.draw();
    userGameRef.current = gameInstance;
    console.log('[Main] User game initialized.');
  }, [gridSize, speed]);

  // Initialize the AI game (compete mode).
  const initAIGame = useCallback(async () => {
    if (!aiCanvasRef.current) {
      setTimeout(() => { initAIGame(); }, 50);
      return;
    }
    if (aiGameRef.current) aiGameRef.current.stop();
    const canvas = aiCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameInstance = new Game(canvas, ctx, gridSize, true, handleGameEnd);
    gameInstance.msbetweenframes = speed;
    await gameInstance.loadModel(gridSize);
    gameInstance.reset();
    gameInstance.draw();
    aiGameRef.current = gameInstance;
    console.log('[Main] AI game initialized.');
  }, [gridSize, speed]);

  // Initialize the demo game (demo mode).
  const initDemoGame = useCallback(async () => {
    if (!demoCanvasRef.current) {
      console.warn("Demo canvas not mounted yet. Retrying in 50ms...");
      setTimeout(() => { initDemoGame(); }, 50);
      return;
    }
    if (demoGameRef.current) demoGameRef.current.stop();
    const canvas = demoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameInstance = new Game(canvas, ctx, gridSize, true, handleGameEnd);
    gameInstance.msbetweenframes = speed;
    await gameInstance.loadModel(gridSize);
    gameInstance.reset();
    gameInstance.draw();
    demoGameRef.current = gameInstance;
    console.log('[Main] Demo game initialized.');
  }, [gridSize, speed]);

  // ----------------- Game End Handler -----------------
  const handleGameEnd = useCallback((msg) => {
    if (mode === "compete") {
      if (userGameRef.current) userGameRef.current.stop();
      if (aiGameRef.current) aiGameRef.current.stop();
    } else if (mode === "demo") {
      if (demoGameRef.current) demoGameRef.current.stop();
    }
    setGamesStarted(false);
    console.log('[Main] Game ended. Winner message:', msg);

    // Clear any pending timeouts.
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (mode === "demo") {
      // In demo mode, immediately restart the demo without overlay.
      initDemoGame().then(() => {
        if (demoGameRef.current && !demoGameRef.current.gameActive) {
          demoGameRef.current.start();
          setGamesStarted(true);
        }
      });
    } else {
      if (msg === "AI wins!" || msg === "AI wins") {
        setWinnerMessage("AI wins");
        setInputEnabled(false);
        popupTimeoutRef.current = setTimeout(() => {
          setWinnerMessage("");
        }, 1500);
        restartTimeoutRef.current = setTimeout(() => {
          initUserGame();
          initAIGame();
          setWinnerMessage("Press WASD or arrows to restart");
          setInputEnabled(true);
        }, 1800);
      } else {
        restartTimeoutRef.current = setTimeout(() => {
          initUserGame();
          initAIGame();
          setWinnerMessage("Press WASD or arrows to restart");
        }, 1300);
      }
    }
  }, [mode, initUserGame, initAIGame, initDemoGame]);

  // ----------------- Reinitialize on Grid Size or Mode Change -----------------
  useEffect(() => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    setGamesStarted(false);
    setWinnerMessage(null);
    setInputEnabled(true);
    setIsGameReady(false);
    if (mode === "compete") {
      initUserGame();
      (async () => {
        await initAIGame();
        setIsGameReady(true);
      })();
    } else if (mode === "demo") {
      setTimeout(async () => {
        await initDemoGame();
        setIsGameReady(true);
        if (demoGameRef.current && !demoGameRef.current.gameActive) {
          demoGameRef.current.start();
          setGamesStarted(true);
        }
      }, 50);
    }
    return () => {
      if (userGameRef.current) userGameRef.current.stop();
      if (aiGameRef.current) aiGameRef.current.stop();
      if (demoGameRef.current) demoGameRef.current.stop();
    };
  }, [gridSize, mode, initUserGame, initAIGame, initDemoGame]);

  // ----------------- Start Games (Compete Mode) -----------------
  const startGames = useCallback(() => {
    if (mode === "compete") {
      if (userGameRef.current && !userGameRef.current.gameActive) {
        userGameRef.current.start();
      }
      if (aiGameRef.current && !aiGameRef.current.gameActive) {
        aiGameRef.current.start();
      }
      setGamesStarted(true);
      setWinnerMessage(null);
      console.log('[Main] Games started.');
    }
  }, [mode]);

  // ----------------- Keyboard Handling (Compete Mode Only) -----------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!inputEnabled || mode !== "compete") return;
      if (winnerMessage) {
        setWinnerMessage(null);
        startGames();
        return;
      }
      if (!gamesStarted) {
        startGames();
      }
      const key = e.key.toLowerCase();
      let dir;
      if (key === 'arrowup' || key === 'w') {
        dir = 12;
      } else if (key === 'arrowright' || key === 'd') {
        dir = 3;
      } else if (key === 'arrowdown' || key === 's') {
        dir = 6;
      } else if (key === 'arrowleft' || key === 'a') {
        dir = 9;
      }
      if (dir && userGameRef.current) {
        userGameRef.current.player.updatedir(dir);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamesStarted, startGames, winnerMessage, inputEnabled, mode]);

  const handleSliderChange = (e) => {
    setTempSpeed(Number(e.target.value));
  };

  const handleSliderChangeDone = () => {
    setSpeed(tempSpeed);
  };

  // ----------------- Grid Size and Mode Change Handlers -----------------
  const handleGridSizeChange = (size) => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    setInputEnabled(true);
    setGridSize(size);
    setWinnerMessage(null);
    setGamesStarted(false);
    if (mode === "compete") {
      initUserGame();
      initAIGame();
    } else if (mode === "demo") {
      initDemoGame();
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    // If changing from demo to compete, reload the page.
    if (mode === "demo" && newMode === "compete") {
      window.location.reload();
      return;
    }
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    setInputEnabled(true);
    setMode(newMode);
    setWinnerMessage(null);
    setGamesStarted(false);
    if (newMode === "compete") {
      initUserGame();
      initAIGame();
    } else if (newMode === "demo") {
      initDemoGame();
    }
  };

  const containerStyle = {
    position: 'relative',
    display: 'inline-block'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '500px',
    height: '600px',
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '20px',
    transition: 'opacity 0.5s ease'
  };

  // ----------------- Disable Arrow Keys Scrolling -----------------
  useEffect(() => {
    const preventScroll = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", preventScroll, { passive: false });
    return () => window.removeEventListener("keydown", preventScroll);
  }, []);

  return (
    <>
      <NavBar repos={repos} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
        <p>Snake Game: {mode === "compete" ? "User vs AI" : "Demo Mode (AI only)"} </p>
        {mode === "compete" ? (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={containerStyle}>
              <canvas
                ref={userCanvasRef}
                width={500}
                height={600}
                style={{ border: '1px solid black', display: 'block' }}
              ></canvas>
              {!gamesStarted && !winnerMessage && (
                <div style={overlayStyle}>
                  Press WASD or arrows to start game
                </div>
              )}
              {winnerMessage && (
                <div style={overlayStyle}>
                  {winnerMessage}
                </div>
              )}
            </div>
            <div style={containerStyle}>
              <canvas
                ref={aiCanvasRef}
                width={500}
                height={600}
                style={{ border: '1px solid black', display: 'block' }}
              ></canvas>
              {!gamesStarted && !winnerMessage && (
                <div style={overlayStyle}>
                  Press WASD or arrows to start game
                </div>
              )}
              {winnerMessage && (
                <div style={overlayStyle}>
                  {winnerMessage}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Demo mode: single canvas centered.
          <div style={containerStyle}>
            <canvas
              ref={demoCanvasRef}
              width={500}
              height={600}
              style={{ border: '1px solid black', display: 'block' }}
            ></canvas>
            {!gamesStarted && !winnerMessage && (
              <div style={overlayStyle}>
                AI demo running...
              </div>
            )}
            {winnerMessage && (
              <div style={overlayStyle}>
                {winnerMessage}
              </div>
            )}
          </div>
        )}
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
        {/* New Mode Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button
            onClick={() => handleModeChange("compete")}
            style={{
              padding: '10px 20px',
              border: '2px solid #000',
              borderRadius: '5px',
              backgroundColor: mode === "compete" ? '#4CAF50' : '#FFF',
              color: mode === "compete" ? '#FFF' : '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
              outline: mode === "compete" ? '2px solid #4CAF50' : 'none',
            }}
          >
            Compete
          </button>
          <button
            onClick={() => handleModeChange("demo")}
            style={{
              padding: '10px 20px',
              border: '2px solid #000',
              borderRadius: '5px',
              backgroundColor: mode === "demo" ? '#4CAF50' : '#FFF',
              color: mode === "demo" ? '#FFF' : '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
              outline: mode === "demo" ? '2px solid #4CAF50' : 'none',
            }}
          >
            Demo
          </button>
        </div>
        {/* Bottom section from outdated code */}
        {isGameReady && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
            <Image
              src={`/models/ppo${gridSize}graph.png`}
              alt={`Graph for PPO model with grid size ${gridSize}`}
              width={500}
              height={300}
              style={{ marginTop: '10px', maxWidth: '100%', height: 'auto' }}
            />
            <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#a12aff' }}>
              {commentary[gridSize]}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
