import { memo, useState } from 'react';
import { FiClipboard } from 'react-icons/fi';
import { Navigate } from 'react-router-dom';

import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import useInfiniteList from '@/hooks/useInfiniteList';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Display';
import { Select } from '@/components/ui/FormField';
import { auditApi } from '@/api/services';
import { formatDate, formatTime } from '@/utils/format';
import { hasRole } from '@/utils/roles';
import { useAppSelector } from '@/store/hooks';
import type { AuditEntry } from '@/types/models';

const ENTITY_OPTIONS = [
  { value: '', label: 'Everything' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'member', label: 'Members' },
  { value: 'page', label: 'Pages' },
  { value: 'board', label: 'Boards' },
  { value: 'card', label: 'Cards' },
  { value: 'channel', label: 'Channels' },
  { value: 'message', label: 'Messages' },
  { value: 'file', label: 'Files' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' }
];

function describe(action: string): string {
  const [entity, verb] = action.split('.');
  return `${verb.split('_').join(' ')} ${entity}`;
}

const AuditRow = memo(function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <tr className="border-b border-stone-100 text-sm last:border-0 dark:border-stone-800">
      <td className="px-4 py-2 whitespace-nowrap text-stone-500">
        {formatDate(entry.createdAt)} <span className="text-xs">{formatTime(entry.createdAt)}</span>
      </td>
      <td className="px-4 py-2">{entry.actor?.name ?? 'System'}</td>
      <td className="px-4 py-2 capitalize">{describe(entry.action)}</td>
      <td className="hidden px-4 py-2 font-mono text-xs text-stone-500 md:table-cell">{entry.ip ?? '—'}</td>
    </tr>
  );
});

function AuditLog({ workspaceId }: { workspaceId: string }) {
  const [entityType, setEntityType] = useState('');
  const [sort, setSort] = useState('newest');

  const entries = useInfiniteList(
    (page) => auditApi.list(workspaceId, { page, limit: 30, sort, entityType: entityType || undefined }),
    `${workspaceId}:${entityType}:${sort}`
  );

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageHeader title="Audit log" description="Every change made in this workspace, kept for 180 days." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Filter by type" value={entityType} options={ENTITY_OPTIONS} onChange={(event) => setEntityType(event.target.value)} className="w-44" />
        <Select aria-label="Sort order" value={sort} options={SORT_OPTIONS} onChange={(event) => setSort(event.target.value)} className="w-40" />
      </div>

      <Panel className="overflow-x-auto">
        {!entries.loading && entries.items.length === 0 ? (
          <EmptyState icon={<FiClipboard />} title="No entries match" />
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-stone-200 text-xs text-stone-500 uppercase dark:border-stone-800">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Who</th>
                <th className="px-4 py-2 font-medium">What</th>
                <th className="hidden px-4 py-2 font-medium md:table-cell">Address</th>
              </tr>
            </thead>
            <tbody>
              {entries.items.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        )}
        <LoadMoreSentinel hasMore={entries.hasMore} loading={entries.loading} onLoadMore={entries.loadMore} endLabel="End of the log" />
      </Panel>
    </div>
  );
}

export default function AuditScreen() {
  const workspace = useAppSelector((state) => state.workspaces.current)!;

  if (!hasRole(workspace.role, 'admin')) {
    return <Navigate to={`/w/${workspace.id}`} replace />;
  }

  return <AuditLog workspaceId={workspace.id} />;
}
