import Spinner from '@/components/ui/Spinner';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';

interface LoadMoreSentinelProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  endLabel?: string;
}

export default function LoadMoreSentinel({ hasMore, loading, onLoadMore, endLabel }: LoadMoreSentinelProps) {
  const sentinelRef = useInfiniteScroll({ enabled: hasMore && !loading, onReach: onLoadMore });

  return (
    <div ref={sentinelRef} className="flex min-h-10 items-center justify-center py-3 text-xs text-stone-400">
      {loading && <Spinner size="sm" />}
      {!loading && !hasMore && endLabel}
    </div>
  );
}
