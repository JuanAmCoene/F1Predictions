# F1 2026 Predictions

Simple web app where friends can submit Formula 1 race predictions and view saved submissions.

## Features

- Submit predictions for every race in the 2026 season
- Include finishing position per driver for the full grid
- Persist data in Supabase so entries are available later
- View latest saved predictions in the app
- Deploy as a static website for free

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Database: Supabase (PostgreSQL + Row Level Security)
- Hosting: Vercel (free tier)

## Quick Start

### 1) Create Supabase project

1. Create a free project at https://supabase.com
2. Open SQL Editor and run [supabase.sql](supabase.sql)
3. In Project Settings > API, copy:
   - Project URL
   - anon public key

### 2) Configure app keys

Edit [app.js](app.js) and replace:

- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_ANON_KEY`

### 3) Run locally (optional)

Use VS Code Live Server or any static file server to preview the app.

## Deploy for Free (Vercel)

1. Push the project to GitHub
2. Create/import project in Vercel: https://vercel.com
3. Deploy with default settings (no build step required)

## Database Schema

Each submission stores:

- `user_name`
- `race_name`
- `predictions` (JSON: driver -> position)
- `created_at`

## Project Structure

- [index.html](index.html) main page markup
- [styles.css](styles.css) app styling
- [app.js](app.js) UI logic + Supabase integration
- [supabase.sql](supabase.sql) database table + policies

## Notes

- The app currently allows multiple submissions per user/race combination.
- Update race and driver arrays in [app.js](app.js) when season data changes.
