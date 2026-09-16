import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

export default function useRequest<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<RequestState<T>>({ data: null, loading: true, error: null });
  const latestCall = useRef(0);

  const run = useCallback(async () => {
    const call = ++latestCall.current;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const data = await load();

      if (call === latestCall.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (call === latestCall.current) {
        setState((previous) => ({ ...previous, loading: false, error }));
      }
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((update: (current: T | null) => T | null) => {
    setState((previous) => ({ ...previous, data: update(previous.data) }));
  }, []);

  return { ...state, reload: run, setData };
}
