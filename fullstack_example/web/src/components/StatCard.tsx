import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  icon: string;
  value: ReactNode;
  label: string;
  trend?: { direction: 'up' | 'down'; text: string };
  to?: string;
}

export function StatCard({ icon, value, label, trend, to }: StatCardProps) {
  const card = (
    <div className="stat-card">
      <div className="icon">
        <i className={icon} aria-hidden="true" />
      </div>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      {trend && (
        <div className={`trend ${trend.direction}`}>
          <i className={`fa-solid fa-arrow-${trend.direction}`} /> {trend.text}
        </div>
      )}
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {card}
    </Link>
  ) : (
    card
  );
}
