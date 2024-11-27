'use client';

import React, { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';

export default function Quant({ repos }) {
  const [repoDescription, setRepoDescription] = useState('');
  const [readmeContent, setReadmeContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchRepoData = async () => {
      const username = 'landonWcummings'; // Replace with actual GitHub username
      const repoName = 'WhartonInvestmentQuant';

      try {
        // Fetch repo description
        const repoResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
        const repoData = await repoResponse.json();
        setRepoDescription(repoData.description || 'No description provided.');

        // Fetch README content
        const readmeResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/readme`, {
          headers: { Accept: 'application/vnd.github.v3.raw' }, // Fetch raw README content
        });
        const readmeText = await readmeResponse.text();
        setReadmeContent(readmeText || 'No README available.');
      } catch (error) {
        console.error('Error fetching repo data:', error);
      }
    };

    fetchRepoData();

    // Detect system dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const themeStyles = isDarkMode
    ? {
        backgroundColor: '#2b2b2b',
        color: '#e0e0e0',
        border: '1px solid #444',
      }
    : {
        backgroundColor: '#f9f9f9',
        color: '#000',
        border: '1px solid #ccc',
      };

  return (
    <div>
      <NavBar repos={repos} />
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Wharton Investment Quant</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{repoDescription}</p>

        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '20px',
          }}
          onClick={() => window.open('https://www.kaggle.com/datasets/landoncummings1/historical-stock-data-on-2000-stocks-ta-to-2025/data', '_blank')} // Replace <DATA_URL> with the actual data link
        >
          View Stock Data Collected 
          
        </button>
        <p>Try it for Yourself</p>
      </div>

      {readmeContent && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '5px',
            textAlign: 'left',
            maxWidth: '800px',
            margin: '0 auto',
            overflowX: 'auto',
            ...themeStyles,
          }}
        >
          <h3>README</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: themeStyles.color }}>
            {readmeContent}
          </pre>
        </div>
      )}
    </div>
  );
}
