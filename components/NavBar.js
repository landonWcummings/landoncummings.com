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
];

const specialRepoNames = ['imessageanalysisapp', 'LandonGPT', 'snakePlusAi-V1-NEAT', '2048AI'];

const buttonLabels = {
    nbodysimulation: 'N-Body Simulation',
    imessageanalysisapp: 'iMessage Analysis App',
    WhartonInvestmentQuant: 'Wharton Quant',
    'snakePlusAi-V1-NEAT': 'Snake AI',
    'LandonGPT': 'LandonGPT',
    '2048AI': '2048 AI',
    'Connect4Bot' : 'Connect4 Bot',
};

const NavBar = ({ repos = [] }) => {
    const navRef = useRef(null);
    const [navHeight, setNavHeight] = useState(100); // Default navbar height
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [nonSpecialColors, setNonSpecialColors] = useState({});
    const [specialColors, setSpecialColors] = useState({}); // Store special button colors

    const generateLightColor = () => {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 75; // Fixed saturation
        const lightness = 65 + Math.random() * 20; // Ensure it's light
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    useEffect(() => {
        // Assign random colors to special buttons
        const newSpecialColors = specialRepoNames.reduce((acc, name) => {
            acc[name] = generateLightColor();
            return acc;
        }, {});
        setSpecialColors(newSpecialColors);

        // Assign deterministic colors to non-special buttons
        const newNonSpecialColors = mainRepoNames
            .filter((name) => !specialRepoNames.includes(name))
            .reduce((acc, name) => {
                acc[name] = generateLightColor();
                return acc;
            }, {});
        setNonSpecialColors(newNonSpecialColors);
    }, []); // Run only once after mounting

    useEffect(() => {
        const updateNavHeight = () => {
            if (navRef.current) {
                setNavHeight(navRef.current.offsetHeight); // Update height dynamically
            }
        };

        updateNavHeight(); // Initial height calculation
        window.addEventListener('resize', updateNavHeight); // Update height on resize

        return () => {
            window.removeEventListener('resize', updateNavHeight); // Cleanup on unmount
        };
    }, []);

    const mainRepos = useMemo(() => repos.filter((repo) => mainRepoNames.includes(repo.name)), [repos]);
    const otherRepos = useMemo(() => repos.filter((repo) => !mainRepoNames.includes(repo.name)), [repos]);

    return (
        <>
            <style>
                {`
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
                    }

                    .button.special {
                        position: relative;
                        overflow: hidden;
                    }

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
                        opacity: 0.7; /* Ensure it doesn't overpower the button */
                    }

                    .button span {
                        position: relative;
                        z-index: 2; /* Ensure text is above all effects */
                    }

                    @media (max-width: 600px) {
                        nav {
                            height: auto;
                            padding: 10px;
                        }
                        nav a {
                            font-size: 11px;
                            width: 90px;
                            padding: 6px 8px;
                        }
                        button {
                            font-size: 11px;
                            padding: 6px 12px;
                        }
                    }

                    @media (max-width: 400px) {
                        nav {
                            height: auto;
                            padding: 5px;
                        }
                        nav a {
                            font-size: 10px;
                            width: 80px;
                            padding: 4px 6px;
                        }
                        button {
                            font-size: 10px;
                            padding: 4px 10px;
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

                <div
                    style={{
                        gridColumn: '2 / 3',
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {mainRepos.map((repo) => {
                        const displayName = buttonLabels[repo.name] || repo.name;
                        const isSpecial = specialRepoNames.includes(repo.name);

                        return (
                            <Link
                                href={`/${repo.name}`}
                                key={repo.id}
                                style={{
                                    textDecoration: 'none',
                                }}
                            >
                                <button
                                    className={`button ${isSpecial ? 'special' : ''}`}
                                    style={
                                        isSpecial
                                            ? { backgroundColor: specialColors[repo.name] }
                                            : {
                                                  backgroundColor: nonSpecialColors[repo.name],
                                                  border: `2px solid ${nonSpecialColors[repo.name]}`,
                                              }
                                    }
                                >
                                    <span>{displayName}</span>
                                </button>
                            </Link>
                        );
                    })}
                </div>

                <div style={{ gridColumn: '3 / 4', justifySelf: 'end' }}>
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

            <div style={{ paddingTop: `${navHeight}px` }} />
        </>
    );
};

export default NavBar;
