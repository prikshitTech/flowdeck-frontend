import { useState } from 'react';

import ActivityChart from './ActivityChart';
import { Avatar, Badge, PageHeader, Panel, StatTile } from '@/components/ui/Display';
import { PageLoader } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/FormField';
import { insightApi } from '@/api/services';
import useRequest from '@/hooks/useRequest';
import { useAppSelector } from '@/store/hooks';
import { getErrorMessage } from '@/utils/errors';

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' }
];

export default function OverviewScreen() {
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const [days, setDays] = useState(30);

  const overview = useRequest(() => insightApi.overview(workspace.id, days), [workspace.id, days]);
  const leaderboard = useRequest(() => insightApi.memberActivity(workspace.id, days), [workspace.id, days]);

  const rangePicker = (
    <Select
      aria-label="Time range"
      value={String(days)}
      options={RANGES}
      onChange={(event) => setDays(Number(event.target.value))}
      className="w-40"
    />
  );

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageHeader
        title={workspace.name}
        description={workspace.description || 'Workspace activity at a glance.'}
        actions={rangePicker}
      />

      {overview.loading && !overview.data && <PageLoader />}
      {overview.error != null && <p className="text-sm text-red-600">{getErrorMessage(overview.error)}</p>}

      {overview.data && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Pages" value={overview.data.pages.total} />
            <StatTile label="Open cards" value={overview.data.cards.open} hint={`${overview.data.cards.overdue} overdue`} />
            <StatTile
              label="Completed cards"
              value={overview.data.cards.completed}
              hint={`${overview.data.cards.averageCycleHours}h average cycle`}
            />
            <StatTile label="Messages" value={overview.data.messages.total} />
          </div>

          <Panel className="p-4">
            <h2 className="mb-4 text-sm font-medium">Messages per day</h2>
            <ActivityChart title="Messages per day" unit="messages" data={overview.data.messages.perDay} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="p-4">
              <h2 className="mb-3 text-sm font-medium">Most active members</h2>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {leaderboard.data?.map((row) => (
                  <li key={row.user.id} className="flex items-center gap-3 py-2 text-sm">
                    <Avatar name={row.user.name} size="sm" />
                    <span className="flex-1 truncate">{row.user.name}</span>
                    <span className="text-xs text-stone-500">
                      {row.messages} msgs · {row.pageEdits} edits · {row.cardsCompleted} done
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-4">
              <h2 className="mb-3 text-sm font-medium">Cards by priority</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {overview.data.cards.byPriority.map((row) => (
                  <li key={row.priority} className="flex items-center justify-between">
                    <Badge tone={row.priority === 'urgent' ? 'danger' : row.priority === 'high' ? 'warning' : 'neutral'}>
                      {row.priority}
                    </Badge>
                    <span className="text-stone-600 dark:text-stone-300">{row.count}</span>
                  </li>
                ))}
                {overview.data.cards.byPriority.length === 0 && <li className="text-stone-500">No cards yet.</li>}
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
