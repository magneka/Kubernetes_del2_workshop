import { forwardRef, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FormGroupProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  help?: ReactNode;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function FormGroup({ label, htmlFor, required, help, error, disabled, className, style, children }: FormGroupProps) {
  const cls = ['form-group', error && 'invalid', disabled && 'disabled', className].filter(Boolean).join(' ');
  return (
    <div className={cls} data-required={required || undefined} style={style}>
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required && <> <span className="req">*</span></>}
      </label>
      {children}
      {help && <span className="form-help">{help}</span>}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

const join = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={join('form-control', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...rest },
  ref,
) {
  return <select ref={ref} className={join('form-select', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 3, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={join('form-control', className)} {...rest} />;
});

type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode };

// <label class="choice"><input type="checkbox|radio"/> Label</label>
export function Choice({ label, disabled, radio, ...rest }: CheckProps & { radio?: boolean }) {
  return (
    <label className={disabled ? 'choice disabled' : 'choice'}>
      <input type={radio ? 'radio' : 'checkbox'} disabled={disabled} {...rest} /> {label}
    </label>
  );
}

// <label class="switch"><input type="checkbox"/><span class="track"></span> Label</label>
export function Switch({ label, style, ...rest }: CheckProps) {
  return (
    <label className="switch" style={style}>
      <input type="checkbox" {...rest} />
      <span className="track" /> {label}
    </label>
  );
}

export function Range(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="range" {...props} />;
}
