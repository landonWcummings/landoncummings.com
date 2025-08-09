'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import NavBar from '../../components/NavBar.js';
import { fetchRepos } from '../../lib/github';

export default function NovaPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState([]);

  // Fetch repos on component mount
  useEffect(() => {
    const fetchData = async () => {
      const username = 'landonWcummings';
      const repoData = await fetchRepos(username);
      setRepos(repoData);
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Adjust the height of the textarea dynamically
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`;
  };

  async function handleGenerateResponse() {
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const errorDetails = await res.json();
        throw new Error(`Failed to fetch AI response: ${res.status} - ${errorDetails.error}`);
      }

      const responseBody = await res.json();
      console.log("Full Response:", responseBody.fullResponse);

      const content = responseBody.content;

      if (content) {
        const formattedContent = marked.parse(content);
        setResponse(formattedContent);
      } else {
        console.log("No content found in response.");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error during API call:", error);
      setLoading(false);
      setResponse(`Error: ${error.message}`);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey && input.trim() !== '') {
      event.preventDefault();
      handleGenerateResponse();
    }
  }

  return (
    <div>
      <NavBar repos={repos} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        height: '100vh',
        paddingTop: '20px',
      }}>
        {/* Nova Title Section */}
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#333' }}>
            Nova AI
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '20px' }}>
            Ask me anything - I&apos;m here to help!
          </p>
        </div>

        {/* Nova Chat Interface */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          width: '100%',
          maxWidth: '500px',
        }}>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter a prompt..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '10px',
              color: 'blue',
              minHeight: '50px',
              maxHeight: '300px',
              resize: 'none',
              overflowY: 'auto',
            }}
          />
          <button
            onClick={handleGenerateResponse}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Ask Nova'}
          </button>

          {loading && (
            <div style={{
              marginTop: '20px',
              width: '50px',
              height: '50px',
              border: '5px solid #ccc',
              borderTop: '5px solid #333',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          )}

          {response && (
            <div
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxWidth: '1000px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
              }}
              dangerouslySetInnerHTML={{ __html: response }}
            />
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}