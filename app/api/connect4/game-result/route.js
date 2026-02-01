// API route to save Connect 4 game results to Supabase
export async function POST(request) {
  try {
    const body = await request.json();
    const { difficulty, winner, userId } = body;

    // Validate input
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return Response.json(
        { error: 'Invalid difficulty. Must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    if (!winner || !['human', 'bot', 'draw'].includes(winner.toLowerCase())) {
      return Response.json(
        { error: 'Invalid winner. Must be human, bot, or draw' },
        { status: 400 }
      );
    }

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

    // Insert game result into Supabase
    // Table name: "landoncummings.com Connect 4" (URL encoded for REST API)
    // Table structure: model (difficulty), result (winner), ip (optional)
    const tableName = encodeURIComponent('landoncummings.com Connect 4');
    
    // Get client IP if available (for rate limiting)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || null);
    
    // Rate limiting: Check if IP has submitted more than 3 times in the last hour
    if (clientIp) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      // Supabase REST API filter format: column=operator.value
      const encodedIp = encodeURIComponent(clientIp);
      const encodedTime = encodeURIComponent(oneHourAgo);
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/${tableName}?ip=eq.${encodedIp}&created_at=gte.${encodedTime}&select=id`,
        {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'count=exact',
          },
        }
      );
      
      if (checkResponse.ok) {
        const countHeader = checkResponse.headers.get('content-range');
        if (countHeader) {
          // Parse content-range header: format is "0-9/100" or "*/*" for empty
          const match = countHeader.match(/\/(\d+)$/);
          const count = match ? parseInt(match[1], 10) : 0;
          if (count >= 3) {
            return Response.json(
              { error: 'Rate limit exceeded. Maximum 3 games per hour per IP.' },
              { status: 429 }
            );
          }
        }
      }
    }
    
    // Normalize winner to lowercase
    const normalizedWinner = winner.toLowerCase();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        model: difficulty, // Store difficulty in 'model' column
        result: normalizedWinner, // Store winner in 'result' column (human/bot/draw)
        ip: clientIp,     // Store IP if available
        // created_at will be set automatically by the database default
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', response.status, errorText);
      return Response.json(
        { error: 'Failed to save game result', details: errorText },
        { status: response.status }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving game result:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

