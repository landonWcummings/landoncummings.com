import { fetchRepos } from '../../lib/github';
import LandonGPT2Interface from '../[repo]/landongpt2';

let cachedRepos = null;

export default async function LandonGPTPage() {
  const username = 'landonWcummings';
  if (!cachedRepos) {
    cachedRepos = await fetchRepos(username);
  }

  return <LandonGPT2Interface repos={cachedRepos} />;
}
