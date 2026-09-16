import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiClock, FiCornerUpRight, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RevisionsModal from './RevisionsModal';
import useNotify from '@/hooks/useNotify';
import { Select } from '@/components/ui/FormField';
import { archivePage, movePage, savePage } from '@/store/slices/pageSlice';
import { requiredText } from '@/utils/validation';
import { timeAgo } from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { PageDetail, PageTreeNode } from '@/types/models';

const schema = z.object({
  title: requiredText('Title', 160),
  body: z.string().max(100000, 'This page is too long')
});

type PageValues = z.infer<typeof schema>;

function flatten(nodes: PageTreeNode[], excludeId: string): { value: string; label: string }[] {
  return nodes.flatMap((node) =>
    node.id === excludeId
      ? []
      : [{ value: node.id, label: `${'  '.repeat(node.depth)}${node.title}` }, ...flatten(node.children, excludeId)]
  );
}

interface PageEditorProps {
  page: PageDetail;
  workspaceId: string;
  canWrite: boolean;
}

export default function PageEditor({ page, workspaceId, canWrite }: PageEditorProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const tree = useAppSelector((state) => state.pages.tree);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<PageValues>({
    resolver: zodResolver(schema),
    values: { title: page.title, body: page.body }
  });

  const parentOptions = useMemo(
    () => [{ value: '', label: 'Top level' }, ...flatten(tree, page.id)],
    [tree, page.id]
  );

  const onSave = handleSubmit(async (values) => {
    try {
      await dispatch(savePage({ workspaceId, pageId: page.id, ...values })).unwrap();
      reset(values);
    } catch (error) {
      notify.error(error);
    }
  });

  const onMove = async (parent: string) => {
    try {
      await dispatch(movePage({ workspaceId, pageId: page.id, parent: parent || null })).unwrap();
      notify.success('Page moved');
    } catch (error) {
      notify.error(error);
    }
  };

  const onArchive = async () => {
    try {
      await dispatch(archivePage({ workspaceId, pageId: page.id })).unwrap();
      navigate(`/w/${workspaceId}/pages`, { replace: true });
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <form onSubmit={onSave} className="flex h-full flex-col" noValidate>
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-2 dark:border-stone-800">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-xs text-stone-500">
          {page.breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1 truncate">
              <Link to={`/w/${workspaceId}/pages/${crumb.id}`} className="hover:underline">
                {crumb.title}
              </Link>
              /
            </span>
          ))}
          <span className="truncate">v{page.version} · edited {timeAgo(page.updatedAt)}</span>
        </nav>
        <Button size="sm" variant="ghost" icon={<FiClock />} onClick={() => setShowHistory(true)}>
          History
        </Button>
        {canWrite && (
          <>
            <label className="flex items-center gap-1 text-xs text-stone-500">
              <FiCornerUpRight />
              <span className="sr-only">Move under</span>
              <Select
                aria-label="Move page under"
                value={page.parent ?? ''}
                options={parentOptions}
                onChange={(event) => onMove(event.target.value)}
                className="h-8 w-40"
              />
            </label>
            <Button size="sm" variant="ghost" icon={<FiTrash2 />} onClick={() => setConfirmArchive(true)}>
              Archive
            </Button>
            <Button size="sm" type="submit" disabled={!isDirty} loading={isSubmitting}>
              Save
            </Button>
          </>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 py-6 sm:px-8">
        <input
          aria-label="Page title"
          readOnly={!canWrite}
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-stone-300"
          placeholder="Untitled"
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
        <textarea
          aria-label="Page content"
          readOnly={!canWrite}
          className="min-h-[50vh] w-full flex-1 resize-none bg-transparent text-[15px] leading-7 outline-none placeholder:text-stone-400"
          placeholder={canWrite ? 'Start writing…' : 'This page is empty.'}
          {...register('body')}
        />
      </div>

      {showHistory && (
        <RevisionsModal
          open
          workspaceId={workspaceId}
          pageId={page.id}
          currentVersion={page.version}
          canWrite={canWrite}
          onClose={() => setShowHistory(false)}
        />
      )}
      <ConfirmDialog
        open={confirmArchive}
        title="Archive page"
        message="This page and every page inside it will be archived."
        confirmLabel="Archive"
        onConfirm={onArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </form>
  );
}
