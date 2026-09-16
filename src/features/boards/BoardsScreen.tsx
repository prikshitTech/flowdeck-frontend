import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrello } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import Modal from '@/components/ui/Modal';
import useInfiniteList from '@/hooks/useInfiniteList';
import useNotify from '@/hooks/useNotify';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Display';
import { Input, Textarea } from '@/components/ui/FormField';
import { boardApi } from '@/api/services';
import { hasRole } from '@/utils/roles';
import { requiredText } from '@/utils/validation';
import { timeAgo } from '@/utils/format';
import { useAppSelector } from '@/store/hooks';
import type { BoardSummary } from '@/types/models';

const schema = z.object({
  name: requiredText('Name', 120),
  description: z.string().trim().max(400).optional()
});

type BoardValues = z.infer<typeof schema>;

const BoardCard = memo(function BoardCard({ board, workspaceId }: { board: BoardSummary; workspaceId: string }) {
  const progress = board.cardCount === 0 ? 0 : Math.round((board.completedCount / board.cardCount) * 100);

  return (
    <Link to={`/w/${workspaceId}/boards/${board.id}`}>
      <Panel className="flex h-full flex-col gap-2 p-4 hover:border-stone-400 dark:hover:border-stone-600">
        <h2 className="font-medium">{board.name}</h2>
        <p className="line-clamp-2 flex-1 text-sm text-stone-500">{board.description || 'No description'}</p>
        <div className="h-1.5 overflow-hidden rounded bg-stone-100 dark:bg-stone-800">
          <div className="h-full bg-brand-600" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-stone-500">
          {board.completedCount} of {board.cardCount} cards done · updated {timeAgo(board.updatedAt)}
        </p>
      </Panel>
    </Link>
  );
});

export default function BoardsScreen() {
  const notify = useNotify();
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const [creating, setCreating] = useState(false);
  const [version, setVersion] = useState(0);
  const canWrite = hasRole(workspace.role, 'member');

  const boards = useInfiniteList((page) => boardApi.list(workspace.id, { page, limit: 18 }), `${workspace.id}:${version}`);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BoardValues>({ resolver: zodResolver(schema) });

  const onCreate = handleSubmit(async (values) => {
    try {
      await boardApi.create(workspace.id, values);
      notify.success('Board created with Backlog, In Progress, Review and Done');
      reset();
      setCreating(false);
      setVersion((value) => value + 1);
    } catch (error) {
      notify.error(error);
    }
  });

  const newButton = canWrite && (
    <Button icon={<FiPlus />} onClick={() => setCreating(true)}>
      New board
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageHeader title="Boards" description="Track work from backlog to done." actions={newButton} />

      {!boards.loading && boards.items.length === 0 && (
        <Panel>
          <EmptyState icon={<FiTrello />} title="No boards yet" message="Boards start with four lists you can rename." action={newButton} />
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.items.map((board) => (
          <BoardCard key={board.id} board={board} workspaceId={workspace.id} />
        ))}
      </div>
      <LoadMoreSentinel hasMore={boards.hasMore} loading={boards.loading} onLoadMore={boards.loadMore} />

      <Modal
        open={creating}
        title="New board"
        onClose={() => setCreating(false)}
        footer={
          <Button type="submit" form="create-board" loading={isSubmitting}>
            Create
          </Button>
        }
      >
        <form id="create-board" onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
          <Input label="Name" placeholder="Sprint 12" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" error={errors.description?.message} {...register('description')} />
        </form>
      </Modal>
    </div>
  );
}
