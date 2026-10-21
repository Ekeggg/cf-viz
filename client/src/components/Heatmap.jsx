const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CELL = 12;
const STEP = 15;

const level = (n) => (n >= 7 ? 1 : n >= 4 ? 0.75 : n >= 2 ? 0.5 : 0.3);

export default function Heatmap({ activity, accent }) {
  const now = new Date();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const first = end - 364 * DAY;
  const start = first - new Date(first).getUTCDay() * DAY;
  const cols = Math.floor((end - start) / DAY / 7) + 1;

  const cells = [];
  const labels = [];
  let prevMonth = -1;
  for (let c = 0; c < cols; c++) {
    const m = new Date(start + c * 7 * DAY).getUTCMonth();
    if (m !== prevMonth && c < cols - 2) labels.push({ c, text: MONTHS[m] });
    prevMonth = m;
    for (let r = 0; r < 7; r++) {
      const t = start + (c * 7 + r) * DAY;
      if (t > end || t < first) continue;
      const key = new Date(t).toISOString().slice(0, 10);
      cells.push({ key, c, r, n: activity[key]?.s ?? 0, a: activity[key]?.a ?? 0 });
    }
  }
  const active = cells.filter((x) => x.n > 0).length;

  return (
    <div>
      <div className="scroll">
        <svg viewBox={`0 0 ${cols * STEP} ${7 * STEP + 18}`} style={{ minWidth: 720, width: '100%' }} role="img"
             aria-label={`Submission activity over the last year, ${active} active days`}>
          {labels.map((l) => (
            <text key={l.c} x={l.c * STEP} y={10} fontSize="11" fill="#5f6f7e">{l.text}</text>
          ))}
          {cells.map((x) => (
            <rect key={x.key} x={x.c * STEP} y={18 + x.r * STEP} width={CELL} height={CELL} rx="2"
                  fill={x.n ? accent : '#dae1e7'} fillOpacity={x.n ? level(x.n) : 1}>
              <title>{`${x.key}: ${x.n} submission${x.n === 1 ? '' : 's'}, ${x.a} accepted`}</title>
            </rect>
          ))}
        </svg>
      </div>
      <p className="note">{active} active days in the last year. Darker means more submissions.</p>
    </div>
  );
}
