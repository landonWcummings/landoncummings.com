'use client';

import React, { useEffect, useRef, useState } from 'react';
import NavBar from '../../components/NavBar';

export default function NBodySimulation({ repos }) {
  const canvasRef = useRef(null);
  const bodiesRef = useRef([]);
  const tracerRef = useRef([]);

  // State variables for interactive controls
  const [walls, setWalls] = useState(true);
  const [consume, setConsume] = useState(false);
  const [numBodies, setNumBodies] = useState(10);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [GravitationalConst, setGravitationalConst] = useState(0.011)

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Constants
    const scale = 5;
    const cap = 10.5;
    const G = GravitationalConst;
    const speedDivisor = 1.3;

    const n = numBodies; // Number of bodies from state

    const windowWidth = canvas.width;
    const windowHeight = canvas.height;

    const bodies = bodiesRef.current;
    const tracer = tracerRef.current;

    // Helper functions
    function rand() {
      return (
        Math.floor(
          Math.random() *
            (Math.min(windowWidth / 4, windowHeight / 4) * 2 + 1)
        ) - Math.min(windowWidth / 4, windowHeight / 4)
      );
    }

    function randf() {
      return (Math.random() - 0.5) / speedDivisor;
    }

    // Initialize bodies
    function initializeBodies() {
      bodies.length = 0;
      tracer.length = 0;
      for (let i = 0; i < n; i++) {
        const x = windowWidth / 2 + rand();
        const y = windowHeight / 2 + rand();
        const x_velocity = randf();
        const y_velocity = randf();
        const mass = (Math.abs(rand()) + 30) / 2.5;
        
        // Generate more vibrant star/planet colors
        const colorTypes = [
          [255, 200, 100], // Golden sun-like
          [100, 150, 255], // Blue star
          [255, 150, 150], // Red giant
          [200, 255, 200], // Green planet
          [255, 180, 255], // Purple nebula
          [255, 255, 150], // Yellow star
          [150, 255, 255], // Cyan ice planet
          [255, 200, 150], // Orange star
        ];
        
        const color = colorTypes[i % colorTypes.length];
        const bodyType = Math.random() > 0.7 ? 'star' : 'planet'; // 30% chance of being a star
        bodies.push({ x, y, x_velocity, y_velocity, mass, color, bodyType });
        tracer.push([]);
      }
    }

    initializeBodies();

    // Simulation functions
    function grav() {
        function mapt(bool) {
          return bool ? -1 : 1;
        }
      
        function gravForce(m1, m2, dist) {
          if (dist === 0) return 0;
          const top = G * m1 * m2;
          const bot = dist * dist + 0.4;
          return top / bot;
        }
      
        function dist(x1, x2, y1, y2) {
          const p1 = Math.pow(Math.abs(x1 - x2), 2);
          const p2 = Math.pow(Math.abs(y1 - y2), 2);
          return Math.sqrt(p1 + p2);
        }
      
        let bod = 0;
        while (bod < bodies.length) {
          const xforces = [];
          const yforces = [];
          let compbod = 0;
      
          while (compbod < bodies.length) {
            if (compbod !== bod) {
              const xdir = mapt(bodies[bod]?.x > bodies[compbod]?.x);
              const ydir = mapt(bodies[bod]?.y > bodies[compbod]?.y);
              const distance = dist(
                bodies[bod]?.x,
                bodies[compbod]?.x,
                bodies[bod]?.y,
                bodies[compbod]?.y
              );
      
              if (!bodies[bod] || !bodies[compbod]) {
                // Skip if any of the bodies involved were removed
                compbod++;
                continue;
              }
      
              if (bodies.length > 10 && distance > 250) {
                compbod++;
                continue;
              }
              
              // Consume logic
              if (
                consume &&
                distance <= (bodies[bod].mass + bodies[compbod].mass) / 15
              ) {
                const biggerbod =
                  bodies[bod].mass > bodies[compbod].mass ? bod : compbod;
                const smallerbod =
                  bodies[bod].mass > bodies[compbod].mass ? compbod : bod;
      
                bodies[biggerbod].mass += bodies[smallerbod].mass;
                bodies.splice(smallerbod, 1);
                tracer.splice(smallerbod, 1);
      
                // Adjust indices
                if (smallerbod < bod) bod--;
                if (smallerbod < compbod) compbod--;
      
                continue;
              }
      
              const xfor =
                gravForce(
                  bodies[bod].mass,
                  bodies[compbod].mass,
                  distance
                ) *
                (Math.abs(bodies[bod].x - bodies[compbod].x) / distance);
              const yfor =
                gravForce(
                  bodies[bod].mass,
                  bodies[compbod].mass,
                  distance
                ) *
                (Math.abs(bodies[bod].y - bodies[compbod].y) / distance);
      
              xforces.push(xdir * xfor);
              yforces.push(ydir * yfor);
            }
            compbod++;
          }
      
          const ximp = xforces.reduce((a, b) => a + b, 0);
          const yimp = yforces.reduce((a, b) => a + b, 0);
      
          if (bodies[bod]) {
            bodies[bod].x_velocity += ximp;
            if (bodies[bod].x_velocity > cap) bodies[bod].x_velocity = cap;
            if (bodies[bod].x_velocity < -cap) bodies[bod].x_velocity = -cap;
      
            bodies[bod].y_velocity += yimp;
            if (bodies[bod].y_velocity > cap) bodies[bod].y_velocity = cap;
            if (bodies[bod].y_velocity < -cap) bodies[bod].y_velocity = -cap;
          }
      
          bod++;
        }
      
        // Update positions
        for (let bod = 0; bod < bodies.length; bod++) {
          bodies[bod].x += bodies[bod].x_velocity;
          bodies[bod].y += bodies[bod].y_velocity;
      
          // Walls logic
          if (walls) {
            if (bodies[bod].x < 0) {
              bodies[bod].x = 0;
              bodies[bod].x_velocity *= -1;
            } else if (bodies[bod].x > windowWidth) {
              bodies[bod].x = windowWidth;
              bodies[bod].x_velocity *= -1;
            }
            if (bodies[bod].y < 0) {
              bodies[bod].y = 0;
              bodies[bod].y_velocity *= -1;
            } else if (bodies[bod].y > windowHeight) {
              bodies[bod].y = windowHeight;
              bodies[bod].y_velocity *= -1;
            }
          }
        }
    }
      

    function draw() {
      // Create space background with gradient
      const gradient = ctx.createRadialGradient(
        windowWidth / 2, windowHeight / 2, 0,
        windowWidth / 2, windowHeight / 2, Math.max(windowWidth, windowHeight) / 2
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0a0a15');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, windowWidth, windowHeight);

      // Add starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % windowWidth;
        const y = (i * 67.3) % windowHeight;
        const size = (i % 3 === 0) ? 1.5 : 0.5; // Varied star sizes
        const opacity = (i % 4 === 0) ? 0.9 : 0.4; // Varied brightness
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw wall boundaries if walls are enabled
      if (walls) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(0, 0, windowWidth, windowHeight);
        ctx.setLineDash([]); // Reset line dash
        
        // Add corner indicators
        const cornerSize = 20;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        // Top-left
        ctx.fillRect(0, 0, cornerSize, 3);
        ctx.fillRect(0, 0, 3, cornerSize);
        // Top-right
        ctx.fillRect(windowWidth - cornerSize, 0, cornerSize, 3);
        ctx.fillRect(windowWidth - 3, 0, 3, cornerSize);
        // Bottom-left
        ctx.fillRect(0, windowHeight - 3, cornerSize, 3);
        ctx.fillRect(0, windowHeight - cornerSize, 3, cornerSize);
        // Bottom-right
        ctx.fillRect(windowWidth - cornerSize, windowHeight - 3, cornerSize, 3);
        ctx.fillRect(windowWidth - 3, windowHeight - cornerSize, 3, cornerSize);
      }

      // Draw bodies with enhanced visuals
      for (let bod = 0; bod < bodies.length; bod++) {
        const body = bodies[bod];
        const radius = body.mass / scale;
        const x = body.x;
        const y = body.y;
        const color = body.color;
        
        // Create glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        glowGradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`);
        glowGradient.addColorStop(0.3, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`);
        glowGradient.addColorStop(0.7, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.1)`);
        glowGradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
        
        // Draw glow
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Create body gradient based on type
        const bodyGradient = ctx.createRadialGradient(
          x - radius * 0.3, y - radius * 0.3, 0,
          x, y, radius
        );
        
        if (body.bodyType === 'star') {
          // Star gradient - bright center
          bodyGradient.addColorStop(0, `rgb(${Math.min(255, color[0] + 50)}, ${Math.min(255, color[1] + 50)}, ${Math.min(255, color[2] + 50)})`);
          bodyGradient.addColorStop(0.4, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
          bodyGradient.addColorStop(1, `rgb(${Math.max(0, color[0] - 50)}, ${Math.max(0, color[1] - 50)}, ${Math.max(0, color[2] - 50)})`);
        } else {
          // Planet gradient - more subdued
          bodyGradient.addColorStop(0, `rgb(${Math.min(255, color[0] + 30)}, ${Math.min(255, color[1] + 30)}, ${Math.min(255, color[2] + 30)})`);
          bodyGradient.addColorStop(0.6, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
          bodyGradient.addColorStop(1, `rgb(${Math.max(0, color[0] - 30)}, ${Math.max(0, color[1] - 30)}, ${Math.max(0, color[2] - 30)})`);
        }
        
        // Draw main body
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle border for definition
        ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw traces with improved visuals
      for (let i = 0; i < tracer.length; i++) {
        const bodyTracer = tracer[i];
        const color = bodies[i].color;
        
        // Draw trace as connected line with fading opacity
        if (bodyTracer.length > 1) {
          ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bodyTracer[0][0], bodyTracer[0][1]);
          
          for (let j = 1; j < bodyTracer.length; j++) {
            const opacity = (j / bodyTracer.length) * 0.6;
            ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
            ctx.lineTo(bodyTracer[j][0], bodyTracer[j][1]);
            ctx.stroke();
            if (j < bodyTracer.length - 1) {
              ctx.beginPath();
              ctx.moveTo(bodyTracer[j][0], bodyTracer[j][1]);
            }
          }
        }
        
        bodyTracer.push([bodies[i].x, bodies[i].y]);
        const maxTraceLength = 150; // Increased for longer, more beautiful trails
        if (bodyTracer.length > maxTraceLength) {
          bodyTracer.shift();
        }
      }
    }

    function animate() {
      grav();
      draw();
      animationFrameId = requestAnimationFrame(animate);
    }

    // Keydown event for resetting the simulation
    function handleKeyDown(event) {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent spacebar from scrolling the page
        initializeBodies();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    // Start animation
    animate();

    // Clean up on unmount or when dependencies change
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [walls, consume, numBodies, canvasWidth, canvasHeight,GravitationalConst]); // Re-run effect when these change

  // Handlers for controls
  const handleWallsChange = (e) => {
    setWalls(e.target.checked);
  };

  const handleConsumeChange = (e) => {
    setConsume(e.target.checked);
  };

  const handleNumBodiesChange = (e) => {
    setNumBodies(parseInt(e.target.value));
  };
  
  const handleGravitationalConstChange = (e) => {
    setGravitationalConst(parseFloat(e.target.value));
  };

  const handleCanvasWidthChange = (e) => {
    setCanvasWidth(parseInt(e.target.value));
  };

  const handleCanvasHeightChange = (e) => {
    setCanvasHeight(parseInt(e.target.value));
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
        {/* Hidden SEO content for this specific page */}
        <div style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          visibility: 'hidden',
          overflow: 'hidden',
          width: '1px',
          height: '1px'
        }}>
          <h1>N-Body Gravitational Physics Simulation - Interactive Celestial Mechanics</h1>
          <p>
            Experience an advanced n-body physics simulation that demonstrates gravitational interactions between 
            multiple celestial bodies in real-time. This interactive simulation features customizable parameters 
            including gravitational constant, number of bodies, canvas dimensions, wall boundaries, and consumption mechanics.
            The simulation visualizes complex orbital dynamics, gravitational attractions, and celestial body interactions
            with beautiful visual effects including glowing bodies, fading trails, and space-like backgrounds.
          </p>
          <h2>Physics Simulation Features</h2>
          <p>
            Real-time gravitational force calculations, n-body problem solving, orbital mechanics demonstration,
            interactive parameter controls, visual wall boundaries, body consumption mechanics, customizable gravitational constant,
            variable number of celestial bodies, dynamic canvas sizing, beautiful space-themed graphics, glowing particle effects,
            fading orbital trails, star and planet differentiation, responsive design, and educational physics visualization.
          </p>
          <h3>Technical Implementation</h3>
          <p>
            Built using JavaScript ES6, HTML5 Canvas API, React hooks for state management, real-time animation loops,
            mathematical physics calculations, gradient rendering, particle systems, and interactive user controls.
            Demonstrates advanced programming concepts including numerical integration, force calculations, collision detection,
            and computer graphics programming.
          </p>
        </div>
        
        <NavBar repos={repos} />
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          N-Body Simulation
        </h1>
        <p>
          Simulating planetary objects <br />
          you&apos;ve heard of the three-body problem... <br />
          let&apos;s take it a step further
        </p>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          border: '3px solid #00d4ff',
          borderRadius: '15px',
          margin: '20px auto',
          display: 'block',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)',
          background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 100%)',
        }}
      ></canvas>
      <div style={{ 
        margin: '20px auto', 
        maxWidth: '500px', 
        padding: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        color: 'white'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '25px', 
          fontSize: '1.5rem',
          fontWeight: '600',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Simulation Controls
        </h2>
        
        {/* Toggle Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          marginBottom: '30px',
          gap: '20px'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '1.1rem',
            fontWeight: '500',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            borderRadius: '25px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}>
            <input
              type="checkbox"
              checked={walls}
              onChange={handleWallsChange}
              style={{ 
                marginRight: '12px',
                transform: 'scale(1.3)',
                accentColor: '#00d4ff'
              }}
            />
            🏗️ Walls
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '1.1rem',
            fontWeight: '500',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            borderRadius: '25px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}>
            <input
              type="checkbox"
              checked={consume}
              onChange={handleConsumeChange}
              style={{ 
                marginRight: '12px',
                transform: 'scale(1.3)',
                accentColor: '#ff4757'
              }}
            />
            🍽️ Consume
          </label>
        </div>

        {/* Slider Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              🌌 Number of Bodies: <span style={{ color: '#00d4ff', fontSize: '1.2rem' }}>{numBodies}</span>
            </label>
            <input
              type="range"
              min="2"
              max="100"
              value={numBodies}
              onChange={handleNumBodiesChange}
              style={{ 
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: 'linear-gradient(to right, #00d4ff, #0984e3)',
                outline: 'none',
                opacity: '0.8',
                transition: 'opacity 0.2s'
              }}
            />
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              ⚡ Gravitational Constant: <span style={{ color: '#fd79a8', fontSize: '1.2rem' }}>{GravitationalConst.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0.001"
              max="1"
              step="0.001"        
              value={GravitationalConst}
              onChange={handleGravitationalConstChange}
              style={{ 
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: 'linear-gradient(to right, #fd79a8, #e84393)',
                outline: 'none',
                opacity: '0.8',
                transition: 'opacity 0.2s'
              }}
            />
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              📐 Canvas Width: <span style={{ color: '#a29bfe', fontSize: '1.2rem' }}>{canvasWidth}px</span>
            </label>
            <input
              type="range"
              min="400"
              max="1200"
              value={canvasWidth}
              onChange={handleCanvasWidthChange}
              style={{ 
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: 'linear-gradient(to right, #a29bfe, #6c5ce7)',
                outline: 'none',
                opacity: '0.8',
                transition: 'opacity 0.2s'
              }}
            />
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              📏 Canvas Height: <span style={{ color: '#55efc4', fontSize: '1.2rem' }}>{canvasHeight}px</span>
            </label>
            <input
              type="range"
              min="300"
              max="900"
              value={canvasHeight}
              onChange={handleCanvasHeightChange}
              style={{ 
                width: '100%',
                height: '8px',
                borderRadius: '5px',
                background: 'linear-gradient(to right, #55efc4, #00b894)',
                outline: 'none',
                opacity: '0.8',
                transition: 'opacity 0.2s'
              }}
            />
          </div>
        </div>
      </div>
      <p>
        Press <strong>Spacebar</strong> to reset the simulation.
      </p>
    </div>
  );
}
