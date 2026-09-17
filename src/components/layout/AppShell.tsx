import { useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import RealtimeBridge from '@/realtime/RealtimeBridge';
import { fetchUnreadCount } from '@/store/slices/notificationSlice';
import { fetchWorkspaces } from '@/store/slices/workspaceSlice';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import { isSuperAdmin } from '@/utils/roles';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

export default function AppShell() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const platformAdmin = useAppSelector((state) => isSuperAdmin(state.auth.user));

  useEffect(() => {
    dispatch(fetchWorkspaces());

    if (!platformAdmin) {
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, platformAdmin]);

  const openMenu = useCallback(() => dispatch(setSidebarOpen(true)), [dispatch]);
  const closeMenu = useCallback(() => dispatch(setSidebarOpen(false)), [dispatch]);

  return (
    <div className="flex h-full">
      <RealtimeBridge />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-stone-900/40 lg:hidden"
          onClick={closeMenu}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950',
          'lg:static lg:block',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <Sidebar onNavigate={closeMenu} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={openMenu} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
