import NavBar from '../../components/NavBar';
import { fetchRepos } from '../../lib/github';
import dynamic from 'next/dynamic';

// In-memory storage for repositories
let cachedRepos = null;

export async function generateStaticParams() {
  const username = 'landonWcummings';

  // Fetch repos only if they are not already cached
  if (!cachedRepos) {
    cachedRepos = await fetchRepos(username); // Fetch all repos
  }

  return cachedRepos.map((repo) => ({
    repo: repo.name, // Each route corresponds to a repo name
  }));
}

async function fetchYouTubeVideoDetails(videoId) {
  const apiKey = 'AIzaSyDssFgGUruZAHD1H-IKEYWOOlHeXmtzmMw'; // Replace with your actual API key
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    return data.items[0].snippet; // Contains title, description, etc.
  }
  return null;
}

async function fetchReadme(owner, repo) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      return atob(data.content); // Decode Base64 content
    }
  } catch (error) {
    console.error(`Error fetching README for ${repo}:`, error);
  }
  return null; // No README found or an error occurred
}

export default async function RepoPage({ params }) {
  const { repo: repoName } = await params; // Await the params to safely access repo

  const username = 'landonWcummings';

  // Fetch repos only if they are not already cached
  if (!cachedRepos) {
    try {
      cachedRepos = await fetchRepos(username); // Fetch repositories
    } catch (error) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1>Error fetching repositories</h1>
          <p>{error.message}</p>
        </div>
      );
    }
  }

  const repo = cachedRepos?.find((r) => r.name === repoName);
  if (!cachedRepos || cachedRepos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Error loading repositories</h1>
        <p>Please try refreshing the page or check your network connection.</p>
      </div>
    );
  }

  if (!repo) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Repository Not Found</h1>
      </div>
    );
  }

  // Fetch README content
  const readmeContent = await fetchReadme(username, repo.name);

  // Dynamic routing to NBodySimulation page
  if (repo.name === 'nbodysimulation') {
    const NBodySimulation = dynamic(() => import('./nbodysimulation'));
    return <NBodySimulation repos={cachedRepos} />;
  }

  if (repo.name === 'imessageanalysisapp') {
    const Imessageanalysisapp = dynamic(() => import('./imessageanalysisapp'));
    return <Imessageanalysisapp repos={cachedRepos} />;
  }

  if (repo.name === 'snakePlusAi-V1-NEAT') {
    const Snakeplusai = dynamic(() => import('./snakeplusai'));
    return <Snakeplusai repos={cachedRepos} />;
  }

  if (repo.name === 'WhartonInvestmentQuant') {
    const Quant = dynamic(() => import('./WhartonInvestmentQuant'));
    return <Quant repos={cachedRepos} />;
  }

  if (repo.name === 'LandonGPT') {
    const Landongpt = dynamic(() => import('./landongpt'));
    return <Landongpt repos={cachedRepos} />;
  }

  if (repo.name === '2048AI') {
    const Game2048 = dynamic(() => import('./2048'));
    return <Game2048 repos={cachedRepos} />;
  }

  if (repo.name === 'Connect4Bot') {
    const Gameconnect4 = dynamic(() => import('./connect4'));
    return <Gameconnect4 repos={cachedRepos} />;
  }

  if (repo.name === 'PokerPilot') {
    // dynamic import ensures this isn’t bundled unless needed
    const PokerPilotPage = dynamic(() => import('./PokerPilot/page'))
    return <PokerPilotPage repos={cachedRepos} />
  }


  const videoDemoLinks = {
    'clashroyalebot': 'https://www.youtube.com/embed/bFXPIAsaGCw?autoplay=1&mute=1',
    'flappy-bird-plus-ai': 'https://www.youtube.com/embed/zO0pvvvpuEU?autoplay=1&mute=1',
    'brawlstarsbot': 'https://www.youtube.com/embed/urdA_M8X0UA?autoplay=1&mute=1',
  };

  const videoLink = videoDemoLinks[repo?.name];
  const videoId = videoLink?.split('/embed/')[1]?.split('?')[0];
  let videoDetails = null;

  if (videoId) {
    videoDetails = await fetchYouTubeVideoDetails(videoId);
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <NavBar repos={cachedRepos} />
      <h1 style={{ fontSize: '3rem', margin: '20px 0' }}>
        <a
          href={`https://github.com/${username}/${repo.name}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: 'rgb(0, 30, 255)' }}
        >
          {repo.name}
        </a>
      </h1>
      <p>{repo.description || 'No description provided.'}</p>

      {readmeContent && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#f9f9f9',
            textAlign: 'left',
            maxWidth: '800px',
            margin: '0 auto',
            overflowX: 'auto',
          }}
        >
          <h3>README</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{readmeContent}</pre>
        </div>
      )}

      {videoLink ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '20px',
          }}
        >
          <iframe
            width="560"
            height="315"
            src={videoLink}
            title={`${repo.name} Video Demo`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ marginBottom: '20px' }}
          ></iframe>

          {videoDetails?.description && (
            <div style={{ fontStyle: 'italic', maxWidth: '700px', textAlign: 'center' }}>
              <h3>Video Description</h3>
              <p>{videoDetails.description}</p>
            </div>
          )}
        </div>
      ) : (
        <p>No video demo available for this repository.</p>
      )}
    </div>
  );
}
