/**
 * Spinner.jsx
 * ─────────────────────────────────────────────────
 * Animated spinning loader with size and color
 * variants. Matches the primary brand color.
 * ─────────────────────────────────────────────────
 */

/* ============================================================
   Size Configuration
   ============================================================ */

const SIZE_MAP = {
  sm: { dimension: 'w-5 h-5', border: 'border-2' },
  md: { dimension: 'w-8 h-8', border: 'border-[3px]' },
  lg: { dimension: 'w-12 h-12', border: 'border-4' },
};

/* ============================================================
   Component
   ============================================================ */

/**
 * Spinner — animated loading indicator.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size      — Spinner size
 * @param {string}          props.className — Additional CSS classes
 * @param {string}          props.color     — Tailwind border color class override
 * @param {string}          props.label     — Optional text label below spinner
 */
export default function Spinner({
  size = 'md',
  className = '',
  color,
  label,
}) {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  // Default color is primary-600, with a translucent track
  const colorClass = color || 'border-primary-600';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={label || 'Loading'}
    >
      {/* Spinning circle */}
      <div
        className={
          `${config.dimension} ${config.border} ` +
          `rounded-full ` +
          `border-slate-200 ` +
          `${colorClass} ` +
          `border-t-transparent ` +
          `animate-[spinner-rotate_0.7s_linear_infinite]`
        }
      />

      {/* Optional label */}
      {label && (
        <span className="text-sm text-slate-500 font-medium animate-pulse">
          {label}
        </span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">{label || 'Loading…'}</span>
    </div>
  );
}

/* ============================================================
   Page-Level Loading Overlay
   ============================================================ */

/**
 * FullPageSpinner — centered spinner that fills its
 * parent container. Use for page-level loading states.
 *
 * @param {Object} props
 * @param {string} props.label — Loading message
 */
export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Spinner size="lg" label={label} />
    </div>
  );
}

/**
 * InlineSpinner — small inline spinner for buttons
 * or text. Uses sm size by default.
 *
 * @param {Object} props
 * @param {string} props.className — Additional classes
 */
export function InlineSpinner({ className = '' }) {
  return <Spinner size="sm" className={`inline-flex ${className}`} />;
}
