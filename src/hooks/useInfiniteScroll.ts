import { useCallback, useEffect, useRef } from 'react';

interface InfiniteScrollOptions {
  enabled: boolean;
  onReach: () => void;
  rootMargin?: string;
}

export default function useInfiniteScroll({ enabled, onReach, rootMargin = '200px' }: InfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null);
  const callback = useRef(onReach);
  callback.current = onReach;

  useEffect(() => () => observer.current?.disconnect(), []);

  return useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();

      if (!node || !enabled) {
        return;
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            callback.current();
          }
        },
        { rootMargin }
      );

      observer.current.observe(node);
    },
    [enabled, rootMargin]
  );
}
