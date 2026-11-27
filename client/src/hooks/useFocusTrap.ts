import { useEffect, useEffectEvent } from 'react';
import type { RefObject } from 'react';

/** Elements that can receive keyboard focus. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus inside the container, moves focus into it on mount, closes on Escape,
 * and returns focus to the previously focused element on unmount.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, onEscape: () => void): void {
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusableElements = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    (getFocusableElements()[0] ?? container).focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleEscape();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const isFocusOutside = !(activeElement instanceof Node) || !container.contains(activeElement);

      if (event.shiftKey && (activeElement === firstElement || activeElement === container || isFocusOutside)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || isFocusOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [containerRef]);
}
