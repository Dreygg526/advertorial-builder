# Advertorial Builder

Build high-converting advertorial landing pages in minutes. Clone any URL or use proven templates — fill in your copy, export HTML to Shopify.

## Stack
- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Supabase (stores saved pages)
- **AI**: Claude API (generates the HTML)
- **Deploy**: Vercel

---

## Setup

### 1. Supabase — Create the table

Go to your Supabase dashboard → SQL Editor → run this:

```sql
create table saved_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  html text not null,
  type text not null check (type in ('clone', 'template')),
  source_url text,
  template_name text,
  created_at timestamp with time zone default now()
);

-- Allow public read/write (no auth required for team use)
alter table saved_pages enable row level security;

create policy "Allow all" on saved_pages
  for all using (true) with check (true);
```

### 2. Environment Variables

Create `.env.local` in the root (already included — just update keys if needed):

```
NEXT_PUBLIC_SUPABASE_URL=https://vaegohetybwdcntcsoqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add env vars in Vercel dashboard:
# Settings → Environment Variables → add all 3 from .env.local
```

Or push to GitHub and connect repo in vercel.com dashboard.

---

## How to use

### Clone mode
1. Find a winning advertorial URL (competitor, native ad, etc.)
2. Paste URL → AI scrapes the structure
3. Fill in your copy (headline, body, CTA, offer)
4. Click Generate → preview live
5. Copy HTML → paste into Shopify

### Template mode
1. Pick a template (News, Listicle, Story, Review)
2. Fill in your copy fields
3. Generate → preview → export

### Publish to Shopify
1. Copy the HTML from the preview page
2. Shopify Admin → Online Store → Pages → Add Page
3. In the Content box, click the `</>` (code) icon
4. Paste HTML → Save
5. Set visibility to Visible → done ✓

---

## Tips
- The more detail you give in the copy fields, the better Claude's output
- For Clone mode: if URL scraping fails (some sites block bots), right-click the page → View Page Source → copy all → paste into body copy field with a note
- Iterate fast: generate, preview, go back and tweak copy, regenerate
- Save every version — you can always go back to a previous one

## File structure
```
app/
  page.tsx          — Home (choose Clone or Template)
  clone/page.tsx    — URL clone flow
  template/page.tsx — Template picker + copy form
  preview/page.tsx  — Live preview + HTML export
  saved/page.tsx    — All saved pages
  api/
    scrape/         — Fetches URL HTML
    generate/       — Claude generates the page
    save/           — Saves to Supabase
lib/
  supabase.ts       — Supabase client
  claude.ts         — Claude API wrapper
```
