import type { CSSProperties, ReactNode } from 'react';
import { Jumbotron } from './Jumbotron';

interface SectionProps {
  id?: string;
  title?: ReactNode;
  lead?: ReactNode;
  style?: CSSProperties;
  containerClassName?: string;
  children?: ReactNode;
}

// <section class="section"><div class="container"><h2/>… — the design system's page block.
export function Section({ id, title, lead, style, containerClassName, children }: SectionProps) {
  return (
    <section className="section" id={id} style={style}>
      <div className={containerClassName ? `container ${containerClassName}` : 'container'}>
        {title && <h2>{title}</h2>}
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  small?: boolean;
  children?: ReactNode;
}

// Top-of-page hero, same structure as the design system's HERO section.
export function PageHero({ eyebrow, title, lead, actions, small = true, children }: PageHeroProps) {
  return (
    <section className="section" style={{ paddingTop: 'var(--sp-7)' }}>
      <div className="container">
        <Jumbotron eyebrow={eyebrow} title={title} lead={lead} small={small}>
          {actions && (
            <div className="util-row" style={{ marginTop: 'var(--sp-4)' }}>
              {actions}
            </div>
          )}
        </Jumbotron>
        {children}
      </div>
    </section>
  );
}

export function DemoLabel({ first, children }: { first?: boolean; children: ReactNode }) {
  return (
    <p className="demo-label" style={first ? undefined : { marginTop: 'var(--sp-5)' }}>
      {children}
    </p>
  );
}
