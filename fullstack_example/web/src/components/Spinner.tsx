import { useBodyLock } from './useBodyLock';

export function Spinner({ small, label = 'Laster…' }: { small?: boolean; label?: string }) {
  return <span className={small ? 'spinner sm' : 'spinner'} role="status" aria-label={label} />;
}

export function PageOverlay({ open, text = 'Laster…' }: { open: boolean; text?: string }) {
  useBodyLock(open);
  return (
    <div className={open ? 'page-overlay open' : 'page-overlay'} aria-hidden={!open}>
      <div className="spinner" />
      <div className="overlay-text">{text}</div>
    </div>
  );
}
