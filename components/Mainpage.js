'use client';

import { useState } from 'react';
import { marked } from 'marked';

export default function Mainpage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      textAlign: 'center',
      height: '100vh',
      paddingTop: '20px',
    }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          Welcome
        </h1>
      </div>

      {/* Resume Button */}
      <div style={{ marginBottom: '30px' }}>
        <a 
          href="https://docs.google.com/document/d/10n6B0KAU8nGX9PGbnB8PhCj_YijuZEVDpixpRAyo3eQ/edit?tab=t.0" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#007BFF',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '5px',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007BFF'}
        >
          View My Resume
        </a>
      </div>

      {/* Navigation Instruction */}
      <div style={{ fontSize: '1.2rem', marginBottom: '50px' }}>
        <strong>Navigate</strong> to a button above to view a demonstration of one of my major projects.
      </div>

      {/* Nova Section */}
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
  );
}
