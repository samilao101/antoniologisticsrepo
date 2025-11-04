# Antonio Logistics - AI Website Builder

A full-stack Next.js application deployed entirely on Vercel that allows you to create and modify websites through an AI chat interface. Built with Next.js, OpenAI GPT-4, and Vercel KV.

## Architecture

```
┌──────────────────── VERCEL ────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │        Next.js Frontend (Edge Network)      │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │   Main Page (renders HTML)          │   │  │
│  │  │   Chat Interface Component          │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  └─────────────────┬───────────────────────────┘  │
│                    │                               │
│  ┌─────────────────▼───────────────────────────┐  │
│  │    API Routes (Serverless Functions)        │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │  /api/chat (OpenAI GPT-4)           │   │  │
│  │  │  /api/get-site                      │   │  │
│  │  │  /api/conversation                  │   │  │
│  │  │  /api/clear-conversation            │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  └─────────────────┬───────────────────────────┘  │
│                    │                               │
│  ┌─────────────────▼───────────────────────────┐  │
│  │         Vercel KV (Redis Storage)           │  │
│  │  - HTML Content                             │  │
│  │  - Conversation History                     │  │
│  │  - Metadata                                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   OpenAI API     │
              │   GPT-4 Turbo    │
              └──────────────────┘
```

## Features

- 🎨 **AI-Powered Website Building**: Create and modify websites through natural language chat
- 💬 **Real-time Chat Interface**: Interactive chat with AI agent
- 🔄 **Live Preview**: See changes to your website in real-time
- 📱 **Responsive Design**: Works on desktop and mobile
- 🚀 **Serverless Frontend**: Deploy on Vercel with custom domain support
- 🤖 **OpenAI Swarm**: Multi-agent system for sophisticated website building

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI GPT-4 Turbo with Function Calling
- **Storage**: Vercel KV (Redis)
- **Hosting**: Vercel (Edge Network + Serverless Functions)
- **Styling**: CSS3 with animations

## Quick Start (Local Development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your OpenAI API key
   ```

3. **Set up local KV storage**

   Use Upstash for local development:
   - Sign up at [upstash.com](https://upstash.com)
   - Create a Redis database
   - Copy credentials to `.env.local`

4. **Run development server**
   ```bash
   npm run dev
   ```

   App runs on `http://localhost:3000`

## Deployment to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variable: `OPENAI_API_KEY`
   - Deploy!

3. **Add Vercel KV Storage**
   - In Vercel Dashboard, go to Storage
   - Create KV Database
   - Connect to your project
   - Redeploy

4. **Add Custom Domain**
   - Project Settings → Domains
   - Add `antoniologistics.com`
   - Configure DNS as instructed

### Option 2: Deploy via CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete guide.

## API Routes (Serverless Functions)

### `GET /`
Main page - serves the website builder interface

### `GET /api/get-site`
Returns current HTML content and metadata

**Response:**
```json
{
  "htmlContent": "<html>...</html>",
  "lastUpdated": "2024-01-01T12:00:00",
  "lastUpdateDescription": "Added contact form"
}
```

### `POST /api/chat`
Send message to AI agent

**Request:**
```json
{
  "message": "Create a landing page for a logistics company",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "response": "I've created a professional landing page...",
  "htmlUpdated": true
}
```

### `GET /api/conversation?sessionId=session_123`
Get conversation history

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a landing page",
      "timestamp": "2024-01-01T12:00:00"
    }
  ]
}
```

### `POST /api/clear-conversation`
Clear conversation history

**Request:**
```json
{
  "sessionId": "session_123"
}
```

## URL Structure

- **`/`** - Public website (shows the AI-generated HTML)
- **`/admin`** - Admin panel (AI chat interface to build/modify the site)

## How It Works

1. **Admin visits `/admin`** and uses the AI chat interface
2. **Message sent to** `/api/chat` endpoint (serverless function)
3. **OpenAI GPT-4** processes the request using function calling
4. **AI calls `save_html` function** to update the website
5. **HTML saved** to Vercel KV (Redis database)
6. **Admin preview** refreshes automatically
7. **Public site** (`/`) shows the updated HTML

## Example Prompts

- "Create a modern landing page for a logistics company"
- "Add a contact form section"
- "Make the design more colorful with better fonts"
- "Add a services section with three columns"
- "Create a navigation menu with About, Services, and Contact links"

## Data Storage

The app uses **Vercel KV** (Redis) to store:
- `site:html` - Current website HTML content
- `site:lastUpdated` - Last modification timestamp
- `site:lastDescription` - Description of last update
- `conversation:{sessionId}` - Chat history per session

### Storage Keys

```typescript
// HTML Storage
await kv.set('site:html', htmlContent);
await kv.get('site:html');

