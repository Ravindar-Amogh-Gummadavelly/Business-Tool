/**
 * Select.jsx
 * ─────────────────────────────────────────────────
 * Reusable dropdown select component styled to
 * match the Input component's visual design.
 * ─────────────────────────────────────────────────
 */

import { ChevronDown } from 'lucide-react';

/**
 * Select — premium styled dropdown select.
 *
 * @param {Object} props
 * @param {string}   props.label       — Label text
 * @param {Array}    props.options     — Array of { value, label } objects
 * @param {string}   props.value       — Currently selected value
 * @param {Function} props.onChange    — Change handler (receives event)
 * @param {string}   props.placeholder — Placeholder text (first disabled option)
 * @param {string}   props.error       — Error message
 * @param {boolean}  props.required    — Required field indicator
 * @param {boolean}  props.disabled    — Disabled state
 * @param {string}   props.id          — Unique ID
 * @param {string}   props.className   — Additional CSS classes
 * @param {React.ComponentType} props.icon — Lucide icon component (left side)
 */
export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  id,
  className = '',
  icon: Icon,
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

      {/* Select wrapper */}
      <div
        className={
          `relative flex items-center rounded-xl border bg-white ` +
          `transition-all duration-200 ease-out ` +
          `focus-within:ring-2 focus-within:ring-offset-0 ` +
          `${borderColor} ` +
          `${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'hover:border-slate-300'}`
        }
      >
        {/* Left icon */}
        {Icon && (
          <span className="pl-3 text-slate-400 flex-shrink-0">
            <Icon size={18} />
          </span>
        )}

        {/* Select element */}
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={
            `w-full px-3 py-2.5 bg-transparent text-sm ` +
            `outline-none border-none appearance-none cursor-pointer ` +
            `disabled:cursor-not-allowed ` +
            `${value ? 'text-slate-800' : 'text-slate-400'} ` +
            `${!Icon ? 'rounded-l-xl' : ''} ` +
            `rounded-r-xl pr-10`
          }
          {...rest}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <span className="absolute right-3 text-slate-400 pointer-events-none">
          <ChevronDown size={18} />
        </span>
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
    </div>
  );
}
