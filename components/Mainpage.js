'use client';

import { useState, useEffect } from 'react';
import ProjectWheel from './ProjectWheel.js';

export default function Mainpage({ repos = [] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const theme = {
    background: isDark ? '#0b1220' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#0f172a',
    subtext: isDark ? '#cbd5f5' : '#475569',
    cardBg: isDark ? '#1f2937' : '#f8f9fa',
    cardBorder: isDark ? 'rgba(148, 163, 184, 0.2)' : '#dee2e6',
    cardHover: isDark ? '#374151' : '#e9ecef',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      textAlign: 'center',
      minHeight: '100vh',
      paddingTop: '20px',
      paddingBottom: '60px',
      background: theme.background,
      color: theme.text,
    }}>
      {/* Hidden SEO Content - Will be indexed but not visible */}
      <div style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px',
        visibility: 'hidden',
        overflow: 'hidden',
        width: '1px',
        height: '1px'
      }}>
        <h1>Landon Cummings - AI Engineer, Machine Learning Developer, Software Engineer Portfolio</h1>
        <p>
          Welcome to the comprehensive portfolio of Landon Cummings, a talented AI engineer and software developer 
          specializing in artificial intelligence, machine learning, physics simulations, and innovative web applications.
          This portfolio showcases cutting-edge projects including n-body gravitational physics simulations, 
          AI-powered game implementations, quantitative finance analysis tools, and advanced data analytics applications.
        </p>
        <h2>Featured AI and Software Development Projects</h2>
        <p>
          Explore interactive demonstrations of advanced software engineering projects including:
          N-Body Physics Simulation with real-time gravitational calculations and visual effects,
          AI Game Collection featuring NEAT algorithm implementation for Snake AI, reinforcement learning for 2048 game,
          Connect4 AI bot with minimax algorithm, Poker strategy analysis tool with probability calculations,
          Quantitative Investment Analysis platform using mathematical models for financial research,
          iMessage Analytics Application with advanced data visualization and conversation analysis,
          Custom GPT Implementation with personalized training and conversational AI capabilities.
        </p>
        <h3>Technical Skills and Technologies</h3>
        <p>
          Landon Cummings demonstrates expertise in Python programming, JavaScript development, React framework,
          Next.js web development, machine learning algorithms, neural network implementation, reinforcement learning,
          computer graphics programming, scientific computing, data science methodologies, quantitative analysis,
          software engineering principles, full-stack web development, algorithm optimization, and AI system design.
        </p>
        <h3>AI and Machine Learning Specializations</h3>
        <p>
          Specialized experience in artificial intelligence including NEAT (NeuroEvolution of Augmenting Topologies) algorithm,
          reinforcement learning for game AI, neural network architectures, deep learning implementations,
          computer vision applications, natural language processing, predictive modeling, and intelligent system design.
          Portfolio demonstrates practical applications of AI in gaming, finance, data analysis, and interactive simulations.
        </p>
        <h3>Interactive Portfolio Navigation</h3>
        <p>
          This website features an innovative project wheel interface allowing visitors to explore various software projects
          through an interactive rotating display. Each project includes detailed demonstrations, technical explanations,
          and live interactive experiences showcasing the depth and breadth of software engineering capabilities.
          Projects range from scientific simulations to practical applications in finance and communication analysis.
        </p>
      </div>
      
      {/* Welcome Section */}
      <div style={{ marginBottom: isMobile ? '30px' : '50px', padding: isMobile ? '0 15px' : '0' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.8rem' : '2.5rem', 
          marginBottom: '20px',
          color: theme.text,
        }}>
          Landon Cummings
        </h1>
        <p style={{ 
          fontSize: isMobile ? '1rem' : '1.2rem', 
          color: theme.subtext, 
          marginTop: '10px' 
        }}>
          AI Engineer & Software Developer
        </p>
      </div>

      {/* Project Wheel Section */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: isMobile ? '40px' : '60px',
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          color: theme.text,
          marginBottom: '40px',
          textAlign: 'center',
          padding: isMobile ? '0 15px' : '0',
        }}>
          Explore My Projects
        </h2>
        <ProjectWheel repos={repos} />
      </div>

      {/* Introduction Section */}
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        marginBottom: isMobile ? '40px' : '60px',
        padding: isMobile ? '0 20px' : '0 40px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          color: theme.subtext,
          lineHeight: '1.8',
        }}>
          Hey, I'm Landon Cummings, a senior at The Westminster Schools in Atlanta, and I'll be attending Duke next year. 
          I play varsity tennis and squash. Outside of sports, I build AI and robotics projects: I intern at Undaunted 
          working on robotic security quadrupeds, compete in global Kaggle ML contests, train AIs to master games like 
          Connect 4 and Clash Royale, have published apps like Poker Pilot Pro, and fine-tune LLMs, including one that 
          writes like me and knows everything about me. Check out my projects above.
        </p>
      </div>

      {/* Content Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        width: '100%',
        maxWidth: '800px',
        padding: '20px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          width: '100%',
          maxWidth: '600px',
        }}>
          <div 
            onClick={() => {
              // Featured projects array matching your navbar
              const featuredProjects = [
                'nbodysimulation',
                'imessageanalysisapp',
                'WhartonInvestmentQuant',
                'snakePlusAi-V1-NEAT',
                'LandonGPT',
                'ai-sandbox',
                '2048AI',
                'Connect4Bot',
                'PokerPilot',
              ];
              const randomProject = featuredProjects[Math.floor(Math.random() * featuredProjects.length)];
              window.location.href = `/${randomProject}`;
            }}
            style={{
              padding: '20px',
              backgroundColor: theme.cardBg,
              borderRadius: '8px',
              border: `1px solid ${theme.cardBorder}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = theme.cardHover;
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = isDark ? '0 4px 8px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = theme.cardBg;
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ color: theme.text, marginBottom: '10px' }}>🚀 Random Project</h3>
            <p style={{ color: theme.subtext, fontSize: '14px' }}>
              Click to explore a random featured project from my portfolio. Discover something new!
            </p>
          </div>
          
          <a 
            href="https://docs.google.com/document/d/1ihujI0lxKJIDJ_z9fOseysUII43JQiTHZuxr9J_VUMo/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              backgroundColor: theme.cardBg,
              borderRadius: '8px',
              border: `1px solid ${theme.cardBorder}`,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = theme.cardHover;
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = isDark ? '0 4px 8px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = theme.cardBg;
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ color: theme.text, marginBottom: '10px' }}>📄 Resume</h3>
            <p style={{ color: theme.subtext, fontSize: '14px' }}>
              View my professional experience, education, and skills in detail.
            </p>
          </a>
        </div>
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
