// Codeforces allows ~1 request per 2 seconds, so every call goes through one queue.
const BASE = 'https://codeforces.com/api';
const GAP_MS = 2100;

let last = 0;
let chain = Promise.resolve();

function throttled(fn) {
  const run = chain.then(async () => {
    const wait = Math.max(0, last + GAP_MS - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      return await fn();
    } finally {
      last = Date.now();
    }
  });
  chain = run.catch(() => {});
  return run;
}

function call(method, params) {
  const qs = new URLSearchParams(params).toString();
  return throttled(async () => {
    let res;
    try {
      res = await fetch(`${BASE}/${method}?${qs}`);
    } catch {
      const err = new Error('Could not reach Codeforces. Try again in a moment.');
      err.status = 502;
      throw err;
    }
    const body = await res.json().catch(() => null);
    if (!body || body.status !== 'OK') {
      const comment = body?.comment || `Codeforces API error (${res.status})`;
      const err = new Error(/not found/i.test(comment) ? 'No Codeforces user with that handle.' : comment);
      err.status = /not found/i.test(comment) ? 404 : 502;
      throw err;
    }
    return body.result;
  });
}

export async function fetchAll(handle) {
  const [info] = await call('user.info', { handles: handle });
  const ratingRows = await call('user.rating', { handle });
  const subs = await call('user.status', { handle });
  return { info, ratingRows, subs };
}