// Conversation Storage
await kv.set('conversation:session_123', messages);
await kv.get('conversation:session_123');
```

## Customization

### Modify Agent Instructions

Edit `app/api/chat/route.ts`:

```typescript
const systemPrompt = `You are an expert website builder...

  YOUR CUSTOM INSTRUCTIONS HERE

  ...`;
```

### Change OpenAI Model

In `app/api/chat/route.ts`:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',  // Change to gpt-4, gpt-3.5-turbo, etc.
  messages: apiMessages,
  // ...
});
```

### Customize Styling

Edit CSS files:
- `app/page.css` - Main page styles
- `app/components/ChatPanel.css` - Chat interface
- `app/globals.css` - Global styles

## Troubleshooting

### Chat Not Working
- Verify `OPENAI_API_KEY` is set in Vercel environment variables
- Check Vercel function logs for errors
- Ensure you're on a supported OpenAI plan

### HTML Not Saving
- Verify Vercel KV is connected
- Check function logs for KV errors
- Ensure KV environment variables are present

### Preview Not Updating
- Check browser console for errors
- Verify iframe sandbox settings allow scripts
- Ensure HTML from AI is valid
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Local Development Issues
- Make sure Upstash Redis credentials are in `.env.local`
- Check that all required environment variables are set
- Verify OpenAI API key is valid

## Project Structure

```
antoniologistics/
├── app/
│   ├── api/                        # Serverless API routes
│   │   ├── chat/route.ts          # Main AI chat endpoint
│   │   ├── get-site/route.ts      # Get website content
│   │   ├── conversation/route.ts  # Get chat history
│   │   └── clear-conversation/route.ts
│   ├── components/
│   │   ├── ChatPanel.tsx          # Chat UI component
│   │   └── ChatPanel.css
│   ├── page.tsx                   # Main page (homepage)
│   ├── page.css
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.js                  # Next.js config
├── vercel.json                     # Vercel deployment config
├── .env.example                    # Environment template
├── README.md                       # This file
└── VERCEL_DEPLOYMENT.md           # Deployment guide
```

## Benefits of Vercel-Only Architecture

✅ **Single Platform** - Everything on Vercel
✅ **Zero DevOps** - No server management
✅ **Auto-Scaling** - Handles traffic spikes automatically
✅ **Edge Network** - Fast global delivery
✅ **Serverless Functions** - Pay per use
✅ **Built-in Database** - Vercel KV included
✅ **Simple Deployment** - `git push` to deploy
✅ **Custom Domains** - Free SSL certificates
✅ **No Firebase** - Simpler architecture

## Costs

### Vercel Free Tier:
- ✅ Unlimited hobby projects
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Custom domains
- ✅ Auto SSL

### Vercel KV Free Tier:
- ✅ 256 MB storage
- ✅ 10K commands/day
- ✅ Perfect for small sites

### OpenAI:
- GPT-4 Turbo: ~$0.01-0.03 per chat message
- Costs vary with conversation length

## License

MIT

## Support

- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📖 [OpenAI API Docs](https://platform.openai.com/docs)
- 🚀 [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)




-----------


  Step 1: Get OpenAI API Key (2 minutes)

  1. Go to https://platform.openai.com/api-keys
  2. Sign in or create account
  3. Click "Create new secret key"
  4. Copy the key (starts with sk-)
  5. Save it somewhere safe

  Step 2: Push to GitHub (3 minutes)

  cd /Users/Consulting/Desktop/Family/Dads\ Website/antoniologistics

  # Initialize git
  git init
  git add .
  git commit -m "Initial commit - AI Website Builder"

  # Create repo on GitHub, then:
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/antoniologistics.git
  git push -u origin main

  Step 3: Deploy to Vercel (5 minutes)

  1. Go to: https://vercel.com/new
  2. Click: "Import Git Repository"
  3. Select: Your antoniologistics repository
  4. Framework: Vercel auto-detects Next.js ✅
  5. Environment Variables: Add one variable:
    - Name: OPENAI_API_KEY
    - Value: sk-your-key-from-step-1
  6. Click: "Deploy"
  7. Wait: ~2 minutes for deployment

  Step 4: Add Database Storage (2 minutes)

  1. In Vercel Dashboard, go to your project
  2. Click "Storage" tab
  3. Click "Create Database" → "KV"
  4. Name it: antoniologistics-kv
  5. Click "Create"
  6. Click "Connect to Project"
  7. Go to "Deployments" tab
  8. Click "Redeploy" on the latest deployment

  Step 5: Test Your Site! (1 minute)

  1. Vercel gives you a URL like: antoniologistics.vercel.app
  2. Visit it
  3. Click the chat button 💬
  4. Type: "Create a modern landing page for Antonio's Logistics"
  5. Watch the AI build your website! ✨

  ---
  Optional: Add Custom Domain

  After it works:

  1. In Vercel: Settings → Domains
  2. Add: antoniologistics.com
  3. Follow DNS instructions from Vercel
  4. Wait 5-10 minutes for SSL
