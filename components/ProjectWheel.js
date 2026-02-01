'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const mainRepoNames = [
  'nbodysimulation', //☄️
  'imessageanalysisapp',//💬
  'WhartonInvestmentQuant', //📈
  'snakePlusAi-V1-NEAT', //🐍
  'LandonGPT', //🪞
  'ai-sandbox', //🤖
  '2048AI', //
  'Connect4Bot', //
  'PokerPilot', //
];

const buttonLabels = {
  nbodysimulation: 'N-Body Simulation',
  imessageanalysisapp: 'iMessage Analysis App',
  WhartonInvestmentQuant: 'Wharton Quant',
  'snakePlusAi-V1-NEAT': 'Snake AI',
  LandonGPT: 'LandonGPT 2',
  'ai-sandbox': 'AI Sandbox',
  '2048AI': '2048 AI',
  Connect4Bot: 'Connect4 Bot',
  PokerPilot: 'PokerPilot',
};

const projectEmojis = {
  nbodysimulation: '☄️',
  imessageanalysisapp: '💬',
  WhartonInvestmentQuant: '📈',
  'snakePlusAi-V1-NEAT': '🐍',
  LandonGPT: '🪞',
  'ai-sandbox': '🤖',
  '2048AI': '🎯',
  Connect4Bot: '🔴',
  PokerPilot: '🃏',
};

const projectDescriptions = {
  nbodysimulation: 'Real-time physics simulation of celestial bodies with gravitational interactions',
  imessageanalysisapp: 'Advanced analytics tool for iMessage conversations with beautiful visualizations',
  WhartonInvestmentQuant: 'Quantitative investment analysis platform using advanced financial models',
  'snakePlusAi-V1-NEAT': 'AI-powered Snake game using NEAT algorithm for evolutionary learning',
  LandonGPT: 'Modern LandonGPT experience with memory and embedding-based retrieval',
  'ai-sandbox': 'Interactive 2D platformer where AI agents learn to navigate levels using genetic algorithms and neural networks',
  '2048AI': 'Intelligent agent that masters the 2048 game using reinforcement learning',
  Connect4Bot: 'Strategic AI bot that plays Connect4 with advanced minimax algorithms',
  PokerPilot: 'Sophisticated poker analysis tool with probability calculations and strategy recommendations',
};

