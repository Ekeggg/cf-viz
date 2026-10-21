import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea } from 'recharts';
import { RANKS } from '../ranks';

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const h = payload[0].payload;
  const d = h.newRating - h.oldRating;
  return (
    <div className="tip">
      <strong>{h.name}</strong>
      <div>{new Date(h.t).toLocaleDateString()}, place {h.rank}</div>
      <div>{h.oldRating} to {h.newRating} ({d >= 0 ? '+' : ''}{d})</div>
    </div>
  );
}

export default function RatingChart({ history, accent }) {
  if (!history.length) {
    return <p className="empty">No rated contests yet. The graph fills in after the first rated round.</p>;
  }
  const data = history.map((h) => ({ ...h, t: h.t * 1000, rating: h.newRating }));
  const all = history.flatMap((h) => [h.oldRating, h.newRating]);
  const lo = Math.floor((Math.min(...all) - 100) / 100) * 100;
  const hi = Math.ceil((Math.max(...all) + 100) / 100) * 100;
  const bands = RANKS.map((r, i) => ({ ...r, top: RANKS[i + 1]?.min ?? 4000 })).filter((b) => b.top > lo && b.min < hi);

  const pad = 30 * 86400000;
  const t0 = data[0].t;
  const t1 = data[data.length - 1].t;
  const ticks = [];
  for (let y = new Date(t0).getFullYear() + 1; y <= new Date(t1).getFullYear(); y++) ticks.push(new Date(y, 0, 1).getTime());

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        {bands.map((b) => (
          <ReferenceArea
            key={b.name}
            y1={Math.max(b.min, lo)}
            y2={Math.min(b.top, hi)}
            fill={b.color}
            fillOpacity={0.13}
            ifOverflow="hidden"
          />
        ))}
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={[t0 - pad, t1 + pad]}
          ticks={ticks}
          tickFormatter={(v) => new Date(v).getFullYear()}
          tick={{ fill: '#5f6f7e', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[lo, hi]}
          tick={{ fill: '#5f6f7e', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<Tip />} />
        <Line
          type="linear"
          dataKey="rating"
          stroke={accent}
          strokeWidth={2.25}
          dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
