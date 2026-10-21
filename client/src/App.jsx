import { useCallback, useEffect, useState } from 'react';
import Search from './components/Search';
import RatingChart from './components/RatingChart';
import Heatmap from './components/Heatmap';
import Difficulty from './components/Difficulty';
import Bars from './components/Bars';
import { getProfile, getRecent } from './api';
import { INK, rankColor, titleCase } from './ranks';

const VERDICT_NAMES = {
  OK: 'Accepted',
  WRONG_ANSWER: 'Wrong answer',
  TIME_LIMIT_EXCEEDED: 'Time limit',
  MEMORY_LIMIT_EXCEEDED: 'Memory limit',
  RUNTIME_ERROR: 'Runtime error',
  COMPILATION_ERROR: 'Compilation error',
  IDLENESS_LIMIT_EXCEEDED: 'Idleness limit',
  SKIPPED: 'Skipped',
  CHALLENGED: 'Hacked',
};
const verdictName = (v) => VERDICT_NAMES[v] || titleCase(v.toLowerCase().replace(/_/g, ' '));
const pct = (x) => `${Math.round(x * 100)}%`;

function Stat({ value, label }) {
  return (
    <div className="stat">
      <div className="sv">{value}</div>
      <div className="sl">{label}</div>
    </div>
  );
}

function Profile({ p, accent, onRefresh }) {
  const t = p.totals;
  const verdictRows = Object.entries(p.verdicts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([v, n]) => ({ label: verdictName(v), value: n, color: v === 'OK' ? accent : '#9aa7b2' }));
  const langRows = Object.entries(p.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([l, n]) => ({ label: l, value: n }));

  return (
    <main>
      <header className="hero">
        {p.avatar && <img src={p.avatar} alt="" width="84" height="84" />}
        <div>
          <h1 style={{ color: accent }}>{p.handle}</h1>
          <p className="rankline">
            {p.rank ? titleCase(p.rank) : 'Unrated'}
            {p.rating != null && <strong> {p.rating}</strong>}
            {p.maxRating != null && (
              <span className="peak">
                {' '}peak {p.maxRating}{p.maxRank ? `, ${titleCase(p.maxRank)}` : ''}
              </span>
            )}
          </p>
          <p className="meta">
            {[p.country, p.organization, `joined ${new Date(p.registered * 1000).getFullYear()}`,
              `contribution ${p.contribution}`].filter(Boolean).join(', ')}
          </p>
        </div>
      </header>

      <section className="stats">
        <Stat value={t.solved.toLocaleString()} label="Problems solved" />
        <Stat value={t.submissions.toLocaleString()} label="Submissions" />
        <Stat value={pct(t.acRate)} label="Accepted submissions" />
        <Stat value={pct(t.firstTryRate)} label="Solved on first try" />
        <Stat value={t.hardest ?? 'n/a'} label="Hardest solved" />
        <Stat value={p.contests.count} label="Rated contests" />
        <Stat value={`${p.streaks.longest}d`} label="Longest solve streak" />
        <Stat value={p.contests.bestRank ?? 'n/a'} label="Best contest place" />
      </section>

      <section>
        <h2>Rating history</h2>
        <div className="panel"><RatingChart history={p.ratingHistory} accent={accent} /></div>
        {p.contests.count > 0 && (
          <p className="note">
            {p.contests.bestGain > 0 && `Biggest gain +${p.contests.bestGain}. `}
            {p.contests.worstDrop < 0 && `Biggest drop ${p.contests.worstDrop}. `}
            Background bands are Codeforces rank ranges.
          </p>
        )}
      </section>

      <section>
        <h2>Last 12 months</h2>
        <Heatmap activity={p.activity} accent={accent} />
        <p className="note">Current solve streak: {p.streaks.current} day{p.streaks.current === 1 ? '' : 's'}.</p>
      </section>

      <div className="two">
        <section>
          <h2>Solved by difficulty</h2>
          <Difficulty rows={p.byRating} />
        </section>
        <section>
          <h2>Most solved tags</h2>
          <Bars rows={p.tags.map((x) => ({ label: x.tag, value: x.count }))} accent={accent} />
        </section>
      </div>

      <div className="two">
        <section>
          <h2>Verdicts</h2>
          <Bars rows={verdictRows} accent={accent} />
        </section>
        <section>
          <h2>Languages</h2>
          <Bars rows={langRows} accent={accent} />
        </section>
      </div>

      <footer className="foot">
        <span>
          {p.cached ? 'Saved copy from ' : 'Fetched '}
          {new Date(p.fetchedAt).toLocaleString()}
          {p.stale && '. Codeforces did not respond, so this may be out of date.'}
        </span>
        <button className="link" onClick={onRefresh}>Refetch from Codeforces</button>
      </footer>
    </main>
  );
}

export default function App() {
  const [state, setState] = useState({ status: 'idle' });
  const [recent, setRecent] = useState([]);

  const load = useCallback(async (handle, refresh = false) => {
    setState((s) => ({ ...s, status: 'loading', handle }));
    history.replaceState(null, '', `?u=${encodeURIComponent(handle)}`);
    try {
      const data = await getProfile(handle, refresh);
      setState({ status: 'ready', data });
      getRecent().then(setRecent).catch(() => {});
    } catch (e) {
      setState({ status: 'error', handle, message: e.message });
    }
  }, []);

  useEffect(() => {
    getRecent().then(setRecent).catch(() => {});
    const u = new URLSearchParams(location.search).get('u');
    if (u) load(u);
  }, [load]);

  const data = state.data;
  const accent = data ? rankColor(data.rank) : INK;
  const loading = state.status === 'loading';

  return (
    <div className="app" style={{ '--rank': accent }}>
      <Search onSearch={(h) => load(h)} loading={loading} recent={recent} />
      {state.status === 'idle' && (
        <main className="intro">
          <h1>Look up a Codeforces handle</h1>
          <p>Rating history, solved problems by difficulty, tags, verdicts, and a year of activity.</p>
        </main>
      )}
      {loading && (
        <p className="status">
          Fetching {state.handle} from Codeforces. A first lookup takes a few seconds because their API allows one request every two seconds.
        </p>
      )}
      {state.status === 'error' && <p className="status error">{state.message}</p>}
      {data && state.status !== 'error' && (
        <div className={loading ? 'dim' : ''}>
          <Profile p={data} accent={accent} onRefresh={() => load(data.handle, true)} />
        </div>
      )}
    </div>
  );
}