export default function ProjectWheel({ repos = [] }) {
  const [repoColors, setRepoColors] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [trackPositions, setTrackPositions] = useState({});
  // targetPositions and rotationOffset are now calculated in real-time to prevent infinite loops
  // Use a fixed default value to avoid hydration mismatch, then update in useEffect
  const [screenWidth, setScreenWidth] = useState(1200);
  const rotationRef = useRef(0); // Use ref for animation rotation to avoid triggering useEffect

  // Generate a light HSL color
  const generateLightColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70;
    const lightness = 60 + Math.random() * 25;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Assign random colors once
  useEffect(() => {
    const colors = mainRepoNames.reduce((acc, name) => {
      acc[name] = generateLightColor();
      return acc;
    }, {});
    setRepoColors(colors);
  }, []);

  // Track screen width changes for responsive ball sizing
  useEffect(() => {
    // Set initial width after mount to avoid hydration mismatch
    setScreenWidth(window.innerWidth);
    
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter repos to get main ones - memoized to prevent recreating on every render
  const mainRepos = useMemo(() => {
    const filtered = repos.filter((repo) => mainRepoNames.includes(repo.name));
    // Add 'ai-sandbox' if it's in mainRepoNames but not in repos (since it's not a GitHub repo)
    if (mainRepoNames.includes('ai-sandbox') && !filtered.some(r => r.name === 'ai-sandbox')) {
      filtered.push({
        id: 'ai-sandbox',
        name: 'ai-sandbox',
        // Add other required properties with defaults
        description: projectDescriptions['ai-sandbox'] || '',
        html_url: '',
        stargazers_count: 0,
      });
    }
    // Sort to match mainRepoNames order
    return mainRepoNames
      .map(name => filtered.find(r => r.name === name))
      .filter(Boolean);
  }, [repos]);

  // Define track system - positions around the circle with rotation offset
  const getTrackPositions = useCallback((total, rotationOffset = 0) => {
    const positions = {};
    // Use responsive radius based on viewport width, but with reasonable limits
    const baseRadius = Math.min(screenWidth * 0.25, 250); // 25% of viewport width, max 250px
    for (let i = 0; i < total; i++) {
      const angle = (i * 360) / total + rotationOffset;
      const radius = baseRadius;
      const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
      const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
      positions[i] = { x, y, angle };
    }
    return positions;
  }, [screenWidth]);

  // Calculate positions with push effect - memoized to avoid recreation on every render
  const calculatePositionsWithPush = useCallback((currentRotationOffset, currentHoveredProject, repos) => {
    const basePositions = getTrackPositions(repos.length, currentRotationOffset);
    const positions = {};
    
    if (!currentHoveredProject) {
      // No hover - return base positions with rotation
      repos.forEach((repo, index) => {
        positions[repo.name] = basePositions[index];
      });
      return positions;
    }

    const hoveredIndex = repos.findIndex(r => r.name === currentHoveredProject);
    if (hoveredIndex === -1) return positions;

    repos.forEach((repo, index) => {
      let adjustedIndex = index;
      
      if (index !== hoveredIndex) {
        // Calculate distance to hovered item (considering circular array)
        let distance = Math.abs(index - hoveredIndex);
        if (distance > repos.length / 2) {
          distance = repos.length - distance;
        }
        
        // Push away nearby items (within 2 positions)
        if (distance <= 2) {
          const pushAmount = (3 - distance) * 0.3; // 0.3 = push factor
          
          // Determine push direction
          let direction = 1;
          if (index < hoveredIndex) {
            direction = hoveredIndex - index > repos.length / 2 ? 1 : -1;
          } else {
            direction = index - hoveredIndex > repos.length / 2 ? -1 : 1;
          }
          
          adjustedIndex = index + (direction * pushAmount);
        }
      }
      
      // Calculate position based on adjusted index with rotation offset
      const angle = (adjustedIndex * 360) / repos.length + currentRotationOffset;
      const baseRadius = Math.min(screenWidth * 0.25, 250);
      const radius = index === hoveredIndex ? baseRadius + 20 : baseRadius; // Hovered item moves out slightly
      const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
      const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
      
      positions[repo.name] = { x, y, angle };
    });
    
    return positions;
  }, [getTrackPositions, screenWidth]);

  // Smooth animation system
  useEffect(() => {
    if (mainRepos.length === 0) return;
    
    const animate = () => {
      setTrackPositions(prevPositions => {
        const newPositions = {};
        
        // Update rotation offset for continuous rotation when not hovered
        if (!isHovered) {
          rotationRef.current = (rotationRef.current + 0.1) % 360;
        }
        
        // Calculate target positions in real-time during animation
        const currentTargetPositions = calculatePositionsWithPush(rotationRef.current, hoveredProject, mainRepos);
        
        Object.keys(currentTargetPositions).forEach(repoName => {
          const currentPos = prevPositions[repoName] || currentTargetPositions[repoName];
          const targetPos = currentTargetPositions[repoName];
          
          // Smooth interpolation between current and target positions
          const lerpFactor = 0.08; // Adjust for smoother/faster transitions
          const newPos = {
            x: currentPos.x + (targetPos.x - currentPos.x) * lerpFactor,
            y: currentPos.y + (targetPos.y - currentPos.y) * lerpFactor,
            angle: targetPos.angle // Keep target angle for reference
          };
          
          newPositions[repoName] = newPos;
        });
        
        return newPositions;
      });
    };
    
    const intervalId = setInterval(animate, 16); // 60fps for smooth animation
    return () => clearInterval(intervalId);
  }, [isHovered, mainRepos, hoveredProject, calculatePositionsWithPush]);

  // Note: Target positions are now calculated in real-time during animation
  // This eliminates the need for a separate useEffect that was causing infinite loops

  // Initialize positions on first load
  useEffect(() => {
    if (mainRepos.length > 0 && Object.keys(trackPositions).length === 0) {
      const basePositions = getTrackPositions(mainRepos.length, 0);
      const positions = {};
      mainRepos.forEach((repo, index) => {
        positions[repo.name] = basePositions[index];
      });
      setTrackPositions(positions);
      // No need to set targetPositions since they're calculated in real-time
    }
  }, [mainRepos, trackPositions, getTrackPositions]);

  const ProjectButton = ({ repo }) => {
    const displayName = buttonLabels[repo.name] || repo.name;
    const emoji = projectEmojis[repo.name] || '🚀';
    const isHovered = hoveredProject === repo.name;
    const position = trackPositions[repo.name] || { x: 0, y: 0, angle: 0 };
    
    // Calculate dynamic ball sizes based on screen width
    const normalSize = Math.max(60, Math.min(screenWidth / 6, 150)); // Min 60px, max 150px
    const hoveredSize = Math.max(80, Math.min(screenWidth / 4.5, 200)); // Min 80px, max 200px
    const ballSize = isHovered ? hoveredSize : normalSize;
    
    // Note: isBeingPushed could be used for additional hover effects if needed
    
    return (
      <div
        className="project-button"
        style={{
          position: 'absolute',
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: `translate(-50%, -50%)`,
          width: `${ballSize}px`,
          height: `${ballSize}px`,
          borderRadius: '50%',
          backgroundColor: repoColors[repo.name] || '#f0f0f0',
          border: `${isHovered ? '4px' : '3px'} solid rgba(255, 255, 255, 0.8)`,
          boxShadow: isHovered 
            ? '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 0 8px rgba(255, 255, 255, 0.2)' 
            : '0 8px 25px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'width 0.3s ease, height 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
          zIndex: isHovered ? 1000 : 100,
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => {
          // Use onMouseDown instead of onClick to catch the event earlier
          console.log('MouseDown FIRED on:', repo.name);
          e.preventDefault();
          e.stopPropagation();
          const targetPath = repo.name === 'LandonGPT' ? '/landonGPT' : `/${repo.name}`;
          console.log('Navigating to:', targetPath);
          window.location.href = targetPath;
          return false;
        }}
        onClick={(e) => {
          console.log('onClick FIRED on:', repo.name);
          e.preventDefault();
          e.stopPropagation();
          const targetPath = repo.name === 'LandonGPT' ? '/landonGPT' : `/${repo.name}`;
          console.log('Navigating to:', targetPath);
          window.location.href = targetPath;
          return false;
        }}
        onPointerDown={(e) => {
          console.log('onPointerDown FIRED on:', repo.name);
          e.preventDefault();
          e.stopPropagation();
          const targetPath = repo.name === 'LandonGPT' ? '/landonGPT' : `/${repo.name}`;
          window.location.href = targetPath;
          return false;
        }}
        onMouseEnter={() => {
          setHoveredProject(repo.name);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setHoveredProject(null);
          setIsHovered(false);
        }}
      >
        {/* Fixed text container - no rotation needed */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(0deg)', // Always keep text level
        }}>
          <div style={{
            fontSize: `${ballSize * 0.25}px`, // Emoji size scales with ball size
            marginBottom: '5px',
            transition: 'all 0.3s ease',
          }}>
            {emoji}
          </div>
          <div style={{
            fontSize: `${Math.max(9, ballSize * 0.1)}px`, // Text size scales with ball size, min 9px
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            lineHeight: '1.2',
            opacity: isHovered ? 1 : 0.8,
            transition: 'all 0.3s ease',
          }}>
            {displayName}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '70vw',
        maxHeight: '600px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '40px 0',
        pointerEvents: 'auto', // Ensure the container allows pointer events
      }}
      onMouseLeave={() => {
        // Clear hover state when mouse leaves the entire wheel area
        setHoveredProject(null);
        setIsHovered(false);
      }}
    >
      {/* Central hub */}
      <div style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '4px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}>
        <div style={{
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Projects
        </div>
      </div>

      {/* Static container with dynamic positioning */}
      <div
        style={{
          position: 'relative',
          width: '70vw',
          height: '70vw',
          maxWidth: '600px',
          maxHeight: '600px',
          pointerEvents: 'none', // Let clicks pass through to buttons
        }}
      >
        {/* Dynamic connection lines that track circle positions */}
        {mainRepos.map((repo) => {
          const position = trackPositions[repo.name];
          if (!position) return null;
          
          // Calculate angle from center to ACTUAL current circle position
          const angleToCircle = Math.atan2(position.y, position.x) * (180 / Math.PI);
          
          // Calculate distance from center to ACTUAL circle position
          const distanceToCircle = Math.sqrt(position.x * position.x + position.y * position.y);
          
          return (
            <div
              key={`line-${repo.id}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${distanceToCircle}px`,
                height: '2px',
                backgroundColor: 'rgba(102, 126, 234, 0.3)',
                transformOrigin: '0 50%',
                transform: `rotate(${angleToCircle}deg)`,
                zIndex: 50,
                pointerEvents: 'none', // Allow clicks to pass through to the links
                // Remove transitions to make spokes track perfectly
                transition: 'none',
              }}
            />
          );
        })}

        {/* Project buttons with track positioning */}
        {mainRepos.map((repo) => (
          <ProjectButton
            key={repo.id}
            repo={repo}
          />
        ))}
      </div>

      {/* Hover description */}
      {hoveredProject && (
        <div className="hover-description" style={{
          position: 'absolute',
          bottom: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(100, 100, 100, 0.95)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '15px',
          fontSize: '13px',
          fontWeight: '500',
          maxWidth: '300px',
          textAlign: 'center',
          lineHeight: '1.4',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#fff',
          }}>
            {buttonLabels[hoveredProject] || hoveredProject}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '12px',
          }}>
            {projectDescriptions[hoveredProject] || 'Innovative project showcasing technical excellence'}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .project-button:hover {
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 1);
        }

        /* Smooth animations for all interactions */
        .project-button {
          will-change: transform, left, top;
        }

        /* Override hover transitions for more specific timing */
        .project-button:hover {
          transition: all 0.5s cubic-bezier(0.8, 0, 0.2, 1) !important;
        }

        /* Note: Ball sizing is now handled dynamically in JavaScript based on screen width
           These responsive rules are kept for any edge cases but the main sizing is dynamic */

        /* Mobile description adjustments */
        @media (max-width: 768px) {
          .hover-description {
            maxWidth: 280px !important;
            fontSize: 12px !important;
            padding: 12px 20px !important;
            bottom: -70px !important;
          }
        }

        @media (max-width: 480px) {
          .hover-description {
            maxWidth: 250px !important;
            fontSize: 11px !important;
            padding: 10px 15px !important;
            bottom: -60px !important;
          }
        }
      `}</style>
    </div>
  );
}