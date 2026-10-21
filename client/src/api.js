async function get(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const getProfile = (handle, refresh = false) =>
  get(`/api/profile/${encodeURIComponent(handle)}${refresh ? '?refresh=1' : ''}`);

export const getRecent = () => get('/api/recent');
