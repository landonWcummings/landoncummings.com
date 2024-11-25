'use client';

import React from 'react';
import NavBar from '../../components/NavBar';

export default function IMessageAnalysisApp({ repos }) {
    // Updated array of image URLs with the correct path
    const imageUrls = [
        '/images/intro.png',
        '/images/lifetimeact.png',
        '/images/sentlife.png',
        '/images/24act.png',
        '/images/topgcparticipation.png',
        '/images/topgcbymessages.png',
        '/images/topcontactsdm.png',
        '/images/topcontactinteractions.png',
        '/images/GCanalysis.png',
        '/images/contactanalysis.png',
    ];

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
            {/* Pass repos to NavBar */}
            <NavBar repos={repos} />

            {/* Page Content with Padding for NavBar */}
            <div style={{ paddingTop: '100px', padding: '20px' }}>
                {/* Introduction Section */}
                <section style={{ marginBottom: '20px' }}>
                    <h1>iMessage Analysis App</h1>
                    <p>
                        Discover insights and trends from your iMessage data.
                    </p>
                </section>

                {/* Download Button */}
                <section style={{ marginBottom: '30px' }}>
                    <a
                        href="/downloads/imessageanalysis.dmg"
                        download
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            backgroundColor: '#007BFF',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        Download for Mac (.dmg)
                    </a>
                </section>

                {/* Image Gallery */}
                <section>
                <h2 style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    ⬇️ Visualizations and Features ⬇️
                </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {imageUrls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`Visualization ${index + 1}`}
                                style={{
                                    maxWidth: '100%',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
