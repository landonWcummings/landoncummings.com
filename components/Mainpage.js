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
    e.target.style.height = 'auto'; // Reset height to auto to shrink if necessary
    e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`; // Grow only up to 300px
  };

  async function handleGenerateResponse() {
    const apiKey = 'xai-878bgCDzB9QPqT81n407wMaLIxWZsOzshUn9v6ZR5oTw2mAtAh5OU6Itrx2HuKDV88JCKEZCQg1LxmmR';

    const payload = {
      model: 'grok-beta',
      messages: [
        { role: 'system', content: 'You are Grok, a chatbot dedicated to serving the user in the most precise, technical, and conscise manner.' },
        { role: 'user', content: input },
      ],
      stream: true,
      temperature: 0.7,
    };

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorDetails = await res.json();
        throw new Error(`Failed to fetch AI response: ${res.status} - ${errorDetails.message}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const json = line.substring(5).trim();
            if (json === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                const formattedContent = marked.parse(fullResponse); // Convert markdown to HTML dynamically
                setResponse(formattedContent);
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
            }
          }
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      setResponse(`Error: ${error.message}`);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey && input.trim() !== '') {
      event.preventDefault(); // Prevent default Enter behavior
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
      {/* Top Section */}
      <div style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          Welcome to landoncummings.com
        </h1>
        <p style={{ fontSize: '1.2rem' }}>
          Select a repository from the navigation bar to view its details.<br />
          ⬇️  or ask Grok something  ⬇️
        </p>
      </div>

      {/* Centered AI Generation Section */}
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
          onKeyDown={handleKeyPress} // Handle Enter and Shift+Enter
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
            maxHeight: '300px', // Set maximum height
            resize: 'none', // Disable manual resizing
            overflowY: 'auto', // Add scrollbar if content exceeds 300px
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
          {loading ? 'Generating...' : 'Ask xAI\'s Grok'}
        </button>

        {/* Display AI response */}
        {response && (
          <div
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#9a6e83',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxWidth: '1000px',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: response }} // Render formatted HTML
          />
        )}
      </div>
    </div>
  );
}
