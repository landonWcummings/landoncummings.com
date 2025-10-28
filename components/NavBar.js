'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';

const mainRepoNames = [
  'nbodysimulation', //☄️
  'imessageanalysisapp',//💬
  'WhartonInvestmentQuant', //📈
  'snakePlusAi-V1-NEAT', //🐍
  'LandonGPT', //🪞
  '2048AI', //
  'Connect4Bot', //
  'PokerPilot', //
];
//     
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
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 500;
            width: 140px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
            cursor: pointer;
            overflow: hidden;
            margin-right: 12px;
            white-space: nowrap;
            transition: all 0.3s ease;
          }

          /* GLOWING BORDER EFFECT */
          .button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 8px;
            padding: 2px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }

          /* SHIMMER ANIMATION EFFECT */
          .button::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 50%,
              transparent 100%
            );
            animation: shimmer 3s infinite;
            z-index: 1;
          }

          /* HOVER EFFECTS */
          .button:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            border-color: rgba(102, 126, 234, 0.5);
            color: #ffffff;
          }

          .button:hover::before {
            opacity: 1;
          }

          /* ACTIVE/FOCUS STATE */
          .button:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          .button span {
            position: relative;
            z-index: 2;
          }

          /* SHIMMER ANIMATION */
          @keyframes shimmer {
            0% {
              left: -100%;
            }
            50% {
              left: 100%;
            }
            100% {
              left: 100%;
            }
          }

          /* SCROLL CONTAINER */
          .scroll-container {
            overflow-x: auto;
            width: 100%;
            position: relative;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .scroll-container::-webkit-scrollbar {
            display: none;
          }

          /* SCROLL CONTENT */
          .scroll-content {
            display: flex;
            width: calc(300%);
          }

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
              width: 110px;
              padding: 8px 12px;
              margin-right: 8px;
            }
          }

          @media (max-width: 400px) {
            nav {
              height: auto;
              padding: 5px;
            }
            .scroll-content .button {
              font-size: 10px;
              width: 95px;
              padding: 6px 10px;
              margin-right: 6px;
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
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
          borderBottom: '2px solid rgba(102, 126, 234, 0.3)',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3)',
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
                    <button className="button">
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
                    <button className="button">
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
                    <button className="button">
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
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: '#e0e0e0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(102, 126, 234, 0.5)';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.color = '#e0e0e0';
            }}
          >
            Other Projects
          </button>
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '45px',
                right: '0',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                maxHeight: '70vh',
                overflowY: 'auto',
                minWidth: '200px',
                maxWidth: '300px',
              }}
            >
              {otherRepos.map((repo) => (
                <Link
                  href={`/${repo.name}`}
                  key={repo.id}
                  style={{
                    display: 'block',
                    padding: '12px 20px',
                    textDecoration: 'none',
                    color: '#e0e0e0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setDropdownOpen(false)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                    e.target.style.color = '#ffffff';
                    e.target.style.paddingLeft = '25px';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#e0e0e0';
                    e.target.style.paddingLeft = '20px';
                  }}
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
