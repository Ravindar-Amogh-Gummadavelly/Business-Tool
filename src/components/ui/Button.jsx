/**
 * Button.jsx
 * ─────────────────────────────────────────────────
 * Reusable button component with multiple variants,
 * sizes, loading state, and hover animations.
 * ─────────────────────────────────────────────────
 */

import { Loader2 } from 'lucide-react';

/* ============================================================
   Variant Style Maps
   ============================================================ */

const VARIANT_STYLES = {
  primary:
    'bg-gradient-to-r from-primary-600 to-primary-700 text-white ' +
    'hover:from-primary-500 hover:to-primary-600 ' +
    'shadow-md hover:shadow-lg hover:shadow-primary-500/25 ' +
    'active:from-primary-700 active:to-primary-800 ' +
    'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',

  secondary:
    'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white ' +
    'hover:from-secondary-400 hover:to-secondary-500 ' +
    'shadow-md hover:shadow-lg hover:shadow-secondary-500/25 ' +
    'active:from-secondary-600 active:to-secondary-700 ' +
    'focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2',

  danger:
    'bg-gradient-to-r from-red-500 to-red-600 text-white ' +
    'hover:from-red-400 hover:to-red-500 ' +
    'shadow-md hover:shadow-lg hover:shadow-red-500/25 ' +
    'active:from-red-600 active:to-red-700 ' +
    'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',

  ghost:
    'bg-transparent text-slate-600 ' +
    'hover:bg-slate-100 hover:text-slate-800 ' +
    'active:bg-slate-200 ' +
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',

  outline:
    'bg-white border-2 border-primary-300 text-primary-700 ' +
    'hover:bg-primary-50 hover:border-primary-400 ' +
    'active:bg-primary-100 ' +
    'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base font-semibold rounded-xl gap-2.5',
};

/* ============================================================
   Component
   ============================================================ */

/**
 * Button — premium styled button with variants, sizes, loading state.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} props.variant — Visual style
 * @param {'sm'|'md'|'lg'} props.size — Button size
 * @param {boolean} props.loading — Shows spinner and disables clicks
 * @param {boolean} props.disabled — Disables the button
 * @param {React.ComponentType} props.icon — Lucide icon component
 * @param {React.ReactNode} props.children — Button label / content
 * @param {Function} props.onClick — Click handler
 * @param {string} props.className — Additional CSS classes
 * @param {string} props.type — Button type attribute ('button', 'submit', 'reset')
 * @param {string} props.id — Unique ID for the button
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  children,
  onClick,
  className = '',
  type = 'button',
  id,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const baseStyles =
    'inline-flex items-center justify-center ' +
    'transition-all duration-200 ease-out ' +
    'transform hover:scale-[1.02] active:scale-[0.98] ' +
    'cursor-pointer select-none ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none';

  const variantStyles = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeStyles = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...rest}
    >
      {/* Loading spinner replaces icon when loading */}
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}

      {/* Label */}
      {children && <span>{children}</span>}
    </button>
  );
}
