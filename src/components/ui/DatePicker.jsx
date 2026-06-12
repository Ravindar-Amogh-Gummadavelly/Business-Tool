/**
 * DatePicker.jsx
 * ─────────────────────────────────────────────────
 * Styled wrapper around the native HTML date input,
 * visually consistent with Input and Select components.
 * ─────────────────────────────────────────────────
 */

import { Calendar } from 'lucide-react';

/**
 * DatePicker — premium styled date input.
 *
 * @param {Object} props
 * @param {string}   props.label    — Label text
 * @param {string}   props.value    — Current value (YYYY-MM-DD)
 * @param {Function} props.onChange — Change handler (receives event)
 * @param {string}   props.min      — Minimum date (YYYY-MM-DD)
 * @param {string}   props.max      — Maximum date (YYYY-MM-DD)
 * @param {boolean}  props.required — Required field indicator
 * @param {boolean}  props.disabled — Disabled state
 * @param {string}   props.id       — Unique ID
 * @param {string}   props.error    — Error message
 * @param {string}   props.className — Additional CSS classes
 * @param {string}   props.helpText — Helper text
 */
export default function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  id,
  error,
  className = '',
  helpText,
  ...rest
}) {
  // Dynamic border color based on state
  const borderColor = error
    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-200'
    : 'border-slate-200 focus-within:border-primary-400 focus-within:ring-primary-200';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 flex items-center gap-1"
        >
          {label}
          {required && (
            <span className="text-red-500 text-xs" aria-label="required">*</span>
          )}
        </label>
      )}

      {/* Date input wrapper */}
      <div
        className={
          `flex items-center rounded-xl border bg-white ` +
          `transition-all duration-200 ease-out ` +
          `focus-within:ring-2 focus-within:ring-offset-0 ` +
          `${borderColor} ` +
          `${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'hover:border-slate-300'}`
        }
      >
        {/* Calendar icon */}
        <span className="pl-3 text-slate-400 flex-shrink-0">
          <Calendar size={18} />
        </span>

        {/* Native date input */}
        <input
          id={id}
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          className={
            `w-full px-3 py-2.5 bg-transparent text-slate-800 text-sm ` +
            `outline-none border-none cursor-pointer ` +
            `disabled:cursor-not-allowed ` +
            `rounded-r-xl ` +
            /* Style the date input placeholder color */
            `[&::-webkit-datetime-edit-text]:text-slate-400 ` +
            `[&::-webkit-calendar-picker-indicator]:cursor-pointer ` +
            `[&::-webkit-calendar-picker-indicator]:opacity-50 ` +
            `[&::-webkit-calendar-picker-indicator]:hover:opacity-100 ` +
            `[&::-webkit-calendar-picker-indicator]:transition-opacity`
          }
          {...rest}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5 animate-fade-in">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p className="text-xs text-slate-400 mt-0.5">{helpText}</p>
      )}
    </div>
  );
}
