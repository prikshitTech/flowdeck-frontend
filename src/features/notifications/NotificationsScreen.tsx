import { memo, useCallback, useEffect } from 'react';
import { FiAtSign, FiBell, FiCalendar, FiCheck, FiClipboard } from 'react-icons/fi';

import Button from '@/components/ui/Button';
import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import useNotify from '@/hooks/useNotify';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Display';
import {
  fetchNotificationPage,
  markAllNotificationsRead,
  markNotificationRead
} from '@/store/slices/notificationSlice';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { AppNotification } from '@/types/models';

const ICONS: Record<string, typeof FiBell> = {
  mention: FiAtSign,
  card_assigned: FiClipboard,
  card_due_soon: FiCalendar
};

const NotificationRow = memo(function NotificationRow({
  notification,
  onRead
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const Icon = ICONS[notification.type] ?? FiBell;
  const unread = !notification.readAt;

  return (
    <li className={cn('flex items-start gap-3 px-4 py-3', unread && 'bg-brand-50/60 dark:bg-brand-800/10')}>
      <span className="mt-0.5 text-stone-500">
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', unread && 'font-medium')}>{notification.title}</p>
        {notification.body && <p className="truncate text-sm text-stone-500">{notification.body}</p>}
        <p className="mt-0.5 text-xs text-stone-400">{timeAgo(notification.createdAt)}</p>
      </div>
      {unread && (
        <Button size="sm" variant="ghost" icon={<FiCheck />} onClick={() => onRead(notification.id)}>
          Mark read
        </Button>
      )}
    </li>
  );
});

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { items, page, hasMore, loading, unread } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotificationPage(1));
  }, [dispatch]);

  const loadMore = useCallback(() => {
    dispatch(fetchNotificationPage(page + 1));
  }, [dispatch, page]);

  const markRead = useCallback(
    (id: string) => {
      dispatch(markNotificationRead(id))
        .unwrap()
        .catch((error) => notify.error(error));
    },
    [dispatch, notify]
  );

  const markAll = () => {
    dispatch(markAllNotificationsRead())
      .unwrap()
      .catch((error) => notify.error(error));
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : 'You are all caught up.'}
        actions={
          unread > 0 && (
            <Button variant="secondary" icon={<FiCheck />} onClick={markAll}>
              Mark all read
            </Button>
          )
        }
      />
      <Panel>
        {!loading && items.length === 0 ? (
          <EmptyState icon={<FiBell />} title="Nothing here yet" message="Mentions, assignments and due dates show up here." />
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onRead={markRead} />
            ))}
          </ul>
        )}
        <LoadMoreSentinel hasMore={hasMore && page > 0} loading={loading} onLoadMore={loadMore} />
      </Panel>
    </div>
  );
}
