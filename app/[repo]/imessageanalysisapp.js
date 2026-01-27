'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import NavBar from '../../components/NavBar';

export default function IMessageAnalysisApp({ repos }) {
    const imageUrls = [
        '/imessageanalysisimages/intro.png',
        '/imessageanalysisimages/lifetimeact.png',
        '/imessageanalysisimages/sentlife.png',
        '/imessageanalysisimages/24act.png',
        '/imessageanalysisimages/topgcparticipation.png',
        '/imessageanalysisimages/topgcbymessages.png',
        '/imessageanalysisimages/topcontactsdm.png',
        '/imessageanalysisimages/topcontactinteractions.png',
        '/imessageanalysisimages/GCanalysis.png',
        '/imessageanalysisimages/contactanalysis.png',
    ];

    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    useEffect(() => {
        let scrollAnimationFrame;
    
        const autoScroll = () => {
            window.scrollBy(0, 7); // Scroll down by 7px
            scrollAnimationFrame = requestAnimationFrame(autoScroll); // Recursively call autoScroll
        };
    
        if (isAutoScrolling) {
            const delayScroll = setTimeout(() => {
                scrollAnimationFrame = requestAnimationFrame(autoScroll);
            }, 2000); // Wait 3 seconds before starting scrolling
    
            return () => {
                clearTimeout(delayScroll); // Cleanup timeout on unmount
                cancelAnimationFrame(scrollAnimationFrame); // Cleanup animation frame on unmount
            };
        }
    }, [isAutoScrolling]);
    

    useEffect(() => {
        const stopScrolling = () => setIsAutoScrolling(false);

        // Stop scrolling on user interaction
        window.addEventListener('mousedown', stopScrolling);
        window.addEventListener('wheel', stopScrolling);
        window.addEventListener('touchstart', stopScrolling);

        return () => {
            window.removeEventListener('mousedown', stopScrolling);
            window.removeEventListener('wheel', stopScrolling);
            window.removeEventListener('touchstart', stopScrolling);
        };
    }, []);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
            {/* Pass repos to NavBar */}
            <NavBar repos={repos} />

            {/* Page Content with Padding for NavBar */}
            <div style={{ paddingTop: '100px', padding: '20px' }}>
                {/* Introduction Section */}
                <section style={{ marginBottom: '20px' }}>
                    <h1>Imessage Analysis</h1>
                    <p>
                        A macOS app that analyzes your full iMessage history to surface patterns in how and when you
                        communicate. It highlights activity over time, most active hours, top group chats, participation
                        rates, and the contacts you interact with most — plus deeper dives into any selected chat.
                    </p>
                </section>

                {/* Download Button */}
                <section style={{ marginBottom: '30px' }}>
                    <a
                        href="/downloads/Imessage_Analysis_Installer.dmg"
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
                    <h2
                        style={{
                            fontSize: '3rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        ⬇️ Visualizations and Features ⬇️
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {imageUrls.map((url, index) => (
                            <div
                                key={index}
                                style={{ position: 'relative', width: '100%', height: 'auto' }}
                            >
                                <Image
                                    src={url}
                                    alt={`Visualization ${index + 1}`}
                                    layout="responsive"
                                    width={800}
                                    height={600}
                                    style={{
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <p>- shoutout to user #2 for providing example usage</p>
                </section>
            </div>
        </div>
    );
}
