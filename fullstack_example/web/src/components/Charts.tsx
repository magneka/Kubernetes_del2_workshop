import type { CSSProperties, ReactNode } from 'react';

export interface Bar {
  label: string;
  value: number;
}

export function BarChart({ bars, max }: { bars: Bar[]; max?: number }) {
  const top = Math.max(max ?? 0, ...bars.map((b) => b.value), 1);
  return (
    <div className="bar-chart">
      {bars.map((b) => (
        <div key={b.label} className="bar" style={{ height: `${Math.round((b.value / top) * 100)}%` }}>
          <span>{b.value}</span>
          <small>{b.label}</small>
        </div>
      ))}
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

// Same markup as the design's .donut; the conic-gradient is computed from the slices.
export function Donut({ slices, center, centerLabel }: { slices: DonutSlice[]; center?: ReactNode; centerLabel?: ReactNode }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = slices.map((s) => {
    const from = (acc / total) * 100;
    acc += s.value;
    return `${s.color} ${from}% ${(acc / total) * 100}%`;
  });
  const style: CSSProperties = { background: `conic-gradient(${stops.join(',')})` };
  return (
    <div className="donut" style={style}>
      <div className="hole">
        <b>{center}</b>
        {centerLabel && <span style={{ fontSize: 'var(--fs-1)', color: 'var(--muted)' }}>{centerLabel}</span>}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: ReactNode; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i, n) => (
        <span key={n}>
          <span className="dot" style={{ background: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}
