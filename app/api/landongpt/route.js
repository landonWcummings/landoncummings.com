export async function POST(req) {
    try {
      const body = await req.json(); // Parse the incoming JSON
      const { message } = body;
  
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
  
      // Forward the message to the external API
      const externalResponse = await fetch(
        'https://immense-neatly-condor.ngrok-free.app/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
            inference: true,
            ID: 'Landon'
          }),
        }
      );      
      if (!externalResponse.ok) {
        const errorText = await externalResponse.text();
        console.error('External API Error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch from the external API' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
  
      const externalData = await externalResponse.json();
      console.log('External API Response Data:', externalData);
        
      // Return the response back to the client
      return new Response(
        externalData.response || '',
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
      
    } catch (error) {
      console.error('Error Processing Request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  