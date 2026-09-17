import { memo, useCallback, useEffect } from 'react';
import type { IconType } from 'react-icons';
import {
  FiArchive,
  FiArrowRight,
  FiAtSign,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiKey,
  FiRotateCcw,
  FiShield,
  FiUserCheck,
  FiUserMinus,
  FiUserPlus,
  FiUserX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

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

const ICONS: Record<string, IconType> = {
  mention: FiAtSign,
  card_assigned: FiUserCheck,
  card_unassigned: FiUserMinus,
  card_moved: FiArrowRight,
  card_completed: FiCheckCircle,
  card_reopened: FiRotateCcw,
  card_updated: FiEdit3,
  card_archived: FiArchive,
  card_due_soon: FiCalendar,
  page_edited: FiEdit3,
  page_archived: FiArchive,
  member_added: FiUserPlus,
  member_role_changed: FiShield,
  member_removed: FiUserX,
  member_left: FiUserMinus,
  ownership_transferred: FiKey
};

interface NotificationRowProps {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
  onRead: (id: string) => void;
}

const NotificationRow = memo(function NotificationRow({ notification, onOpen, onRead }: NotificationRowProps) {
  const Icon = ICONS[notification.type] ?? FiBell;
  const unread = !notification.readAt;

  return (
    <li className={cn('flex items-start gap-3 px-4 py-3', unread && 'bg-brand-50/60 dark:bg-brand-800/10')}>
      <span className={cn('mt-0.5', unread ? 'text-brand-700 dark:text-brand-500' : 'text-stone-400')}>
        <Icon />
      </span>
      <button type="button" onClick={() => onOpen(notification)} className="min-w-0 flex-1 text-left">
        <p className={cn('text-sm', unread && 'font-medium')}>{notification.title}</p>
        {notification.body && <p className="truncate text-sm text-stone-500">{notification.body}</p>}
        <p className="mt-0.5 text-xs text-stone-400">{timeAgo(notification.createdAt)}</p>
      </button>
      {unread && (
        <Button size="sm" variant="ghost" icon={<FiCheck />} onClick={() => onRead(notification.id)}>
          <span className="hidden sm:inline">Mark read</span>
        </Button>
      )}
    </li>
  );
});

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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

  const open = useCallback(
    (notification: AppNotification) => {
      if (!notification.readAt) {
        markRead(notification.id);
      }

      if (notification.link) {
        navigate(notification.link);
      }
    },
    [markRead, navigate]
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
          <EmptyState
            icon={<FiBell />}
            title="Nothing here yet"
            message="Assignments, card changes, mentions and membership updates show up here."
          />
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {items.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpen={open} onRead={markRead} />
            ))}
          </ul>
        )}
        <LoadMoreSentinel hasMore={hasMore && page > 0} loading={loading} onLoadMore={loadMore} />
      </Panel>
    </div>
  );
}
