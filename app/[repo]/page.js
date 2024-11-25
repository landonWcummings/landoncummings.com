import NavBar from '../../components/NavBar';
import { fetchRepos } from '../../lib/github';
import dynamic from 'next/dynamic';

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

export default async function RepoPage({ params }) {
  const username = 'landonWcummings';
  const repos = await fetchRepos(username);
  const repo = repos.find((r) => r.name === params.repo);

  if (!repo) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <NavBar repos={repos} />
        <h1>Repository Not Found</h1>
      </div>
    );
  }

  // Dynamic routing to NBodySimulation page
  if (repo.name === 'nbodysimulation') {
    const NBodySimulation = dynamic(() => import('./nbodysimulation'));
    return <NBodySimulation repos={repos} />;
  }

  if (repo.name === 'imessageanalysisapp') {
    const Imessageanalysisapp = dynamic(() => import('./imessageanalysisapp'));
    return <Imessageanalysisapp repos={repos} />;
  }

  const videoDemoLinks = {
    clashroyalebot: 'https://www.youtube.com/embed/bFXPIAsaGCw?autoplay=1&mute=1',
    'flappy-bird-plus-ai': 'https://www.youtube.com/embed/zO0pvvvpuEU?autoplay=1&mute=1',
  };

  const videoLink = videoDemoLinks[repo?.name];
  const videoId = videoLink?.split('/embed/')[1]?.split('?')[0];
  let videoDetails = null;

  if (videoId) {
    videoDetails = await fetchYouTubeVideoDetails(videoId);
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <NavBar repos={repos} />
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
