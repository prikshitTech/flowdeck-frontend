import { useCallback, useEffect, useRef, useState } from 'react';

import type { ListResult } from '@/types/api';

export default function useInfiniteList<T extends { id: string }>(
  fetchPage: (page: number) => Promise<ListResult<T>>,
  resetKey: string
) {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const pageRef = useRef(0);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const loadMore = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    const generation = generationRef.current;
    setLoading(true);

    try {
      const { items: nextItems, meta } = await fetchRef.current(pageRef.current + 1);

      if (generation !== generationRef.current) {
        return;
      }

      pageRef.current = meta.page;
      setItems((previous) => {
        const known = new Set(previous.map((item) => item.id));
        return [...previous, ...nextItems.filter((item) => !known.has(item.id))];
      });
      setHasMore(meta.hasNext);
      setError(null);
    } catch (caught) {
      if (generation === generationRef.current) {
        setError(caught);
        setHasMore(false);
      }
    } finally {
      if (generation === generationRef.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    generationRef.current += 1;
    pageRef.current = 0;
    busyRef.current = false;
    setItems([]);
    setHasMore(true);
    setError(null);
    loadMore();
  }, [resetKey, loadMore]);

  return { items, hasMore, loading, error, loadMore, setItems };
}
