'use client';

import { useEffect, useRef } from 'react';

/**
 * Focus trap — keeps keyboard focus inside the container element
 * while `active` is true. Tab/Shift-Tab cycles within the container.
 *
 * On activation:  moves focus to the first focusable descendant and
 *                 saves the previously-focused element.
 * On deactivation: restores focus to the previously-focused element.
 *
 * Usage:
 *   const ref = useFocusTrap<HTMLDivElement>(isOpen);
 *   return <div ref={ref}>…</div>;
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean) {
  const containerRef    = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      previousFocusRef.current?.focus();
      return;
    }

    // Save the currently-focused element so we can restore it
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Move focus into the trap
    getFirstFocusable(containerRef.current)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusableElements(containerRef.current);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function getFirstFocusable(el: HTMLElement | null): HTMLElement | null {
  return getFocusableElements(el)[0] ?? null;
}
