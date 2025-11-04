# Quick Start Guide - Vercel Deployment

## Deploy to Vercel in 5 Minutes

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/antoniologistics.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `antoniologistics` repo
4. Vercel auto-detects Next.js
5. Add environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-your-openai-key-here`
6. Click "Deploy"

### 3. Add Vercel KV Storage

1. In Vercel Dashboard, go to your project
2. Click "Storage" tab
3. Click "Create Database" → "KV"
4. Name it `antoniologistics-kv`
5. Click "Create & Continue"
6. Click "Connect to Project"
7. Vercel auto-adds environment variables
8. Go to "Deployments" → Redeploy latest

### 4. Add Custom Domain

1. In Vercel project, go to Settings → Domains
2. Add `antoniologistics.com`
3. Configure DNS at your registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL (automatic, ~5-10 min)

Done! Visit `antoniologistics.com` 🚀

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Set Up Local Database (Upstash)

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy credentials to `.env.local`:
   ```
   KV_REST_API_URL=https://your-db.upstash.io
   KV_REST_API_TOKEN=your-token
   KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
   KV_URL=your-kv-url
   ```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
antoniologistics/
├── app/
│   ├── api/                    # Serverless API routes
│   │   ├── chat/route.ts       # AI chat endpoint
│   │   ├── get-site/route.ts   # Get HTML content
│   │   ├── conversation/route.ts
│   │   └── clear-conversation/route.ts
│   ├── components/
│   │   └── ChatPanel.tsx       # Chat UI
│   ├── page.tsx                # Main page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

## Key Features

### Public Site (`/`)
- Shows your AI-generated website
- Clean, professional appearance
- No admin controls visible
- What your visitors see

### Admin Panel (`/admin`)
- Split-screen interface
- Left: Live preview of site
- Right: AI chat to build/modify
- Real-time updates
- Full website control

### AI Agent
- Uses OpenAI Swarm framework
- Generates complete HTML/CSS
- Handles single-page and multi-page sites
- Inline styles for portability
- Mobile-responsive by default

## Common Issues

### "Module 'swarm' not found"
```bash
pip install git+https://github.com/openai/swarm.git
```

### CORS Error
Make sure backend has Flask-CORS enabled and frontend `.env` has correct API URL.

### Agent Not Saving HTML
Check that:
1. OpenAI API key is valid
2. Backend logs show no errors
3. `site_data.json` has write permissions

### Preview Not Updating
1. Check browser console for errors
2. Verify iframe loads correctly
3. Try clearing browser cache

## Example Conversation

**You**: Create a landing page for Antonio's Logistics

**AI**: I've created a professional landing page for Antonio's Logistics featuring:
- Hero section with company tagline
- Services showcase
- Contact information
- Responsive design with modern styling

**You**: Add a testimonials section

**AI**: I've added a testimonials section with three example testimonials, featuring customer names, companies, and feedback. The section uses a card-based layout that's fully responsive.

**You**: Make the colors match a blue and orange theme

**AI**: I've updated the color scheme to use blue (#2563eb) as the primary color and orange (#f97316) as accents throughout the design.

## Next Steps

1. **Customize Agent**: Edit instructions in `app.py` to match your needs
2. **Add Database**: Replace JSON storage with PostgreSQL or MongoDB
3. **Add Authentication**: Protect the chat endpoint
4. **Analytics**: Track site visits and modifications
5. **Version Control**: Save HTML versions for rollback
6. **Multi-Site**: Support multiple sites with different endpoints

## Support

- Check `README.md` for detailed documentation
- Review Server_Web project for reference implementation
- OpenAI Swarm docs: https://github.com/openai/swarm

Happy building! 🚀
