// lib/github.js

export async function fetchRepos(username) {
  const token = process.env.GITHUB_TOKEN; // Add your token in an environment variable
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`https://api.github.com/users/${username}/repos`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch repos for user ${username}`);
  }
  const repos = await res.json();
  return repos;
}
