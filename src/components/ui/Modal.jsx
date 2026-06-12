/**
 * Modal.jsx
 * ─────────────────────────────────────────────────
 * Reusable modal dialog with backdrop blur, slide-in
 * animation, escape key close, backdrop click close,
 * and focus trap.
 * ─────────────────────────────────────────────────
 */

import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/* ============================================================
   Size Variants
   ============================================================ */

const SIZE_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

/* ============================================================
   Component
   ============================================================ */

/**
 * Modal — premium dialog overlay with animations.
 *
 * @param {Object} props
 * @param {boolean}        props.isOpen   — Controls visibility
 * @param {Function}       props.onClose  — Close handler
 * @param {string}         props.title    — Modal header title
 * @param {React.ReactNode} props.children — Modal body content
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size — Modal width
 * @param {string}         props.id       — Unique ID
 * @param {boolean}        props.showCloseButton — Show X button (default true)
 * @param {React.ReactNode} props.footer  — Optional footer content
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  id,
  showCloseButton = true,
  footer,
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  /* ────────────────────────────────────────────
     Escape Key Handler
     ──────────────────────────────────────────── */

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /* ────────────────────────────────────────────
     Backdrop Click Handler
     ──────────────────────────────────────────── */

  const handleBackdropClick = useCallback(
    (e) => {
      // Only close if clicking the backdrop itself, not modal content
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  /* ────────────────────────────────────────────
     Focus Trap
     ──────────────────────────────────────────── */

  const handleTabKey = useCallback((e) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  /* ────────────────────────────────────────────
     Effects
     ──────────────────────────────────────────── */

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element to restore later
      previousFocusRef.current = document.activeElement;

      // Prevent body scrolling
      document.body.style.overflow = 'hidden';

      // Add event listeners
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);

      // Focus the modal itself
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
    } else {
      // Restore body scrolling
      document.body.style.overflow = '';

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape, handleTabKey]);

  /* ────────────────────────────────────────────
     Render
     ──────────────────────────────────────────── */

  if (!isOpen) return null;

  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id || 'modal'}-title` : undefined}
      className={
        `fixed inset-0 z-50 flex items-center justify-center p-4 ` +
        `bg-black/40 backdrop-blur-sm ` +
        `animate-[backdrop-fade_0.2s_ease-out]`
      }
      onClick={handleBackdropClick}
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={
          `${sizeClass} w-full bg-white rounded-2xl shadow-2xl ` +
          `border border-slate-200/60 ` +
          `animate-[modal-slide-up_0.3s_ease-out] ` +
          `max-h-[90vh] flex flex-col ` +
          `outline-none`
        }
      >
        {/* ── Header ────────────────────────── */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            {title && (
              <h2
                id={`${id || 'modal'}-title`}
                className="text-lg font-semibold text-slate-800"
              >
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className={
                  `p-2 rounded-lg text-slate-400 ` +
                  `hover:text-slate-600 hover:bg-slate-100 ` +
                  `transition-colors duration-150 ` +
                  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ` +
                  `cursor-pointer`
                }
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* ── Body ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* ── Footer (optional) ─────────────── */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
