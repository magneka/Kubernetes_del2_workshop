import type { CSSProperties, ReactNode } from 'react';

interface PanelProps {
  header?: ReactNode;
  icon?: string;
  variant?: 'primary' | 'accent' | 'dark' | 'outline';
  left?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Panel({ header, icon, variant, left, className, style, children }: PanelProps) {
  const cls = ['panel', variant && `panel-${variant}`, left && 'panel-left', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style}>
      {header && (
        <div className="panel-header">
          {icon && <i className={icon} aria-hidden="true" />}
          {header}
        </div>
      )}
      {children}
    </div>
  );
}
