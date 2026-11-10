import type { CSSProperties, ReactNode } from 'react';

export type AlertVariant = 'success' | 'info' | 'warning' | 'danger';

const icons: Record<AlertVariant, string> = {
  success: 'fa-solid fa-circle-check',
  info: 'fa-solid fa-circle-info',
  warning: 'fa-solid fa-triangle-exclamation',
  danger: 'fa-solid fa-circle-exclamation',
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

export function Alert({ variant = 'info', title, children, onClose, style }: AlertProps) {
  return (
    <div className={`alert alert-${variant}`} role={variant === 'danger' ? 'alert' : 'status'} style={style}>
      <i className={icons[variant]} aria-hidden="true" />
      <div>
        {title && (
          <>
            <b>{title}</b>{' '}
          </>
        )}
        {children}
      </div>
      {onClose && (
        <button type="button" className="close" onClick={onClose} aria-label="Lukk">
          <i className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
}
