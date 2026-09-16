import { useCallback, useEffect, useState } from 'react';
import { FiFileText, FiPlus } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageEditor from './PageEditor';
import PageTree from './PageTree';
import Spinner, { PageLoader } from '@/components/ui/Spinner';
import useNotify from '@/hooks/useNotify';
import { EmptyState } from '@/components/ui/Display';
import { Input } from '@/components/ui/FormField';
import { createPage, fetchPage, fetchPageTree } from '@/store/slices/pageSlice';
import { hasRole } from '@/utils/roles';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function PagesScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const { pageId } = useParams();
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const { tree, treeLoading, current, currentLoading } = useAppSelector((state) => state.pages);
  const [newParent, setNewParent] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const canWrite = hasRole(workspace.role, 'member');

  useEffect(() => {
    dispatch(fetchPageTree(workspace.id));
  }, [dispatch, workspace.id]);

  useEffect(() => {
    if (pageId) {
      dispatch(fetchPage({ workspaceId: workspace.id, pageId }));
    }
  }, [dispatch, workspace.id, pageId]);

  const openCreate = useCallback((parent: string | null) => {
    setTitle('');
    setNewParent(parent);
  }, []);

  const submitNewPage = async () => {
    if (!title.trim()) {
      return;
    }

    setCreating(true);

    try {
      const page = await dispatch(createPage({ workspaceId: workspace.id, title: title.trim(), parent: newParent ?? null })).unwrap();
      setNewParent(undefined);
      navigate(`/w/${workspace.id}/pages/${page.id}`);
    } catch (error) {
      notify.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="max-h-64 shrink-0 overflow-y-auto border-b border-stone-200 p-3 md:max-h-none md:w-64 md:border-r md:border-b-0 dark:border-stone-800">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Pages</h2>
          {canWrite && (
            <Button size="sm" variant="ghost" icon={<FiPlus />} onClick={() => openCreate(null)}>
              New
            </Button>
          )}
        </div>
        {treeLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <PageTree nodes={tree} workspaceId={workspace.id} canWrite={canWrite} onAddChild={openCreate} />
        )}
        {!treeLoading && tree.length === 0 && <p className="px-2 py-4 text-sm text-stone-500">No pages yet.</p>}
      </aside>

      <section className="min-h-0 flex-1 overflow-y-auto">
        {!pageId && (
          <EmptyState
            icon={<FiFileText />}
            title="Pick a page"
            message="Choose a page on the left, or start a new one for notes, specs or runbooks."
            action={canWrite && <Button onClick={() => openCreate(null)}>New page</Button>}
          />
        )}
        {pageId && currentLoading && <PageLoader />}
        {pageId && !currentLoading && current?.id === pageId && (
          <PageEditor key={current.id} page={current} workspaceId={workspace.id} canWrite={canWrite} />
        )}
        {pageId && !currentLoading && !current && (
          <EmptyState icon={<FiFileText />} title="Page not found" message="It may have been archived." />
        )}
      </section>

      <Modal
        open={newParent !== undefined}
        title={newParent ? 'New page inside' : 'New page'}
        size="sm"
        onClose={() => setNewParent(undefined)}
        footer={
          <Button onClick={submitNewPage} loading={creating} disabled={!title.trim()}>
            Create
          </Button>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitNewPage();
          }}
        >
          <Input label="Title" autoFocus value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} />
        </form>
      </Modal>
    </div>
  );
}
