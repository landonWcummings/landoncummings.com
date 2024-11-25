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
    const WHITE = 'rgb(255, 255, 255)';
    const BACKGROUND = WHITE;

    const scale = 5;
    const trace = 1;
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
        const dif = 130 / n;
        const spot = Math.floor(Math.random() * 3);
        const color = [100, 100, 100];
        color[spot] = dif * i;
        bodies.push({ x, y, x_velocity, y_velocity, mass, color });
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
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, windowWidth, windowHeight);

      // Draw bodies
      for (let bod = 0; bod < bodies.length; bod++) {
        const color = `rgb(${bodies[bod].color[0]}, ${bodies[bod].color[1]}, ${bodies[bod].color[2]})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          bodies[bod].x,
          bodies[bod].y,
          bodies[bod].mass / scale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw traces
      for (let i = 0; i < tracer.length; i++) {
        const bodyTracer = tracer[i];
        const color = `rgb(${bodies[i].color[0]}, ${bodies[i].color[1]}, ${bodies[i].color[2]})`;
        ctx.fillStyle = color;
        for (let pos of bodyTracer) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], trace, 0, Math.PI * 2);
          ctx.fill();
        }
        bodyTracer.push([bodies[i].x, bodies[i].y]);
        const maxTraceLength = 100;
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
          border: '1px solid black',
          margin: '20px auto',
          display: 'block',
        }}
      ></canvas>
      <div style={{ margin: '20px auto', width: '300px', textAlign: 'left' }}>
        <label>
          <input
            type="checkbox"
            checked={walls}
            onChange={handleWallsChange}
            style={{ marginRight: '10px' }}
          />
          Walls
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={consume}
            onChange={handleConsumeChange}
            style={{ marginRight: '10px' }}
          />
          Consume
        </label>
        <br />
        <label>
          Number of Bodies: {numBodies}
          <input
            type="range"
            min="2"
            max="100"
            value={numBodies}
            onChange={handleNumBodiesChange}
            style={{ width: '100%' }}
          />
        </label>

        <br />
        <label>
          Gravitational constant: {GravitationalConst}
          <input
            type="range"
            min="0.001"
            max="1"
            step="0.001"        
            value={GravitationalConst}
            onChange={handleGravitationalConstChange}
            style={{ width: '100%' }}
          />
        </label>

        <br />
        <label>
          Canvas Width: {canvasWidth}px
          <input
            type="range"
            min="400"
            max="1200"
            value={canvasWidth}
            onChange={handleCanvasWidthChange}
            style={{ width: '100%' }}
          />
        </label>
        <br />
        <label>
          Canvas Height: {canvasHeight}px
          <input
            type="range"
            min="300"
            max="900"
            value={canvasHeight}
            onChange={handleCanvasHeightChange}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <p>
        Press <strong>Spacebar</strong> to reset the simulation.
      </p>
    </div>
  );
}
