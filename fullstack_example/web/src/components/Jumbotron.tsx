import type { CSSProperties, ReactNode } from 'react';

interface JumbotronProps {
  eyebrow?: string;
  eyebrowStyle?: CSSProperties;
  title: string;
  lead?: ReactNode;
  variant?: 'dark' | 'accent';
  small?: boolean;
  full?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Jumbotron({ eyebrow, eyebrowStyle, title, lead, variant, small, full, style, children }: JumbotronProps) {
  const cls = ['jumbotron', variant && `jumbo-${variant}`, full && 'jumbo-full', small && 'jumbo-sm']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style}>
      {eyebrow && (
        <span className="eyebrow" style={eyebrowStyle}>
          {eyebrow}
        </span>
      )}
      {small ? <h2>{title}</h2> : <h1>{title}</h1>}
      {lead && (typeof lead === 'string' ? <p className={small ? undefined : 'lead'} style={{ margin: small ? 0 : undefined }}>{lead}</p> : lead)}
      {children}
    </div>
  );
}
