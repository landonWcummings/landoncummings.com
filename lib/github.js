// lib/github.js

export async function fetchRepos(username) {
    const res = await fetch(`https://api.github.com/users/${username}/repos`);
    if (!res.ok) {
      throw new Error(`Failed to fetch repos for user ${username}`);
    }
    const repos = await res.json();
    return repos;
  }
