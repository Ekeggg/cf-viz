import { Router } from 'express';
import { pool } from './db.js';
import { fetchAll } from './cf.js';
import { buildStats } from './stats.js';

const HANDLE_RE = /^[A-Za-z0-9_.-]{3,24}$/;
const TTL_MS = Number(process.env.CACHE_MINUTES || 60) * 60_000;
const MIN_REFRESH_MS = 2 * 60_000;

const inflight = new Map();

function load(handle) {
  const key = handle.toLowerCase();
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const { info, ratingRows, subs } = await fetchAll(handle);
    const data = buildStats(info, ratingRows, subs);
    await pool.query(
      `INSERT INTO profiles (handle_lower, handle, data, fetched_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (handle_lower)
       DO UPDATE SET handle = EXCLUDED.handle, data = EXCLUDED.data, fetched_at = now()`,
      [key, data.handle, data]
    );
    return { data, fetchedAt: new Date().toISOString() };
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const router = Router();

router.get('/profile/:handle', async (req, res) => {
  const { handle } = req.params;
  if (!HANDLE_RE.test(handle)) {
    return res.status(400).json({ error: 'Handles are 3 to 24 characters: letters, digits, _ . -' });
  }
  const key = handle.toLowerCase();
  try {
    const { rows } = await pool.query('SELECT data, fetched_at FROM profiles WHERE handle_lower = $1', [key]);
    const hit = rows[0];
    const age = hit ? Date.now() - new Date(hit.fetched_at).getTime() : Infinity;
    const wantsRefresh = req.query.refresh === '1' && age > MIN_REFRESH_MS;

    let payload;
    if (hit && age < TTL_MS && !wantsRefresh) {
      payload = { ...hit.data, fetchedAt: hit.fetched_at, cached: true };
    } else {
      try {
        const fresh = await load(handle);
        payload = { ...fresh.data, fetchedAt: fresh.fetchedAt, cached: false };
      } catch (err) {
        if (!hit || err.status === 404) throw err;
        payload = { ...hit.data, fetchedAt: hit.fetched_at, cached: true, stale: true };
      }
    }
    await pool.query('INSERT INTO searches (handle_lower) VALUES ($1)', [key]);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Something broke on our side.' });
  }
});

router.get('/recent', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.handle, (p.data->>'rating')::int AS rating, p.data->>'rank' AS rank
      FROM (SELECT handle_lower, MAX(searched_at) AS last FROM searches GROUP BY handle_lower) s
      JOIN profiles p USING (handle_lower)
      ORDER BY s.last DESC LIMIT 8`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load recent searches.' });
  }
});

export default router;
