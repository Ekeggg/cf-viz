import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ratingColor } from '../ranks';

export default function Difficulty({ rows }) {
  if (!rows.some((r) => r.count)) return <p className="empty">No rated problems solved yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: -12 }}>
        <XAxis dataKey="rating" tick={{ fill: '#5f6f7e', fontSize: 11 }} axisLine={false} tickLine={false}
               interval={Math.ceil(rows.length / 10) - 1} />
        <YAxis tick={{ fill: '#5f6f7e', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                 formatter={(v) => [v, 'Solved']} labelFormatter={(l) => `Difficulty ${l}`} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {rows.map((r) => <Cell key={r.rating} fill={ratingColor(r.rating)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
