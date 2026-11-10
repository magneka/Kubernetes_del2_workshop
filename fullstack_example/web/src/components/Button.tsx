import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'soft' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconOnly?: boolean;
  tip?: string;
  children?: ReactNode;
}

function classes(variant: ButtonVariant, size?: ButtonSize, iconOnly?: boolean, extra?: string) {
  return ['btn', `btn-${variant}`, size && `btn-${size}`, iconOnly && 'btn-icon', extra].filter(Boolean).join(' ');
}

export interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size,
  icon,
  iconOnly,
  tip,
  loading = false,
  className,
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, iconOnly, className)}
      disabled={disabled || loading}
      data-tip={tip}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner sm" aria-hidden="true" /> : icon && <i className={icon} aria-hidden="true" />}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends CommonProps, Omit<LinkProps, 'children'> {}

export function ButtonLink({ variant = 'primary', size, icon, iconOnly, tip, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, iconOnly, className)} data-tip={tip} {...rest}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
    </Link>
  );
}
