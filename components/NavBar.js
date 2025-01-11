'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';

const NavBar = ({ repos = [] }) => {
    const mainRepoNames = useMemo(() => [
        'nbodysimulation',
        'imessageanalysisapp',
        'WhartonInvestmentQuant',
        'snakePlusAi-V1-NEAT',
        'LandonGPT',
    ], []);

    const buttonLabels = {
        nbodysimulation: 'N-Body Simulation',
        imessageanalysisapp: 'iMessage Analysis App',
        WhartonInvestmentQuant: 'Wharton Quant',
        'snakePlusAi-V1-NEAT': 'Snake AI',
        'LandonGPT': 'LandonGPT',
    };

    const [buttonStyles, setButtonStyles] = useState({});
    const navRef = useRef(null); // Reference for navbar
    const [navHeight, setNavHeight] = useState(100); // Default navbar height
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const [clickedStates, setClickedStates] = useState({
        imessageclicked: false,
        landongptclicked: false,
        snakeclicked: false,
    });

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

    useEffect(() => {
        const generateLightColorStyle = () => {
            const hue = Math.floor(Math.random() * 360); // Random hue
            const baseColor = `hsl(${hue}, 80%, 85%)`; // Light color
            const borderColor = `hsl(${hue}, 80%, 50%)`; // Darker shade for border

            return {
                backgroundColor: baseColor,
                color: '#333',
                border: `2px solid ${borderColor}`,
                boxShadow: `0 2px 10px ${baseColor}`,
            };
        };

        const styles = {};
        mainRepoNames.forEach((name) => {
            if (
                (name === 'imessageanalysisapp' && !clickedStates.imessageclicked) ||
                (name === 'LandonGPT' && !clickedStates.landongptclicked) ||
                (name === 'snakePlusAi-V1-NEAT' && !clickedStates.snakeclicked)
            ) {
                const hue = Math.floor(Math.random() * 360); // Generate a random hue
                const backgroundColor = `hsl(${hue}, 80%, 60%)`; // Bright color
                const borderColor = `hsl(${hue}, 80%, 50%)`; // Slightly darker border color
                const randomDelay = `${(Math.random() * 2.5).toFixed(2)}s`; // Random delay between 0-2.5 seconds

                styles[name] = {
                    backgroundColor,
                    color: '#fff',
                    fontWeight: 'bold',
                    border: `6px solid ${borderColor}`,
                    boxShadow: `0 0 20px ${backgroundColor}, 0 0 30px ${backgroundColor}`, // Glow matches the button color
                    animation: `pulse 3s infinite ease-in-out`,
                    animationDelay: randomDelay, // Add random delay
                    transform: 'scale(1.09)',
                };
            } else {
                styles[name] = generateLightColorStyle();
            }
        });

        setButtonStyles(styles);
    }, [mainRepoNames, clickedStates]);

    const handleClick = (repoName) => {
        setClickedStates((prevStates) => ({
            ...prevStates,
            [`${repoName}clicked`]: true,
        }));
    };

    const mainRepos = repos.filter((repo) => mainRepoNames.includes(repo.name));
    const otherRepos = repos.filter((repo) => !mainRepoNames.includes(repo.name));

    return (
        <>
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            transform: scale(1.1);
                            box-shadow: 0 0 20px #F50057, 0 0 30px #FF4081;
                        }
                        50% {
                            transform: scale(1.2);
                            box-shadow: 0 0 30px #FF4081, 0 0 40px #F50057;
                        }
                        100% {
                            transform: scale(1.1);
                            box-shadow: 0 0 20px #F50057, 0 0 30px #FF4081;
                        }
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
                        const style = buttonStyles[repo.name] || {};

                        return (
                            <Link
                                href={`/${repo.name}`}
                                key={repo.id}
                                onClick={() => handleClick(repo.name)}
                                style={{
                                    display: 'inline-block',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    padding: '10px 15px',
                                    fontSize: '14px',
                                    width: '140px',
                                    ...style,
                                }}
                            >
                                {displayName}
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

            {/* Adjust padding dynamically based on navbar height */}
            <div style={{ paddingTop: `${navHeight}px` }} />
        </>
    );
};

export default NavBar;
