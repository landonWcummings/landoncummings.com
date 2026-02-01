// API route to fetch Connect 4 winrates from Supabase
export async function GET() {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_PUBLIC || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Table name: "landoncummings.com Connect 4" (URL encoded for REST API)
    // Table structure: model (difficulty), result (winner: You/Bot/Draw)
    const tableName = encodeURIComponent('landoncummings.com Connect 4');

    // Fetch all game results
    // Using Supabase REST API to get model (difficulty) and result (winner)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?select=model,result`,
      {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase fetch error:', response.status, errorText);
      return Response.json(
        { error: 'Failed to fetch winrates', details: errorText },
        { status: response.status }
      );
    }

    const games = await response.json();

    // Calculate winrates for each difficulty
    const winrates = {
      easy: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
      medium: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
      hard: { total: 0, userWins: 0, botWins: 0, draws: 0, userWinRate: 0 },
    };

    games.forEach((game) => {
      const diff = game.model; // 'model' column contains the difficulty
      const result = game.result ? game.result.toLowerCase() : null; // 'result' column contains: 'human', 'bot', or 'draw'
      
      if (winrates[diff]) {
        winrates[diff].total++;
        if (result === 'human') winrates[diff].userWins++;
        if (result === 'bot') winrates[diff].botWins++;
        if (result === 'draw') winrates[diff].draws++;
      }
    });

    // Calculate win rates (excluding draws from win rate calculation)
    // Ensure no division by zero or invalid values
    Object.keys(winrates).forEach((diff) => {
      const stats = winrates[diff];
      const nonDrawGames = Math.max(0, stats.total - stats.draws);
      stats.userWinRate = nonDrawGames > 0 && !isNaN(nonDrawGames) && !isNaN(stats.userWins)
        ? Math.max(0, Math.min(100, (stats.userWins / nonDrawGames) * 100))
        : 0;
    });

    return Response.json({ winrates });
  } catch (error) {
    console.error('Error fetching winrates:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

