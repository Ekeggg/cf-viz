const DAY = 86400;
const iso = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);

function normLang(name = '') {
  const n = name.toLowerCase();
  if (n.includes('c++')) return 'C++';
  if (n.includes('python') || n.includes('pypy')) return 'Python';
  if (n.includes('kotlin')) return 'Kotlin';
  if (n.includes('javascript') || n.includes('node')) return 'JavaScript';
  if (n.includes('java')) return 'Java';
  if (n.includes('rust')) return 'Rust';
  if (/^go\b/.test(n)) return 'Go';
  if (n.includes('c#') || n.includes('mono')) return 'C#';
  if (/\bc\d{2}\b/.test(n) || /^c\b/.test(n)) return 'C';
  return name.split(' ')[0] || 'Other';
}

function streaks(acDays) {
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of acDays) {
    const t = Date.parse(d) / 1000;
    run = prev !== null && t - prev === DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY;
  const current = prev !== null && today - prev <= DAY ? run : 0;
  return { longest, current };
}

export function buildStats(info, ratingRows, subs) {
  const sorted = [...subs].sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);

  const solved = new Map();
  const seen = new Set();
  let firstTry = 0;
  const verdicts = {};
  const languages = {};
  const days = {};
  const acDays = new Set();

  for (const s of sorted) {
    const p = s.problem;
    const key = `${p.contestId ?? p.problemsetName ?? '?'}-${p.index}`;
    const v = s.verdict || 'TESTING';
    verdicts[v] = (verdicts[v] || 0) + 1;
    const lang = normLang(s.programmingLanguage);
    languages[lang] = (languages[lang] || 0) + 1;

    const d = iso(s.creationTimeSeconds);
    const day = (days[d] ||= { s: 0, a: 0 });
    day.s++;

    if (v === 'OK') {
      day.a++;
      acDays.add(d);
      if (!solved.has(key)) solved.set(key, { rating: p.rating, tags: p.tags || [] });
    }
    if (!seen.has(key)) {
      seen.add(key);
      if (v === 'OK') firstTry++;
    }
  }

  const ratingCount = {};
  const tagCount = {};
  let hardest = 0;
  for (const { rating, tags } of solved.values()) {
    if (rating) {
      ratingCount[rating] = (ratingCount[rating] || 0) + 1;
      hardest = Math.max(hardest, rating);
    }
    for (const t of tags) tagCount[t] = (tagCount[t] || 0) + 1;
  }
  const byRating = [];
  for (let r = 800; r <= Math.max(hardest, 1600); r += 100) {
    byRating.push({ rating: r, count: ratingCount[r] || 0 });
  }
  const tags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([tag, count]) => ({ tag, count }));

  const cutoff = iso(Date.now() / 1000 - 365 * DAY);
  const activity = Object.fromEntries(Object.entries(days).filter(([d]) => d >= cutoff));

  const ratingHistory = ratingRows.map((r) => ({
    contestId: r.contestId,
    name: r.contestName,
    rank: r.rank,
    oldRating: r.oldRating,
    newRating: r.newRating,
    t: r.ratingUpdateTimeSeconds,
  }));
  const deltas = ratingHistory.map((r) => r.newRating - r.oldRating);

  const accepted = verdicts.OK || 0;
  return {
    handle: info.handle,
    rating: info.rating ?? null,
    maxRating: info.maxRating ?? null,
    rank: info.rank ?? null,
    maxRank: info.maxRank ?? null,
    avatar: info.titlePhoto || info.avatar || null,
    country: info.country || null,
    organization: info.organization || null,
    contribution: info.contribution ?? 0,
    registered: info.registrationTimeSeconds,
    totals: {
      submissions: subs.length,
      accepted,
      solved: solved.size,
      attempted: seen.size,
      acRate: subs.length ? accepted / subs.length : 0,
      firstTryRate: seen.size ? firstTry / seen.size : 0,
      hardest: hardest || null,
    },
    contests: {
      count: ratingHistory.length,
      bestRank: ratingHistory.length ? Math.min(...ratingHistory.map((r) => r.rank)) : null,
      bestGain: deltas.length ? Math.max(...deltas) : null,
      worstDrop: deltas.length ? Math.min(...deltas) : null,
    },
    streaks: streaks([...acDays].sort()),
    ratingHistory,
    byRating,
    tags,
    verdicts,
    languages,
    activity,
  };
}
