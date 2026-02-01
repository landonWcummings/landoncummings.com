"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import NavBar from '../../components/NavBar';

export default function LandonGPT2Interface({ repos }) {
  const [messages, setMessages] = useState([
    { text: 'I’m LandonGPT 2.0. Ask me about my life, projects, or interests.', sender: 'received' },
  ]);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  });
  const suggestedPrompts = useMemo(
    () => [
      'Tell me about your job.',
      'Tell me about a book you read recently.',
      'Write me a college essay on what you want to do with your life (250 words).',
      'Tomorrow you have infinite time and resources. What do you do?',
      'What do you want to do with your life?',
    ],
    []
  );
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const wheelRef = useRef(null);
  const [wheelFontSize, setWheelFontSize] = useState(15);

  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePromptCycle = () => {
    setPlaceholderIdx((prev) => (prev + 1) % suggestedPrompts.length);
  };

  const hasChatted = history.length > 0;

  useEffect(() => {
    if (!wheelRef.current) return;
      const baseFont = 15;
      const minFont = 10;

    const measure = () => {
      const container = wheelRef.current;
      if (!container) return;
      const maxWidth = container.clientWidth;
      if (!maxWidth) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = `${baseFont}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;

      const longest = suggestedPrompts.reduce((a, b) => (a.length >= b.length ? a : b), '');
      const measured = ctx.measureText(longest).width || 1;
      const scale = Math.min(1, maxWidth / measured);
      const nextSize = Math.max(minFont, Math.floor(baseFont * scale));
      setWheelFontSize(nextSize);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wheelRef.current);
    return () => observer.disconnect();
  }, [suggestedPrompts]);

  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = messagesRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(nearBottom);
  };

  useEffect(() => {
    if (autoScroll && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const sendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Add user message
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userMessage, sender: 'sent' },
    ]);

    try {
      const isFirstTurn = history.length === 0;
      const response = await fetch('/api/landongpt2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history,
          isFirstTurn,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch API response');
      }

      let replyMessage = await response.text();

      if (replyMessage.includes("DONE")) {
        replyMessage = replyMessage.replace("DONE", "").trim();
      }

      // Add single response message (preserve markdown + line breaks)
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: replyMessage, sender: 'received' },
      ]);
      setHistory((prevHistory) => [
        ...prevHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: replyMessage },
      ]);
    } catch (error) {
      console.error('Error fetching API response:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          text: `Oops! There was an error: ${error.message}. Make sure XAI_API_KEY is set in Vercel environment variables.`, 
          sender: 'received' 
        },
      ]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const startNewChat = () => {
    if (isLoading) return;
    setMessages([
      { text: 'I’m LandonGPT 2.0. Ask me about my life, projects, or interests.', sender: 'received' },
    ]);
    setHistory([]);
    setInputValue('');
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setSessionId(crypto.randomUUID());
    }
  };

  const themeStyles = isDarkMode
    ? {
        backgroundColor: '#1f1f1f',
        color: '#e6e6e6',
        border: '1px solid #2f2f2f',
      }
    : {
        backgroundColor: '#ffffff',
        color: '#0f0f0f',
        border: '1px solid #e5e5e5',
      };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @keyframes loadingPulse {
          0% { opacity: 0.35; }
          50% { opacity: 1; }
          100% { opacity: 0.35; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes promptWheel {
          0% { transform: translateY(60%); opacity: 0; }
          15% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-60%); opacity: 0; }
        }
      `}</style>
      <NavBar repos={repos} />
      <div style={{ 
        paddingTop: isMobile ? '90px' : '70px', 
        textAlign: 'center', 
        color: themeStyles.color,
        paddingLeft: isMobile ? '10px' : '0',
        paddingRight: isMobile ? '10px' : '0',
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '24px' : '32px', 
          margin: '10px 0', 
          color: isDarkMode ? '#ffffff' : '#111827' 
        }}>
          LandonGPT 2.0
        </h1>
        <p style={{ 
          fontSize: isMobile ? '14px' : '16px', 
          margin: '0 0 20px 0', 
          color: isDarkMode ? '#b0b0b0' : '#555' 
        }}>
          A fast, clean chat trained on my writing style.
        </p>
      </div>
      <div
        style={{
          ...themeStyles,
          backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
          width: isMobile ? '100%' : 'min(1100px, 92vw)',
          minHeight: '70vh',
          borderRadius: isMobile ? '0' : '16px',
          margin: isMobile ? '0' : '0 auto 30px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isMobile ? 'none' : (isDarkMode
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 12px 24px rgba(0, 0, 0, 0.08)'),
        }}
      >

        <div
          ref={messagesRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px 12px' : '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '14px',
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                maxWidth: isMobile ? '85%' : '72%',
                padding: isMobile ? '8px 12px' : '12px 18px',
                borderRadius: isMobile ? '16px' : '18px',
                fontSize: isMobile ? '14px' : '16px',
                lineHeight: isMobile ? '1.35' : '1.4',
                overflowWrap: 'anywhere',
                alignSelf: message.sender === 'sent' ? 'flex-end' : 'flex-start',
                backgroundColor:
                  message.sender === 'sent'
                    ? '#007aff'
                    : isDarkMode
                    ? '#3a3a3a'
                    : '#e9eaec',
                color: message.sender === 'sent' ? '#fff' : isDarkMode ? '#fff' : '#000',
              }}
            >
              {message.sender === 'received' ? (
                <div
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: marked.parse(message.text || '') }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
              )}
            </div>
          ))}
          {isLoading && (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: isMobile ? '8px 12px' : '12px 18px',
                borderRadius: isMobile ? '16px' : '18px',
                backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0',
                color: isDarkMode ? '#fff' : '#000',
                fontSize: isMobile ? '14px' : '16px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  background: isDarkMode
                    ? 'linear-gradient(90deg, #9ca3af, #ffffff, #9ca3af)'
                    : 'linear-gradient(90deg, #6b7280, #111827, #6b7280)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 1.6s ease-in-out infinite, loadingPulse 1.2s ease-in-out infinite',
                }}
              >
                Loading Model
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '12px' : '16px',
            gap: isMobile ? '10px' : '12px',
            borderTop: isDarkMode ? '1px solid #2f2f2f' : '1px solid #e5e5e5',
            backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: isMobile ? '12px' : '14px',
                right: isMobile ? '12px' : '14px',
                top: isMobile ? '10px' : '12px',
                height: isMobile ? '24px' : '28px',
                overflow: 'hidden',
                display: inputValue || hasChatted ? 'none' : 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                pointerEvents: 'none',
                color: isDarkMode ? '#2b2f36' : '#111827',
                fontSize: `${wheelFontSize}px`,
                letterSpacing: '0.2px',
                maxWidth: '100%',
              }}
              ref={wheelRef}
            >
              <span
                key={placeholderIdx}
                style={{
                  animation: 'promptWheel 5s ease-in-out infinite',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onAnimationIteration={handlePromptCycle}
              >
                {suggestedPrompts[placeholderIdx]}
              </span>
            </div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              list="landongpt2-suggestions"
              placeholder={
                isLoading
                  ? "Waiting for response..."
                  : hasChatted
                  ? "Anything else?"
                  : ""
              }
              disabled={isLoading}
              suppressHydrationWarning
              rows={2}
              style={{
                width: '100%',
                padding: isMobile ? '10px 12px' : '12px 14px',
                borderRadius: isMobile ? '10px' : '12px',
                border: isDarkMode ? '1px solid #2f2f2f' : '1px solid #e5e5e5',
                fontSize: isMobile ? '14px' : '16px',
                color: "black",
                backgroundColor: isDarkMode ? '#f2f2f2' : '#ffffff',
                opacity: isLoading ? 0.6 : 1,
                resize: 'vertical',
                minHeight: isMobile ? '44px' : '48px',
                maxHeight: '160px',
                lineHeight: 1.4,
              }}
            />
          </div>
          <datalist id="landongpt2-suggestions">
            {suggestedPrompts.map((prompt) => (
              <option key={prompt} value={prompt} />
            ))}
          </datalist>
          {isMobile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={isLoading}
                  suppressHydrationWarning
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#007aff',
                    color: '#fff',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                  }}
                >
                  New Chat
                </button>
                <button
                  onClick={sendMessage}
                  disabled={isLoading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: isLoading ? '#999' : '#007aff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    flex: '0 0 auto',
                  }}
                >
                  Send
                </button>
              </div>
              <div style={{ 
                textAlign: 'center', 
                fontSize: '11px', 
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                lineHeight: '1.4',
                paddingTop: '4px',
              }}>
                Interested in a custom model? Email landoncummings@gmail.com
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
              <button
                type="button"
                onClick={startNewChat}
                disabled={isLoading}
                suppressHydrationWarning
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#007aff',
                  color: '#fff',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                New Chat
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: isDarkMode ? '#d6d6d6' : '#1f2937' }}>
                Interested in a custom model? Email landoncummings@gmail.com.
              </div>
              <button
                onClick={sendMessage}
                disabled={isLoading}
                style={{
                  padding: '12px 18px',
                  backgroundColor: isLoading ? '#999' : '#007aff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

