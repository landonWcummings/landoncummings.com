'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const mainRepoNames = [
  'nbodysimulation', //☄️
  'imessageanalysisapp',//💬
  'WhartonInvestmentQuant', //📈
  'snakePlusAi-V1-NEAT', //🐍
  '2048AI', //
  'Connect4Bot', //
  'PokerPilot', //
];
const staticProjects = [
  { slug: 'landonGPT', label: 'LandonGPT 2' },
  { slug: 'ai-sandbox', label: 'AI Sandbox' },
];
//     
const buttonLabels = {
  nbodysimulation: 'N-Body Simulation',
  imessageanalysisapp: 'Imessage Analysis',
  WhartonInvestmentQuant: 'Wharton Quant',
  'snakePlusAi-V1-NEAT': 'Snake AI',
  '2048AI': '2048 AI',
  Connect4Bot: 'Connect4 Bot',
  PokerPilot: 'PokerPilot',
};

const NavBar = ({ repos = [] }) => {
  const navRef = useRef(null);
  const pathname = usePathname();

  const [navHeight, setNavHeight] = useState(100);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Update navbar height on resize
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        // Use getBoundingClientRect for more accurate measurement including padding
        const rect = navRef.current.getBoundingClientRect();
        const height = rect.height;
        setNavHeight(Math.ceil(height));
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateNavHeight, 0);
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateNavHeight);
    };
  }, []);

  // Filter repos into main and other
  const mainRepos = useMemo(
    () => repos.filter((repo) => mainRepoNames.includes(repo.name)),
    [repos]
  );
  const otherRepos = useMemo(
    () => repos.filter((repo) => !mainRepoNames.includes(repo.name) && repo.name !== 'LandonGPT'),
    [repos]
  );
  const mainButtons = useMemo(() => {
    const repoButtons = mainRepos.map((repo) => ({
      key: `repo-${repo.id}`,
      href: `/${repo.name}`,
      label: buttonLabels[repo.name] || repo.name,
    }));
    const staticButtons = staticProjects.map((project) => ({
      key: `static-${project.slug}`,
      href: `/${project.slug}`,
      label: project.label,
    }));
    return [...repoButtons, ...staticButtons];
  }, [mainRepos]);
  const expandedButtons = useMemo(() => {
    const repeats = Math.max(10, Math.ceil(30 / Math.max(mainButtons.length, 1)));
    const list = [];
    for (let i = 0; i < repeats; i += 1) {
      list.push(...mainButtons.map((btn) => ({ ...btn, key: `${btn.key}-${i}` })));
    }
    return list;
  }, [mainButtons]);

  // Mobile projects - 6 main projects in 2x3 grid
  const mobileProjects = [
    { slug: 'landonGPT', label: 'LandonGPT', emoji: '🤖' },
    { slug: 'snakePlusAi-V1-NEAT', label: 'Snake AI', emoji: '🐍' },
    { slug: '2048AI', label: '2048 AI', emoji: '🎯' },
    { slug: 'ai-sandbox', label: 'AI Sandbox', emoji: '🧪' },
    { slug: 'Connect4Bot', label: 'Connect4', emoji: '🔴' },
    { slug: 'PokerPilot', label: 'PokerPilot', emoji: '🃏' },
  ];

  // Simplified navbar for all screen sizes
  return (
    <>
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
          borderBottom: '2px solid rgba(102, 126, 234, 0.3)',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3)',
          padding: '12px',
        }}
      >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            alignItems: 'center',
            gap: '10px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}>
            {/* Home button on left */}
            <div>
              <Link 
                href="/" 
                style={{ 
                  textDecoration: 'none',
                  padding: '8px 10px',
                  fontSize: '18px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: pathname === '/'
                    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  boxShadow: pathname === '/'
                    ? '0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  color: pathname === '/' ? '#ffffff' : '#e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  minWidth: '40px',
                  textAlign: 'center',
                  display: 'block',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/') {
                    e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/') {
                    e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = '#e0e0e0';
                  }
                }}
                onTouchStart={(e) => {
                  e.target.style.opacity = '0.8';
                }}
                onTouchEnd={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                🏠
              </Link>
            </div>

            {/* Project grid in middle */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {mobileProjects.map((project) => {
                const isActive = pathname === `/${project.slug}`;
                const baseStyle = {
                  textDecoration: 'none',
                  width: '100%',
                  padding: '10px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: isActive 
                    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  boxShadow: isActive
                    ? '0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#ffffff' : '#e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  display: 'block',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                };
                
                return (
                  <Link
                    href={`/${project.slug}`}
                    key={project.slug}
                    style={baseStyle}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                        e.target.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                        e.target.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.color = '#e0e0e0';
                      }
                    }}
                    onTouchStart={(e) => {
                      e.target.style.opacity = '0.8';
                    }}
                    onTouchEnd={(e) => {
                      e.target.style.opacity = '1';
                    }}
                  >
                    {project.emoji} {project.label}
                  </Link>
                );
              })}
            </div>

            {/* Others button on right */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                suppressHydrationWarning
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  minWidth: '40px',
                  textAlign: 'center',
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
                ☰
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
          </div>
        </nav>
        <div style={{ paddingTop: `${navHeight}px` }} suppressHydrationWarning />
      </>
    );
};

export default NavBar;
