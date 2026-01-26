import { readFileSync } from 'fs';
import { join } from 'path';

// Constants
const EMBED_MODEL = 'text-embedding-3-small';
const MAX_EXAMPLES = 6;
const MODEL_FAST = 'grok-4-1-fast-non-reasoning';
const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

// Cache for embeddings and data
let embeddingsCache = null;
let dataCache = null;
let systemPromptCache = null;

// Load embeddings from JSON file
function loadEmbeddings() {
  if (embeddingsCache) return embeddingsCache;
  
  try {
    const embeddingsPath = join(process.cwd(), 'app', 'api', 'landongpt2', 'embeddings.json');
    const embeddingsData = JSON.parse(readFileSync(embeddingsPath, 'utf-8'));
    embeddingsCache = {
      ids: embeddingsData.ids,
      embeddings: embeddingsData.embeddings,
      dimension: embeddingsData.dimension || 768
    };
    return embeddingsCache;
  } catch (error) {
    console.error('Error loading embeddings:', error);
    return null;
  }
}

// Load data from TSV file
function loadData() {
  if (dataCache) return dataCache;
  
  try {
    const dataPath = join(process.cwd(), 'app', 'api', 'landongpt2', 'data.txt');
    const dataContent = readFileSync(dataPath, 'utf-8');
    const lines = dataContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split('\t').map((h) => h.trim());
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t').map((v) => v.replace(/\r$/, ''));
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
    }
    
    dataCache = rows;
    return dataCache;
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
}

// Load system prompt
function loadSystemPrompt() {
  if (systemPromptCache) return systemPromptCache;
  
  try {
    const promptPath = join(process.cwd(), 'app', 'api', 'landongpt2', 'chatbot_context', 'system_prompt.txt');
    systemPromptCache = readFileSync(promptPath, 'utf-8').trim();
    return systemPromptCache;
  } catch (error) {
    console.error('Error loading system prompt:', error);
    return `You are LandonGPT, a chatbot that answers questions about Landon Cummings.
Use ONLY the provided context snippets as the source of truth.
If the answer is not in the context, say you are not sure.`;
  }
}

// Get embedding using OpenAI embeddings API
async function getEmbedding(text) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text,
      }),
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }
    
    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Invalid embedding format from OpenAI API');
    }
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Normalize embeddings (L2 normalization)
function normalizeEmbedding(embedding) {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct; // Already normalized, so dot product = cosine similarity
}

// Find similar examples using embeddings
function selectExamplesByEmbedding(rows, userPrompt, queryEmbedding, maxExamples) {
  const embeddingsData = loadEmbeddings();
  if (!embeddingsData) return [];
  
  const { ids, embeddings } = embeddingsData;
  const rowById = {};
  rows.forEach(row => {
    const id = row.ID || row['ID'];
    if (id) rowById[id] = row;
  });
  
  // Normalize query embedding
  const normalizedQuery = normalizeEmbedding(queryEmbedding);
  
  // Calculate similarities
  const similarities = embeddings.map((emb, idx) => {
    const normalizedEmb = normalizeEmbedding(emb);
    const similarity = cosineSimilarity(normalizedQuery, normalizedEmb);
    return { idx, similarity, id: ids[idx] };
  });
  
  // Sort by similarity (descending)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Select top examples
  const selected = [];
  for (const { id } of similarities) {
    const row = rowById[id];
    if (row && !selected.find(r => r.ID === id)) {
      selected.push(row);
      if (selected.length >= maxExamples) break;
    }
  }
  
  return selected;
}

// Build context prompt
function buildContextPrompt(userPrompt, examples) {
  const parts = ['Here are examples of my writing:\n'];
  
  examples.forEach((ex, idx) => {
    const prompt = ex.PROMPT || ex['PROMPT'] || ex.prompt || '';
    const response = ex.RESPONSE || ex['RESPONSE'] || ex.response || '';
    parts.push(
      `EXAMPLE ${idx + 1}\n` +
      `PROMPT: ${prompt}\n` +
      `RESPONSE: ${response}\n`
    );
  });
  
  parts.push('\nNow answer this user prompt in my voice:\n');
  parts.push(`USER PROMPT: ${userPrompt}\n`);
  
  return parts.join('\n').trim();
}

// Call xAI API
async function callXAI(systemPrompt, contextPrompt) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await fetch(XAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`xAI error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error calling xAI:', error);
    throw error;
  }
}

async function callXAIWithMessages(messages) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await fetch(XAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_FAST,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`xAI error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error calling xAI:', error);
    throw error;
  }
}

async function logToSupabase({
  sessionId,
  userMsg,
  assistantMsg,
  ip,
  exampleIds,
}) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_PUBLIC || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/LGPT%20logs`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        session_id: sessionId || null,
        user_msg: userMsg || null,
        assistant_msg: assistantMsg || null,
        ip: ip || null,
        example_ids: exampleIds ? JSON.stringify(exampleIds) : null,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase log error:', response.status, errText);
    }
  } catch (error) {
    console.error('Supabase log error:', error);
  }
}

function getClientIp(req) {
  const header =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('cf-connecting-ip');
  if (header) {
    return header.split(',')[0].trim();
  }
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      isFirstTurn = false,
      debug = false,
      session_id: sessionId,
    } = body;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for API key
    if (!process.env.XAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'XAI_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const systemPrompt = loadSystemPrompt();

    if (isFirstTurn || history.length === 0) {
      // Load data and embeddings
      const rows = loadData();
      const embeddingsData = loadEmbeddings();

      if (!embeddingsData || rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Failed to load data or embeddings' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get query embedding using OpenAI embeddings API
      const queryArray = await getEmbedding(message);

      // Find similar examples
      const examples = selectExamplesByEmbedding(rows, message, queryArray, MAX_EXAMPLES);

      if (examples.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No examples found' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const contextPrompt = buildContextPrompt(message, examples);

      if (debug) {
        return new Response(
          JSON.stringify(
            {
              embedModel: EMBED_MODEL,
              chatModel: MODEL_FAST,
              systemPrompt,
              contextPrompt,
              examples: examples.map((e) => ({
                id: e.ID,
                prompt: e.PROMPT,
                response: e.RESPONSE,
              })),
            },
            null,
            2
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const response = await callXAI(systemPrompt, contextPrompt);

      await logToSupabase({
        sessionId,
        userMsg: message,
        assistantMsg: response,
        ip: getClientIp(req),
        exampleIds: examples.map((e) => e.ID),
      });

      return new Response(
        response,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    if (debug) {
      return new Response(
        JSON.stringify(
          {
            embedModel: EMBED_MODEL,
            chatModel: MODEL_FAST,
            messages,
          },
          null,
          2
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await callXAIWithMessages(messages);

    await logToSupabase({
      sessionId,
      userMsg: message,
      assistantMsg: response,
      ip: getClientIp(req),
      exampleIds: null,
    });
    
    // Return response
    return new Response(
      response,
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

