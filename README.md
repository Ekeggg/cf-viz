# cf-viz

Codeforces profile data viz. Postgres, Express, React (Vite), Node 18+.

## Run it

```bash
npm run setup     # installs root, server, client
npm run db        # Postgres via docker compose (or point server/.env at your own DB)
npm run dev       # api on :4000, web on :5173
```

Open http://localhost:5173 and enter a handle. `?u=tourist` in the URL deep-links a profile.

Production: `npm start` builds the client and Express serves it with the API.

## How it works

- `server/src/cf.js` calls the Codeforces API (`user.info`, `user.rating`, `user.status`) through a queue that keeps to their 1 request per 2 seconds limit.
- `server/src/stats.js` turns raw submissions into the numbers the charts use (difficulty histogram, tags, verdicts, languages, daily activity, streaks).
- Postgres stores computed profiles (`profiles`, JSONB) so repeat lookups are instant, plus a `searches` table behind the "Recently viewed" chips. Cache lifetime is `CACHE_MINUTES` in `server/.env`. If Codeforces is down, a saved copy is served and marked stale.
- The page accent color follows the user's current Codeforces rank color.

## Ideas to add next

Compare two handles, contest-by-contest delta view, problem-tag weak spots vs. rating, unsolved-problems-near-your-rating recommender (`problemset.problems`).
