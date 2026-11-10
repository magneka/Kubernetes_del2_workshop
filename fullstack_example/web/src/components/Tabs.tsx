import { useState, type ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabDef[];
  variant?: 'pills' | 'bordered';
  initial?: string;
}

export function Tabs({ tabs, variant, initial }: TabsProps) {
  const [active, setActive] = useState(initial ?? tabs.find((t) => !t.disabled)?.id);
  const panels = tabs.map((t) => (
    <div key={t.id} className={t.id === active ? 'tabpanel active' : 'tabpanel'} role="tabpanel">
      {t.content}
    </div>
  ));
  return (
    <div className={variant ? `tabs tabs-${variant}` : 'tabs'}>
      <div className="tablist" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={t.id === active ? 'tab active' : 'tab'}
            disabled={t.disabled}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {variant === 'bordered' ? <div className="tab-content">{panels}</div> : panels}
    </div>
  );
}
