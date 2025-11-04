# Vercel Deployment Guide

Complete guide to deploy your AI Website Builder on Vercel with custom domain.

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [GitHub Account](https://github.com) (recommended for easy deployment)

## Project Structure

```
antoniologistics/
├── app/
│   ├── api/                    # Serverless API routes
│   │   ├── chat/route.ts       # AI chat endpoint
│   │   ├── get-site/route.ts   # Get website HTML
│   │   ├── conversation/route.ts
│   │   └── clear-conversation/route.ts
│   ├── components/
│   │   └── ChatPanel.tsx       # Chat interface
│   ├── page.tsx                # Main page
│   └── layout.tsx              # Root layout
├── package.json                # Dependencies
└── vercel.json                 # Vercel config
```

## Step 1: Local Development

### Install Dependencies

```bash
npm install
```

### Set Up Local Environment

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key
```

3. For local development, you need Vercel KV (Redis). Two options:

**Option A: Use Upstash (Recommended for Local Dev)**
1. Sign up at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the credentials to `.env.local`:
```
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
KV_URL=your-kv-url
```

**Option B: Use Vercel CLI (connects to production DB)**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Step 2: Deploy to Vercel

### Method 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/antoniologistics.git
git push -u origin main
```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   - In the import screen, add:
     - `OPENAI_API_KEY` = `your-openai-key`
   - Click "Deploy"

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? antoniologistics
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

## Step 3: Add Vercel KV Storage

Your app needs Vercel KV (Redis) for storing conversations and HTML.

1. **Go to your project in Vercel Dashboard**

2. **Navigate to Storage tab**

3. **Click "Create Database" → "KV (Redis)"**
   - Name: `antoniologistics-kv`
   - Region: Same as your deployment (e.g., `iad1`)
   - Click "Create"

4. **Connect to Project**
   - Vercel automatically adds KV environment variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`
     - `KV_URL`

5. **Redeploy**
   - Go to "Deployments" tab
   - Click "⋯" on latest deployment → "Redeploy"
   - Or push a new commit to GitHub

## Step 4: Add Custom Domain

### Configure antoniologistics.com

1. **In Vercel Dashboard, go to your project**

2. **Settings → Domains**

3. **Add domain: `antoniologistics.com`**

4. **Add www subdomain: `www.antoniologistics.com`**

5. **Configure DNS** (at your domain registrar):

#### If using Vercel nameservers (Recommended):
```
Update nameservers to:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### If using custom DNS:
```
# A Record
Type: A
Name: @
Value: 76.76.21.21

# CNAME for www
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

6. **Wait for SSL** (automatic, takes ~5-10 minutes)

7. **Set as primary domain** (optional):
   - In Domains settings, click "⋯" next to your domain
   - Select "Set as Primary Domain"

## Step 5: Environment Variables

### Required Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENAI_API_KEY` | sk-... | Production, Preview, Development |

### KV Variables (Auto-added)

These are automatically added when you create Vercel KV:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

## Project Structure Explained

### API Routes (Serverless Functions)

All in `app/api/`:

**`/api/chat`** - Main chat endpoint
- Accepts user messages
- Calls OpenAI with function calling
- Saves HTML updates to KV
- Returns AI response

**`/api/get-site`** - Get website content
- Retrieves current HTML from KV
- Returns HTML and metadata

**`/api/conversation`** - Get chat history
- Retrieves conversation from KV
- Used to restore chat on page load

**`/api/clear-conversation`** - Clear chat
- Deletes conversation from KV

### Frontend

**`app/page.tsx`** - Main page
- Displays website in iframe
- Shows/hides chat panel
- Handles site updates

**`app/components/ChatPanel.tsx`** - Chat UI
- Message display
- Input handling
- API communication

## How It Works

```
┌─────────────────────────────────────┐
│         Vercel Edge Network         │
│  ┌───────────────────────────────┐  │
│  │   Next.js App (Frontend)      │  │
│  │   - page.tsx                  │  │
│  │   - ChatPanel.tsx             │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │   API Routes (Serverless)     │  │
│  │   - /api/chat                 │  │
│  │   - /api/get-site             │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │   Vercel KV (Redis)           │  │
│  │   - Conversations             │  │
│  │   - HTML Content              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
               │
               ▼
     ┌──────────────────┐
     │   OpenAI API     │
     │   GPT-4          │
     └──────────────────┘
```

## Monitoring and Logs

### View Logs
1. Vercel Dashboard → Your Project
2. Click on a deployment
3. View "Function Logs" or "Build Logs"

### Monitor Usage
- Go to "Analytics" tab for traffic stats
- Check "Speed Insights" for performance
- Monitor Vercel KV usage in Storage tab

## Troubleshooting

### "Module not found: @vercel/kv"
```bash
npm install @vercel/kv
```

### "API route not working"
- Check environment variables are set
- Redeploy after adding KV
- Check function logs for errors

### "Chat not saving"
- Verify KV is connected
- Check KV environment variables exist
- Look at function logs for KV errors

### "Website not updating"
- Check iframe sandbox settings
- Verify HTML is being saved to KV
- Check browser console for errors

### CORS Issues
Next.js API routes don't need CORS configuration when frontend and API are on same domain.

## Costs

### Vercel Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ 6000 build minutes/month
- ✅ 100GB-hrs serverless function execution
- ✅ Automatic HTTPS/SSL
- ✅ Edge network (CDN)
- ✅ Custom domains

### Vercel KV Free Tier:
- ✅ 256 MB storage
- ✅ 10K commands/month
- ✅ Sufficient for development and small sites

### OpenAI Costs:
- GPT-4 Turbo: ~$0.01-0.03 per request
- Varies based on conversation length

## Going to Production

### Checklist

- [ ] Environment variables configured
- [ ] Vercel KV created and connected
- [ ] Custom domain added and DNS configured
- [ ] SSL certificate active (automatic)
- [ ] Test chat functionality
- [ ] Test website updates
- [ ] Monitor first few conversations
- [ ] Set up analytics (optional)

### Recommended Settings

In `vercel.json`:
```json
{
  "regions": ["iad1"]  # Change to region closest to users
}
```

Common regions:
- `iad1` - Washington, D.C., USA
- `sfo1` - San Francisco, USA
- `lhr1` - London, UK
- `hnd1` - Tokyo, Japan

## Updating Your Site

### Push Updates
```bash
git add .
git commit -m "Update description"
git push
```

Vercel automatically deploys on push to `main` branch.

### Manual Deploy
```bash
vercel --prod
```

## Advanced Configuration

### Custom OpenAI Model

Edit `app/api/chat/route.ts`:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',  // Change model here
  // ...
});
```

### Adjust Response Length

In same file, add:
```typescript
max_tokens: 4096,  // Increase for longer responses
```

### Change Agent Instructions

Modify the `systemPrompt` in `app/api/chat/route.ts` to customize behavior.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Summary

Your entire application runs on Vercel:
- ✅ Frontend (Next.js) on Vercel Edge
- ✅ Backend (API Routes) as serverless functions
- ✅ Storage (Vercel KV) for data persistence
- ✅ Custom domain with automatic SSL
- ✅ Zero server management
- ✅ Scales automatically

Deployment is as simple as `git push`! 🚀
