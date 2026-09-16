import { memo, useCallback } from 'react';
import { FiLogOut, FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import IconButton from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Display';
import { logout } from '@/store/slices/authSlice';
import { disconnectSocket } from '@/realtime/socket';
import { resetNotifications } from '@/store/slices/notificationSlice';
import { toggleTheme } from '@/store/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const theme = useAppSelector((state) => state.ui.theme);
  const workspaceName = useAppSelector((state) => state.workspaces.current?.name);

  const signOut = useCallback(async () => {
    disconnectSocket();
    await dispatch(logout());
    dispatch(resetNotifications());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 sm:px-5 dark:border-stone-800 dark:bg-stone-900">
      <IconButton label="Open menu" icon={<FiMenu />} onClick={onOpenMenu} className="lg:hidden" />
      <p className="flex-1 truncate text-sm font-medium text-stone-600 dark:text-stone-300">{workspaceName}</p>
      <IconButton
        label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        icon={theme === 'dark' ? <FiSun /> : <FiMoon />}
        onClick={() => dispatch(toggleTheme())}
      />
      {user && (
        <div className="flex items-center gap-2 border-l border-stone-200 pl-3 dark:border-stone-800">
          <Avatar name={user.name} />
          <span className="hidden text-sm sm:inline">{user.name}</span>
          <IconButton label="Sign out" icon={<FiLogOut />} onClick={signOut} />
        </div>
      )}
    </header>
  );
}

export default memo(Topbar);
