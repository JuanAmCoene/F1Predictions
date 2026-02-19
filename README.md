# F1 2026 Predictions

Community pick'em app where users rank all drivers for each 2026 Formula 1 race and store submissions in Supabase.

## Live Features

- Full 2026 race list and driver lineup
- Drag-and-drop ranking cards for all drivers
- Arrow controls (up/down) for quick reordering on desktop and mobile
- Team color accents on ranking cards and saved results
- Persistent storage in Supabase (PostgreSQL)
- Saved prediction history shown in-app (full ranking, not only top 5)

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Database/API: Supabase (PostgreSQL + Row Level Security)
- Hosting: Vercel (static deployment)

## Project Structure

- [index.html](index.html): page layout
- [styles.css](styles.css): styling and team colors
- [app.js](app.js): prediction UI logic and Supabase calls
- [supabase.sql](supabase.sql): table + RLS policies

## Local Setup

### 1) Create Supabase project

1. Create a project at https://supabase.com
2. Open SQL Editor
3. Run the script from [supabase.sql](supabase.sql)

### 2) Configure API values

In [app.js](app.js), set:

- `SUPABASE_URL` (for example: `https://your-project-ref.supabase.co`)
- `SUPABASE_ANON_KEY` (anon public key from Project Settings > API)

### 3) Run locally

Open with VS Code Live Server (or any static server) and test by submitting a prediction.

## Deploy on Vercel

1. Push this repository to GitHub
2. Import the repository in Vercel: https://vercel.com/new
3. Keep defaults (no build command, no output directory)
4. Deploy

## Update Workflow (Auto Deploy)

After the project is connected to Vercel, every push to your production branch deploys automatically.

Typical update flow:

1. `git add .`
2. `git commit -m "Describe your change"`
3. `git push`

Vercel then creates a new deployment for that commit.

## Database Model

Table: `public.predictions`

- `id` (identity primary key)
- `user_name` (text)
- `race_name` (text)
- `predictions` (jsonb: `driver -> finishing position`)
- `created_at` (timestamp with timezone)

## Notes

- This app currently allows multiple submissions per user and race.
- Update race, driver, and team mappings in [app.js](app.js) when season data changes.
