import { useState } from 'react';
import { rankColor } from '../ranks';

export default function Search({ onSearch, loading, recent }) {
  const [value, setValue] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const h = value.trim();
    if (h) onSearch(h);
  };
  return (
    <div className="search">
      <form onSubmit={submit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Codeforces handle, e.g. tourist"
          aria-label="Codeforces handle"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button disabled={loading || !value.trim()}>{loading ? 'Loading' : 'Show profile'}</button>
      </form>
      {recent.length > 0 && (
        <div className="recent">
          <span>Recently viewed</span>
          {recent.map((r) => (
            <button key={r.handle} className="chip" onClick={() => { setValue(r.handle); onSearch(r.handle); }}>
              <b style={{ color: rankColor(r.rank) }}>{r.handle}</b>
              {r.rating ? ` ${r.rating}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
