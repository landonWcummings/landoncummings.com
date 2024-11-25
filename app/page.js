// app/page.js
import NavBar from '../components/NavBar.js';
import Mainpage from '../components/Mainpage.js';
import { fetchRepos } from '../lib/github';

export default async function HomePage() {
  const username = 'landonWcummings'; // Replace with your GitHub username
  const repos = await fetchRepos(username);

  return (
    <div>
      <NavBar repos={repos} />
      <Mainpage />
    </div>
  );
}
