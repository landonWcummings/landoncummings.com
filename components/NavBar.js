'use client';

import Link from 'next/link';
import { useState } from 'react';

const NavBar = ({ repos = [] }) => {
    // Define main repos
    const mainRepoNames = [
        'nbodysimulation',
        'flappy-bird-plus-ai',
        'imessageanalysisapp',
        'WhartonInvestmentQuant',
    ];

    // Filter main and other repos
    const mainRepos = repos.filter((repo) => mainRepoNames.includes(repo.name));
    const otherRepos = repos.filter((repo) => !mainRepoNames.includes(repo.name));

    const [isDropdownOpen, setDropdownOpen] = useState(false);

    return (
        <>
            <nav
                style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '80px',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #ddd',
                    zIndex: 1000,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
            >
                {/* LC Home Button */}
                <Link
                    href="/"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        display: 'inline-block',
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#333',
                        textAlign: 'center',
                        borderRadius: '50%',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        overflow: 'hidden', // Ensure the image stays within the circle
                    }}
                >
                    <img
                        src="/LCfancylogo.png"
                        alt="LC Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover', // Ensures the image fills the space properly
                            borderRadius: '50%', // Matches the circular button
                        }}
                    />
                </Link>


                {/* Main Repository Links */}
                <div style={{ display: 'flex', gap: '10px', marginLeft: '80px' }}>
                    {mainRepos.map((repo) => (
                        <Link
                            href={`/${repo.name}`}
                            key={repo.id}
                            style={{
                                display: 'inline-block',
                                width: '150px',
                                height: '40px',
                                backgroundColor: '#f4f4f4',
                                textDecoration: 'none',
                                color: '#333',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                paddingLeft: '10px',
                                lineHeight: '40px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {repo.name}
                        </Link>
                    ))}
                </div>

                {/* Dropdown for Other Repositories */}
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                        style={{
                            backgroundColor: '#333',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                    >
                        Other Repos
                    </button>
                    {isDropdownOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '40px',
                                right: '0',
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

            <div style={{ paddingTop: '80px' }} />
        </>
    );
};

export default NavBar;
