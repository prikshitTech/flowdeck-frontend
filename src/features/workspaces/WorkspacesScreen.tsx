import { memo, useState } from 'react';
import { FiGrid, FiPlus, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import Button from '@/components/ui/Button';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Display';
import { PageLoader } from '@/components/ui/Spinner';
import { timeAgo } from '@/utils/format';
import { useAppSelector } from '@/store/hooks';
import type { WorkspaceSummary } from '@/types/models';

const WorkspaceCard = memo(function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  return (
    <Link to={`/w/${workspace.id}`} className="block focus-visible:outline-2 focus-visible:outline-brand-600">
      <Panel className="flex h-full flex-col gap-3 p-4 hover:border-stone-400 dark:hover:border-stone-600">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-medium text-stone-900 dark:text-stone-100">{workspace.name}</h2>
          <Badge tone={workspace.role === 'owner' ? 'brand' : 'neutral'}>{workspace.role}</Badge>
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-stone-500">{workspace.description || 'No description yet'}</p>
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <FiUsers /> {workspace.memberCount}
          </span>
          <span>Updated {timeAgo(workspace.updatedAt)}</span>
        </div>
      </Panel>
    </Link>
  );
});

export default function WorkspacesScreen() {
  const [creating, setCreating] = useState(false);
  const { items, listStatus } = useAppSelector((state) => state.workspaces);

  const newButton = (
    <Button icon={<FiPlus />} onClick={() => setCreating(true)}>
      New workspace
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageHeader title="Workspaces" description="Everything your teams are working on." actions={newButton} />

      {listStatus === 'loading' && <PageLoader />}

      {listStatus !== 'loading' && items.length === 0 && (
        <Panel>
          <EmptyState
            icon={<FiGrid />}
            title="No workspaces yet"
            message="Create one for your team, then invite people by email."
            action={newButton}
          />
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
      </div>

      <CreateWorkspaceModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
