import { useState } from 'react';

import Button from '@/components/ui/Button';
import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import Modal from '@/components/ui/Modal';
import useInfiniteList from '@/hooks/useInfiniteList';
import useNotify from '@/hooks/useNotify';
import { pageApi } from '@/api/services';
import { restoreRevision } from '@/store/slices/pageSlice';
import { timeAgo } from '@/utils/format';
import { useAppDispatch } from '@/store/hooks';

interface RevisionsModalProps {
  open: boolean;
  workspaceId: string;
  pageId: string;
  currentVersion: number;
  canWrite: boolean;
  onClose: () => void;
}

export default function RevisionsModal({ open, workspaceId, pageId, currentVersion, canWrite, onClose }: RevisionsModalProps) {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [restoring, setRestoring] = useState<number | null>(null);

  const revisions = useInfiniteList(
    (page) => pageApi.revisions(workspaceId, pageId, { page, limit: 20 }),
    `${pageId}:${currentVersion}`
  );

  const restore = async (version: number) => {
    setRestoring(version);

    try {
      await dispatch(restoreRevision({ workspaceId, pageId, version })).unwrap();
      notify.success(`Restored version ${version}`);
      onClose();
    } catch (error) {
      notify.error(error);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Modal open={open} title="Page history" onClose={onClose}>
      <p className="mb-3 text-sm text-stone-500">Current version is {currentVersion}. Restoring keeps a copy of it.</p>
      <ul className="divide-y divide-stone-100 dark:divide-stone-800">
        {revisions.items.map((revision) => (
          <li key={revision.id} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                v{revision.version} · {revision.title}
              </p>
              <p className="text-xs text-stone-500">
                {revision.editedBy ?? 'Someone'} · {timeAgo(revision.createdAt)}
              </p>
            </div>
            {canWrite && (
              <Button
                size="sm"
                variant="secondary"
                loading={restoring === revision.version}
                disabled={restoring !== null}
                onClick={() => restore(revision.version)}
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!revisions.loading && revisions.items.length === 0 && (
        <p className="py-6 text-center text-sm text-stone-500">No earlier versions yet.</p>
      )}
      <LoadMoreSentinel hasMore={revisions.hasMore} loading={revisions.loading} onLoadMore={revisions.loadMore} />
    </Modal>
  );
}
