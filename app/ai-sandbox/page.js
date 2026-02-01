import { fetchRepos } from '../../lib/github';
import AISandboxClient from './AISandboxClient';

let cachedRepos = null;

export default async function AISandboxPage() {
  const username = 'landonWcummings';
  if (!cachedRepos) {
    cachedRepos = await fetchRepos(username);
  }

  return <AISandboxClient repos={cachedRepos} />;
}

