export default function Bars({ rows, accent }) {
  if (!rows.length) return <p className="empty">Nothing here yet.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bl">{r.label}</span>
          <span className="track">
            <span className="fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color || accent }} />
          </span>
          <span className="bv">{r.value.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
