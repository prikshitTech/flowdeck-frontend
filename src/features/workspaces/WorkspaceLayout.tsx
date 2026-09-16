import { useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { Link, Outlet, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/ui/Display';
import { PageLoader } from '@/components/ui/Spinner';
import { clearCurrentWorkspace, fetchWorkspace } from '@/store/slices/workspaceSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function WorkspaceLayout() {
  const dispatch = useAppDispatch();
  const { workspaceId } = useParams();
  const { current, currentStatus } = useAppSelector((state) => state.workspaces);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspace(workspaceId));
    }
  }, [dispatch, workspaceId]);

  useEffect(() => () => void dispatch(clearCurrentWorkspace()), [dispatch]);

  if (currentStatus === 'failed') {
    return (
      <EmptyState
        icon={<FiAlertCircle />}
        title="Workspace unavailable"
        message="It may have been archived, or you are no longer a member."
        action={
          <Link to="/" className="text-sm font-medium text-brand-700 hover:underline">
            Back to workspaces
          </Link>
        }
      />
    );
  }

  if (!current || current.id !== workspaceId) {
    return <PageLoader />;
  }

  return <Outlet />;
}
