"use client";

import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../../components/NavBar'; // Adjust the path as needed

export default function IMessageInterface({ repos }) {
  const [messages, setMessages] = useState([
    { text: 'Hey there!', sender: 'received' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');

  // >>> ADDED FOR AUTO-SCROLL <<<
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesRef = useRef(null);

  useEffect(() => {
    // Detect system dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    // Fetch the README content from the GitHub API
    const fetchReadme = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/landonWcummings/LandonGPT/readme',
          {
            headers: {
              Accept: 'application/vnd.github.v3.raw',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch README');
        }

        const text = await response.text();
        setReadmeContent(text);
      } catch (error) {
        console.error('Error fetching README:', error);
        setReadmeContent('Error: Unable to fetch README.');
      }
    };

    fetchReadme();
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

  // >>> ADDED FOR AUTO-SCROLL <<<
  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = messagesRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 30; // threshold
    setAutoScroll(nearBottom);
  };

  useEffect(() => {
    if (autoScroll && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const sendMessage = async () => {
    if (inputValue.trim() === '') return;

    // Add the sent message to the messages state
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: inputValue, sender: 'sent' },
    ]);

    const userMessage = inputValue; // Save user message
    setInputValue(''); // Clear input field

    try {
      // Send the message to the API
      const response = await fetch('/api/landongpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API response');
      }

      let replyMessage = await response.text(); // Read as plain text

      // Split the reply message on "|" to handle multiple messages
      if (replyMessage.includes("DONE")) {
        // Remove "DONE" from the response
        replyMessage = replyMessage.replace("DONE", "").trim();
      }
      const replyMessages = replyMessage.split('|').map((text) => text.trim());

      // Add each part of the API's response as a separate message
      setMessages((prevMessages) => [
        ...prevMessages,
        ...replyMessages.map((text) => ({ text, sender: 'received' })),
      ]);
    } catch (error) {
      console.error('Error fetching API response:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Error: Unable to process your message.', sender: 'received' },
      ]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar repos={repos} />
      <div style={{ paddingTop: '60px', textAlign: 'center', fontSize: '18px', color: themeStyles.color }}>
        <p>Welcome to the LandonGPT Interface <br></br> This is a large language model trained on the corpus of my iMessages</p>
      </div>
      <div
        style={{
          ...themeStyles,
          width: '360px',
          height: '430px',
          borderRadius: '30px',
          margin: '10px auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            backgroundColor: isDarkMode ? '#007aff' : '#007aff',
            color: '#fff',
            padding: '10px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          Chat with LandonGPT
        </div>

        <div
          ref={messagesRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                maxWidth: '70%',
                padding: '10px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                alignSelf: message.sender === 'sent' ? 'flex-end' : 'flex-start',
                backgroundColor:
                  message.sender === 'sent'
                    ? '#007aff'
                    : isDarkMode
                    ? '#444'
                    : '#e5e5ea',
                color: message.sender === 'sent' ? '#fff' : isDarkMode ? '#fff' : '#000',
              }}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            padding: '10px',
            gap: '10px',
            borderTop: '1px solid #ddd',
            backgroundColor: isDarkMode ? '#2b2b2b' : '#fff',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            // >>> ADDED FOR PRESSING ENTER TO SEND <<<
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '20px',
              border: '1px solid #ddd',
              fontSize: '14px',
              color: "black"
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007aff',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Send
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '16px', color: themeStyles.color, padding: '10px' }}>
        <p>Thank you for visiting the interface! <br></br> NOTE: This model does not know any specific information and is very prone to hallucinating. This model is made to mimic my texting form and tone.<br></br> NOTE: model does not have conversational memory. Every input is treated as a stand alone message. <br></br>Contact me at lndncmmngs@gmail.com if you want your own<br></br>⬇️ Developer notes below ⬇️</p>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', color: themeStyles.color }}>
        <h2>README</h2>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '10px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: isDarkMode ? '#333' : '#f9f9f9' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'left', overflowX: 'auto' }}>
            {readmeContent}
            </pre>
        </div>
      </div>

    </div>
  );
}
