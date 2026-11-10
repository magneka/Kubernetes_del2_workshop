import type { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger';

export function Badge({ variant, icon, children }: { variant?: BadgeVariant; icon?: string; children: ReactNode }) {
  return (
    <span className={variant ? `badge badge-${variant}` : 'badge'}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
    </span>
  );
}
