import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';
import { useBodyLock } from './useBodyLock';

interface ModalProps {
  open: boolean;
  title: string;
  icon?: ReactNode;
  size?: 'lg';
  onClose: () => void;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Modal({ open, title, icon, size, onClose, footer, children }: ModalProps) {
  useBodyLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={size ? `modal modal-${size}` : 'modal'} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          {icon}
          <h3>{title}</h3>
          <button type="button" className="close" onClick={onClose} aria-label="Lukk">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Bekreft',
  cancelLabel = 'Avbryt',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      icon={
        <i
          className={danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'}
          style={{ color: danger ? 'var(--danger)' : 'var(--primary-dark)', fontSize: 22 }}
        />
      }
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            icon={danger ? 'fa-solid fa-trash' : undefined}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ margin: 0 }}>{message}</div>
    </Modal>
  );
}
