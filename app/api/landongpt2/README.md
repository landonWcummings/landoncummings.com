# LandonGPT 2.0 Setup Guide

## Overview
LandonGPT 2.0 uses embedding-based retrieval to find the most similar examples from the writing database, then uses those examples as context for generating responses in Landon's voice.

## Architecture
1. **User sends prompt** → Frontend (`/landongpt2`)
2. **Embedding generation** → Hugging Face Inference API (free tier) using `all-mpnet-base-v2`
3. **Semantic search** → Cosine similarity to find top 6 most similar examples
4. **Context building** → Combines examples with user prompt
5. **Response generation** → xAI Grok API (`grok-2-1212`)
6. **Return response** → Frontend displays

## Setup Instructions

### 1. Environment Variables
Add to Vercel environment variables (Settings → Environment Variables):
- `XAI_API_KEY`: Your xAI API key from https://console.x.ai/

### 2. Files Required
The following files should be in `app/api/landongpt2/`:
- `embeddings.json`: Pre-computed embeddings (768 dimensions)
- `data.txt`: TSV file with ID, PROMPT, RESPONSE, etc.
- `chatbot_context/system_prompt.txt`: System prompt for the LLM

### 3. Dependencies
Already added to `package.json`:
- `openai`: For xAI API client

### 4. Free Tier Services Used
- **Vercel**: Hosting (free tier)
- **Hugging Face Inference API**: Embeddings (free tier, no API key needed)
- **xAI Grok API**: Response generation (requires API key)

## How It Works

1. **Embedding Generation**: Uses Hugging Face's free Inference API to generate embeddings for user prompts using the same model (`all-mpnet-base-v2`) that was used to create the stored embeddings.

2. **Similarity Search**: Calculates cosine similarity between the query embedding and all stored embeddings to find the most relevant examples.

3. **Context Building**: Takes the top 6 most similar examples and formats them as context for the LLM.

4. **Response Generation**: Sends the system prompt + context examples + user prompt to Grok API.

## Testing Locally

1. Set `XAI_API_KEY` in `.env.local`:
   ```
   XAI_API_KEY=your_key_here
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

3. Navigate to `/landongpt2`

## Deployment

1. Push to your repository
2. Vercel will automatically deploy
3. Make sure `XAI_API_KEY` is set in Vercel environment variables
4. Test at `https://your-domain.com/landongpt2`

## Notes

- The Hugging Face API may take a few seconds on first request (cold start)
- Embeddings are cached in memory for performance
- The system uses the same embedding model as the original to ensure compatibility

