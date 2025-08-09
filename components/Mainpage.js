'use client';

import ProjectWheel from './ProjectWheel.js';

export default function Mainpage({ repos = [] }) {

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

      {/* Project Wheel Section - Moved up */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '60px',
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: '#333',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          Explore My Projects
        </h2>
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          textAlign: 'center',
          marginBottom: '40px',
          maxWidth: '600px',
          lineHeight: '1.5',
        }}>
          Discover my portfolio through this interactive wheel. Hover to pause rotation, click any project to dive deeper into the details.
        </p>
        <ProjectWheel repos={repos} />
      </div>

      {/* Navigation Instruction */}
      <div style={{ fontSize: '1.2rem', marginBottom: '50px' }}>
        <strong>Navigate</strong> to a button above to view a demonstration of one of my major projects.
      </div>

      {/* Content Section - Moved below wheel */}
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
          fontSize: '1.4rem', 
          color: '#555', 
          textAlign: 'center',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}>
          <p>Welcome to my portfolio website! Here you can explore my various projects and see what I&apos;ve been working on.</p>
          <p>Use the navigation above to browse through my different projects, or check out my resume for a comprehensive overview of my experience.</p>
        </div>
        
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
                '2048AI',
                'Connect4Bot',
                'PokerPilot'
              ];
              const randomProject = featuredProjects[Math.floor(Math.random() * featuredProjects.length)];
              window.location.href = `/${randomProject}`;
            }}
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: '#e9ecef',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ color: '#333', marginBottom: '10px' }}>🚀 Random Project</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Click to explore a random featured project from my portfolio. Discover something new!
            </p>
          </div>
          
          <a 
            href="https://docs.google.com/document/d/10n6B0KAU8nGX9PGbnB8PhCj_YijuZEVDpixpRAyo3eQ/edit?tab=t.0"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ color: '#333', marginBottom: '10px' }}>📄 Resume</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
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
