import { useEffect } from 'react';

/**
 * Scroll to top of the viewport smoothly whenever any dependency changes.
 */
export function useScrollToTop(deps: unknown[] = []) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, deps);
}
