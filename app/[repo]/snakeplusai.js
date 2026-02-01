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
  const [isMobile, setIsMobile] = useState(false);

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
  
  // Refs to track initialization state and prevent stacking
  const userInitializingRef = useRef(false);
  const aiInitializingRef = useRef(false);
  const demoInitializingRef = useRef(false);
  
  // Refs to store init functions to avoid circular dependencies
  const initUserGameRef = useRef(null);
  const initAIGameRef = useRef(null);
  const initDemoGameRef = useRef(null);

  const [mode, setMode] = useState("demo"); // "compete" or "demo"
  const [gridSize, setGridSize] = useState(6); // Default 6x6 grid
  const [speed, setSpeed] = useState(50); // Default 50ms for demo mode
  const [tempSpeed, setTempSpeed] = useState(50);
  const [gamesStarted, setGamesStarted] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState(null);
  const [inputEnabled, setInputEnabled] = useState(true);
  
  // Force demo mode on mobile
  useEffect(() => {
    if (isMobile && mode === "compete") {
      setMode("demo");
    }
  }, [isMobile, mode]);

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
    // Prevent multiple concurrent initializations
    if (userInitializingRef.current) {
      console.log('[Main] User game already initializing, skipping...');
      return;
    }
    
    if (!userCanvasRef.current) {
      userInitializingRef.current = true;
      setTimeout(() => {
        userInitializingRef.current = false;
        if (mode === "compete") { // Only retry if still in compete mode
          initUserGame();
        }
      }, 50);
      return;
    }
    
    userInitializingRef.current = true;
    
    // Ensure complete cleanup of previous game
    if (userGameRef.current) {
      userGameRef.current.stop();
      userGameRef.current = null;
    }
    
    try {
      const canvas = userCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const gameInstance = new Game(canvas, ctx, gridSize, false, handleGameEnd);
      gameInstance.msbetweenframes = speed;
      gameInstance.reset();
      gameInstance.draw();
      userGameRef.current = gameInstance;
      console.log('[Main] User game initialized.');
    } finally {
      userInitializingRef.current = false;
    }
  }, [gridSize, speed, mode]);
  
  // Store the function in ref for use in callbacks
  initUserGameRef.current = initUserGame;

  // Initialize the AI game (compete mode).
  const initAIGame = useCallback(async () => {
    // Prevent multiple concurrent initializations
    if (aiInitializingRef.current) {
      console.log('[Main] AI game already initializing, skipping...');
      return;
    }
    
    if (!aiCanvasRef.current) {
      aiInitializingRef.current = true;
      setTimeout(async () => {
        aiInitializingRef.current = false;
        if (mode === "compete" || mode === "demo") { // Retry if still in AI mode
          await initAIGame();
        }
      }, 50);
      return;
    }
    
    aiInitializingRef.current = true;
    
    try {
      // Ensure complete cleanup of previous game
      if (aiGameRef.current) {
        aiGameRef.current.stop();
        aiGameRef.current = null;
      }
      
      const canvas = aiCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const gameInstance = new Game(canvas, ctx, gridSize, true, handleGameEnd);
      gameInstance.msbetweenframes = speed;
      await gameInstance.loadModel(gridSize);
      gameInstance.reset();
      gameInstance.draw();
      aiGameRef.current = gameInstance;
      console.log('[Main] AI game initialized.');
    } finally {
      aiInitializingRef.current = false;
    }
  }, [gridSize, speed, mode]);
  
  // Store the function in ref for use in callbacks
  initAIGameRef.current = initAIGame;

  // Initialize the demo game (demo mode).
  const initDemoGame = useCallback(async () => {
    // Prevent multiple concurrent initializations
    if (demoInitializingRef.current) {
      console.log('[Main] Demo game already initializing, skipping...');
      return;
    }
    
    if (!demoCanvasRef.current) {
      console.warn("Demo canvas not mounted yet. Retrying in 50ms...");
      demoInitializingRef.current = true;
      setTimeout(async () => {
        demoInitializingRef.current = false;
        if (mode === "demo") { // Only retry if still in demo mode
          await initDemoGame();
        }
      }, 50);
      return;
    }
    
    demoInitializingRef.current = true;
    
    try {
      // Ensure complete cleanup of previous game
      if (demoGameRef.current) {
        demoGameRef.current.stop();
        demoGameRef.current = null;
      }
      
      const canvas = demoCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const gameInstance = new Game(canvas, ctx, gridSize, true, handleGameEnd);
      gameInstance.msbetweenframes = speed;
      await gameInstance.loadModel(gridSize);
      gameInstance.reset();
      gameInstance.draw();
      demoGameRef.current = gameInstance;
      console.log('[Main] Demo game initialized.');
    } finally {
      demoInitializingRef.current = false;
    }
  }, [gridSize, speed, mode]);
  
  // Store the function in ref for use in callbacks
  initDemoGameRef.current = initDemoGame;

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
      // In demo mode, pause for 1 second when AI wins before restarting
      const pauseTime = msg && (msg.includes("wins") || msg.includes("wins!")) ? 1000 : 100;
      setTimeout(async () => {
        // Double-check we're still in demo mode
        if (mode !== "demo") return;
        
        // Ensure previous game is completely stopped
        if (demoGameRef.current) {
          demoGameRef.current.stop();
        }
        if (initDemoGameRef.current) await initDemoGameRef.current();
        if (demoGameRef.current && !demoGameRef.current.gameActive && mode === "demo") {
          demoGameRef.current.start();
          setGamesStarted(true);
        }
      }, pauseTime);
    } else {
      if (msg === "AI wins!" || msg === "AI wins") {
        setWinnerMessage("AI wins");
        setInputEnabled(false);
        popupTimeoutRef.current = setTimeout(() => {
          setWinnerMessage("");
        }, 1500);
        restartTimeoutRef.current = setTimeout(() => {
          if (initUserGameRef.current) initUserGameRef.current();
          if (initAIGameRef.current) initAIGameRef.current();
          setWinnerMessage("Press WASD or arrows to restart");
          setInputEnabled(true);
        }, 1800);
      } else {
        restartTimeoutRef.current = setTimeout(() => {
          if (initUserGameRef.current) initUserGameRef.current();
          if (initAIGameRef.current) initAIGameRef.current();
          setWinnerMessage("Press WASD or arrows to restart");
        }, 1300);
      }
    }
  }, [mode]);

  // ----------------- Reinitialize on Grid Size or Mode Change -----------------
  useEffect(() => {
    // Clear all timeouts first
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Stop all existing games immediately to prevent overlap
    if (userGameRef.current) {
      userGameRef.current.stop();
      userGameRef.current = null;
    }
    if (aiGameRef.current) {
      aiGameRef.current.stop();
      aiGameRef.current = null;
    }
    if (demoGameRef.current) {
      demoGameRef.current.stop();
      demoGameRef.current = null;
    }
    
    // Reset initialization flags
    userInitializingRef.current = false;
    aiInitializingRef.current = false;
    demoInitializingRef.current = false;
    
    setGamesStarted(false);
    setWinnerMessage(null);
    setInputEnabled(true);
    setIsGameReady(false);
    
    // Use a single initialization approach to avoid race conditions
    const initializeGames = async () => {
      if (mode === "compete") {
        initUserGame();
        await initAIGame();
        setIsGameReady(true);
      } else if (mode === "demo") {
        await initDemoGame();
        setIsGameReady(true);
        // Auto-start demo only after initialization is complete
        setTimeout(() => {
          if (demoGameRef.current && !demoGameRef.current.gameActive && mode === "demo") {
            demoGameRef.current.start();
            setGamesStarted(true);
          }
        }, 50);
      }
    };
    
    // Small delay to ensure DOM is ready and prevent race conditions
    const initTimeout = setTimeout(initializeGames, 100);
    
    return () => {
      clearTimeout(initTimeout);
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
    
    // Prevent switching to compete mode on mobile
    if (isMobile && newMode === "compete") {
      return;
    }
    
    // Clear all timeouts
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Stop all games immediately
    if (userGameRef.current) {
      userGameRef.current.stop();
      userGameRef.current = null;
    }
    if (aiGameRef.current) {
      aiGameRef.current.stop();
      aiGameRef.current = null;
    }
    if (demoGameRef.current) {
      demoGameRef.current.stop();
      demoGameRef.current = null;
    }
    
    // Reset initialization flags
    userInitializingRef.current = false;
    aiInitializingRef.current = false;
    demoInitializingRef.current = false;
    
    setInputEnabled(true);
    setMode(newMode);
    setWinnerMessage(null);
    setGamesStarted(false);
    setIsGameReady(false);
  };

  const containerStyle = {
    position: 'relative',
    display: 'inline-block'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(139, 92, 246, 0.95))',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isMobile ? '18px' : '24px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
    padding: isMobile ? '10px' : '0'
  };

  // ----------------- Disable Arrow Keys and Spacebar Scrolling -----------------
  useEffect(() => {
    const preventScroll = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", preventScroll, { passive: false });
    return () => window.removeEventListener("keydown", preventScroll);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <NavBar repos={repos} />
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginTop: '20px',
        padding: isMobile ? '0 15px' : '0',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.8rem' : '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          🐍 Snake AI
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: '#6b7280',
          fontWeight: '500',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🎮 AI Demo Mode
        </p>
        {mode === "compete" ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '15px' : '20px',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? '100%' : '1040px',
            padding: isMobile ? '0 10px' : '0'
          }}>
            <div style={{...containerStyle, width: '100%', maxWidth: isMobile ? '100%' : '500px'}}>
              <canvas
                ref={userCanvasRef}
                width={500}
                height={600}
                style={{ 
                  border: '3px solid #10b981', 
                  borderRadius: '12px',
                  display: 'block',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  width: '100%',
                  height: 'auto',
                  maxWidth: isMobile ? '100%' : '500px'
                }}
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
            <div style={{...containerStyle, width: '100%', maxWidth: isMobile ? '100%' : '500px'}}>
              <canvas
                ref={aiCanvasRef}
                width={500}
                height={600}
                style={{ 
                  border: '3px solid #8b5cf6', 
                  borderRadius: '12px',
                  display: 'block',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  width: '100%',
                  height: 'auto',
                  maxWidth: isMobile ? '100%' : '500px'
                }}
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
          <div style={{
            ...containerStyle, 
            width: '100%', 
            maxWidth: isMobile ? '100%' : '500px',
            padding: isMobile ? '0 10px' : '0'
          }}>
            <canvas
              ref={demoCanvasRef}
              width={500}
              height={600}
              style={{ 
                border: '3px solid #8b5cf6', 
                borderRadius: '12px',
                display: 'block',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                background: 'linear-gradient(135deg, #1f2937, #111827)',
                width: '100%',
                height: 'auto',
                maxWidth: isMobile ? '100%' : '500px'
              }}
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
        {/* Speed slider - Hidden on mobile to simplify */}
        {!isMobile && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px',
            background: 'linear-gradient(135deg, #374151, #1f2937)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '450px'
          }}>
            <label 
              htmlFor="speed-slider" 
              style={{ 
                display: 'block',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                textAlign: 'center'
              }}
            >
              🏃 Game Speed: {tempSpeed}ms
            </label>
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
              style={{ 
                width: '100%', 
                maxWidth: '350px',
                height: '8px',
                background: 'linear-gradient(90deg, #10b981, #8b5cf6)',
                borderRadius: '4px',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '20px', 
          gap: isMobile ? '8px' : '12px',
          flexWrap: 'wrap',
          width: '100%',
          padding: isMobile ? '0 15px' : '0'
        }}>
          {[4, 5, 6].map((size) => (
            <button
              key={size}
              onClick={() => handleGridSizeChange(size)}
              style={{
                padding: isMobile ? '10px 18px' : '12px 24px',
                border: '2px solid transparent',
                borderRadius: '12px',
                background: size === gridSize 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #374151, #1f2937)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '14px' : '16px',
                transition: 'all 0.3s ease',
                boxShadow: size === gridSize 
                  ? '0 4px 20px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: size === gridSize ? 'translateY(-2px)' : 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (size !== gridSize) {
                  e.target.style.background = 'linear-gradient(135deg, #4b5563, #374151)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (size !== gridSize) {
                  e.target.style.background = 'linear-gradient(135deg, #374151, #1f2937)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              {size}×{size}
            </button>
          ))}
        </div>
        {/* Mode Buttons - Hidden on mobile */}
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '15px', 
            gap: '12px',
            flexWrap: 'wrap',
            width: '100%',
          }}>
            <button
              onClick={() => handleModeChange("compete")}
              style={{
                padding: '12px 28px',
                border: '2px solid transparent',
                borderRadius: '12px',
                background: mode === "compete" 
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                  : 'linear-gradient(135deg, #374151, #1f2937)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: mode === "compete" 
                  ? '0 4px 20px rgba(139, 92, 246, 0.4)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: mode === "compete" ? 'translateY(-2px)' : 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (mode !== "compete") {
                  e.target.style.background = 'linear-gradient(135deg, #4b5563, #374151)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== "compete") {
                  e.target.style.background = 'linear-gradient(135deg, #374151, #1f2937)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              🎯 Compete
            </button>
            <button
              onClick={() => handleModeChange("demo")}
              style={{
                padding: '12px 28px',
                border: '2px solid transparent',
                borderRadius: '12px',
                background: mode === "demo" 
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                  : 'linear-gradient(135deg, #374151, #1f2937)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: mode === "demo" 
                  ? '0 4px 20px rgba(139, 92, 246, 0.4)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: mode === "demo" ? 'translateY(-2px)' : 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (mode !== "demo") {
                  e.target.style.background = 'linear-gradient(135deg, #4b5563, #374151)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== "demo") {
                  e.target.style.background = 'linear-gradient(135deg, #374151, #1f2937)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              🎮 Demo
            </button>
          </div>
        )}
        {/* Bottom section - Hidden on mobile to simplify */}
        {isGameReady && !isMobile && (
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
