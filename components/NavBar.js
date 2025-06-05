'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';

const mainRepoNames = [
  'nbodysimulation',
  'imessageanalysisapp',
  'WhartonInvestmentQuant',
  'snakePlusAi-V1-NEAT',
  'LandonGPT',
  '2048AI',
  'Connect4Bot',
  'PokerPilot',
];

const buttonLabels = {
  nbodysimulation: 'N-Body Simulation',
  imessageanalysisapp: 'iMessage Analysis App',
  WhartonInvestmentQuant: 'Wharton Quant',
  'snakePlusAi-V1-NEAT': 'Snake AI',
  LandonGPT: 'LandonGPT',
  '2048AI': '2048 AI',
  Connect4Bot: 'Connect4 Bot',
  PokerPilot: 'PokerPilot',
};

const SCROLL_SPEED = 0.5; // pixels per frame

const NavBar = ({ repos = [] }) => {
  const navRef = useRef(null);
  const scrollRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pausedRef = useRef(false);

  const [navHeight, setNavHeight] = useState(100);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [repoColors, setRepoColors] = useState({});

  // Generate a light HSL color
  const generateLightColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 75;
    const lightness = 65 + Math.random() * 20;
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

  // Update navbar height on resize
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    };

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  // Setup three-set scroll, wrapping, and auto-scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Each .repo-set has equal width, so singleSetWidth = total scrollWidth / 3
    const singleSetWidth = container.scrollWidth / 3;
    // Start in the middle set
    container.scrollLeft = singleSetWidth;

    const wrapScroll = () => {
      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft -= singleSetWidth;
      }
      if (container.scrollLeft <= 0) {
        container.scrollLeft += singleSetWidth;
      }
    };

    // On user scroll, wrap but do not stop auto-scroll permanently
    const onScroll = () => {
      wrapScroll();
    };

    container.addEventListener('scroll', onScroll);

    // Auto-scroll loop
    const step = () => {
      if (!pausedRef.current) {
        container.scrollLeft += SCROLL_SPEED;
        wrapScroll();
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };
    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Filter repos into main and other
  const mainRepos = useMemo(
    () => repos.filter((repo) => mainRepoNames.includes(repo.name)),
    [repos]
  );
  const otherRepos = useMemo(
    () => repos.filter((repo) => !mainRepoNames.includes(repo.name)),
    [repos]
  );

  return (
    <>
      <style>
        {`
          /* BUTTON BASE STYLES */
          .button {
            position: relative;
            display: inline-block;
            text-align: center;
            padding: 10px 15px;
            font-size: 14px;
            width: 140px;
            border-radius: 6px;
            border: 2px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            color: #333;
            font-weight: bold;
            cursor: pointer;
            overflow: hidden;
            margin-right: 10px;
            white-space: nowrap;
          }

          /* SPECIAL RAINBOW OVERLAY */
          .button.special::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              45deg,
              rgba(255, 0, 0, 0.3),
              rgba(255, 255, 0, 0.3),
              rgba(0, 255, 0, 0.3),
              rgba(0, 255, 255, 0.3),
              rgba(0, 0, 255, 0.3),
              rgba(255, 0, 255, 0.3)
            );
            background-size: 300% 300%;
            animation: rainbowRaindrops 3s linear infinite;
            z-index: 1;
            pointer-events: none;
            opacity: 0.7;
          }

          .button span {
            position: relative;
            z-index: 2;
          }

          /* RAINBOW KEYFRAMES */
          @keyframes rainbowRaindrops {
            0% {
              background-position: -200% -200%;
            }
            50% {
              background-position: 200% 200%;
            }
            100% {
              background-position: 400% 400%;
            }
          }

          /* SCROLL CONTAINER */
          .scroll-container {
            overflow-x: auto; /* always allow horizontal scroll */
            width: 100%;
            position: relative;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE 10+ */
          }
          .scroll-container::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }

          /* We rely on JS for auto-scroll */
          .scroll-content {
            display: flex;
            width: calc(300%); /* three sets side by side */
          }

          /* DUPLICATE SET UP */
          .scroll-content > .repo-set {
            display: flex;
          }

          /* RESPONSIVE ADJUSTMENTS */
          @media (max-width: 600px) {
            nav {
              height: auto;
              padding: 10px;
            }
            .scroll-content .button {
              font-size: 11px;
              width: 90px;
              padding: 6px 8px;
              margin-right: 6px;
            }
          }

          @media (max-width: 400px) {
            nav {
              height: auto;
              padding: 5px;
            }
            .scroll-content .button {
              font-size: 10px;
              width: 80px;
              padding: 4px 6px;
              margin-right: 4px;
            }
          }
        `}
      </style>

      <nav
        ref={navRef}
        style={{
          display: 'grid',
          gridTemplateColumns: '55px auto 95px',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          zIndex: 1000,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        {/* LOGO */}
        <div style={{ gridColumn: '1 / 2', justifySelf: 'start' }}>
          <Link href="/">
            <Image
              src="/LCfancylogo.png"
              alt="LC Logo"
              width={60}
              height={60}
              style={{ borderRadius: '50%' }}
            />
          </Link>
        </div>

        {/* SCROLLING REPO BUTTONS */}
        <div
          className="scroll-container"
          ref={scrollRef}
          style={{ gridColumn: '2 / 3', alignSelf: 'center' }}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
        >
          <div className="scroll-content">
            {/* FIRST SET OF BUTTONS */}
            <div className="repo-set">
              {mainRepos.map((repo) => {
                const displayName = buttonLabels[repo.name] || repo.name;
                return (
                  <Link
                    href={`/${repo.name}`}
                    key={`first-${repo.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button
                      className="button special"
                      style={{ backgroundColor: repoColors[repo.name] }}
                    >
                      <span>{displayName}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
            {/* SECOND SET OF BUTTONS */}
            <div className="repo-set">
              {mainRepos.map((repo) => {
                const displayName = buttonLabels[repo.name] || repo.name;
                return (
                  <Link
                    href={`/${repo.name}`}
                    key={`second-${repo.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button
                      className="button special"
                      style={{ backgroundColor: repoColors[repo.name] }}
                    >
                      <span>{displayName}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
            {/* THIRD SET OF BUTTONS */}
            <div className="repo-set">
              {mainRepos.map((repo) => {
                const displayName = buttonLabels[repo.name] || repo.name;
                return (
                  <Link
                    href={`/${repo.name}`}
                    key={`third-${repo.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button
                      className="button special"
                      style={{ backgroundColor: repoColors[repo.name] }}
                    >
                      <span>{displayName}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* OTHER PROJECTS DROPDOWN */}
        <div style={{ gridColumn: '3 / 4', justifySelf: 'end', position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Other Projects
          </button>
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '10px',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 1000,
                maxHeight: '70vh', /* dropdown height = 70% of viewport */
                overflowY: 'auto',
              }}
            >
              {otherRepos.map((repo) => (
                <Link
                  href={`/${repo.name}`}
                  key={repo.id}
                  style={{
                    display: 'block',
                    padding: '10px 20px',
                    textDecoration: 'none',
                    color: '#333',
                    borderBottom: '1px solid #ddd',
                  }}
                  onClick={() => setDropdownOpen(false)}
                >
                  {repo.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Spacer to offset content under navbar */}
      <div style={{ paddingTop: `${navHeight}px` }} />
    </>
  );
};

export default NavBar;
