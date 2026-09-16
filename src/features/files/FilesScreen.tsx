import { memo, useCallback, useRef, useState, type ChangeEvent } from 'react';
import { FiDownload, FiFile, FiFolder, FiTrash2, FiUpload } from 'react-icons/fi';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import IconButton from '@/components/ui/IconButton';
import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import useInfiniteList from '@/hooks/useInfiniteList';
import useNotify from '@/hooks/useNotify';
import useRequest from '@/hooks/useRequest';
import { EmptyState, PageHeader, Panel, StatTile } from '@/components/ui/Display';
import { fileApi } from '@/api/services';
import { formatBytes, timeAgo } from '@/utils/format';
import { hasRole } from '@/utils/roles';
import { useAppSelector } from '@/store/hooks';
import type { FileAsset } from '@/types/models';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

interface FileRowProps {
  file: FileAsset;
  canDelete: boolean;
  onDownload: (file: FileAsset) => void;
  onDelete: (file: FileAsset) => void;
}

const FileRow = memo(function FileRow({ file, canDelete, onDownload, onDelete }: FileRowProps) {
  const uploader = typeof file.uploadedBy === 'string' ? '' : file.uploadedBy.name;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FiFile className="shrink-0 text-stone-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.originalName}</p>
        <p className="truncate text-xs text-stone-500">
          {formatBytes(file.size)} · {file.mimeType} · {uploader && `${uploader} · `}
          {timeAgo(file.createdAt)}
        </p>
      </div>
      <IconButton label={`Download ${file.originalName}`} icon={<FiDownload />} onClick={() => onDownload(file)} />
      {canDelete && <IconButton label={`Delete ${file.originalName}`} icon={<FiTrash2 />} onClick={() => onDelete(file)} />}
    </li>
  );
});

export default function FilesScreen() {
  const notify = useNotify();
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const picker = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<FileAsset | null>(null);
  const [version, setVersion] = useState(0);

  const canWrite = hasRole(workspace.role, 'member');
  const isAdmin = hasRole(workspace.role, 'admin');

  const files = useInfiniteList((page) => fileApi.list(workspace.id, { page, limit: 25 }), `${workspace.id}:${version}`);
  const usage = useRequest(() => fileApi.usage(workspace.id), [workspace.id, version]);

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      notify.info(`${file.name} is larger than the 50 MB limit`);
      return;
    }

    setProgress(0);

    try {
      const saved = await fileApi.upload(workspace.id, file, setProgress);
      notify.success(saved.deduplicated ? `${file.name} was already stored, reused the existing copy` : `${file.name} uploaded`);
      setVersion((value) => value + 1);
    } catch (error) {
      notify.error(error);
    } finally {
      setProgress(null);
    }
  };

  const download = useCallback(
    async (file: FileAsset) => {
      try {
        const blob = await fileApi.download(workspace.id, file.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        notify.error(error);
      }
    },
    [notify, workspace.id]
  );

  const setFiles = files.setItems;

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }

    const target = toDelete;
    setToDelete(null);
    setFiles((items) => items.filter((item) => item.id !== target.id));

    try {
      await fileApi.remove(workspace.id, target.id);
      usage.reload();
    } catch (error) {
      notify.error(error);
      setVersion((value) => value + 1);
    }
  };

  const canDelete = (file: FileAsset) =>
    canWrite && (isAdmin || (typeof file.uploadedBy !== 'string' && file.uploadedBy.id === userId));

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <PageHeader
        title="Files"
        description="Uploads stream straight to storage, so large files are fine up to 50 MB."
        actions={
          canWrite && (
            <>
              <input ref={picker} type="file" className="hidden" onChange={onPick} />
              <Button icon={<FiUpload />} loading={progress !== null} onClick={() => picker.current?.click()}>
                {progress !== null ? `Uploading ${progress}%` : 'Upload file'}
              </Button>
            </>
          )
        }
      />

      {progress !== null && (
        <div className="mb-4 h-1.5 overflow-hidden rounded bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={progress}>
          <div className="h-full bg-brand-600" style={{ width: `${progress}%` }} />
        </div>
      )}

      {usage.data && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatTile label="Files" value={usage.data.totalFiles} />
          <StatTile label="Storage used" value={formatBytes(usage.data.totalBytes)} />
        </div>
      )}

      <Panel>
        {!files.loading && files.items.length === 0 ? (
          <EmptyState icon={<FiFolder />} title="No files yet" message="Upload images, PDFs, spreadsheets or short videos." />
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {files.items.map((file) => (
              <FileRow key={file.id} file={file} canDelete={canDelete(file)} onDownload={download} onDelete={setToDelete} />
            ))}
          </ul>
        )}
        <LoadMoreSentinel hasMore={files.hasMore} loading={files.loading} onLoadMore={files.loadMore} />
      </Panel>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete file"
        message={`${toDelete?.originalName ?? 'This file'} will be removed for everyone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
