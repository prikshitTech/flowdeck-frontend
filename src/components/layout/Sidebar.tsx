import { memo, useMemo } from 'react';
import type { IconType } from 'react-icons';
import {
  FiBell,
  FiClipboard,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHash,
  FiHome,
  FiSearch,
  FiSettings,
  FiTrello,
  FiUsers
} from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';

import Logo from './Logo';
import useWorkspaceId from '@/hooks/useWorkspaceId';
import { hasRole } from '@/utils/roles';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/store/hooks';
import type { WorkspaceRole } from '@/types/models';

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
  minimumRole?: WorkspaceRole;
}

const WORKSPACE_LINKS: NavItem[] = [
  { to: '', label: 'Overview', icon: FiHome, end: true },
  { to: 'pages', label: 'Pages', icon: FiFileText },
  { to: 'boards', label: 'Boards', icon: FiTrello },
  { to: 'channels', label: 'Channels', icon: FiHash },
  { to: 'files', label: 'Files', icon: FiFolder },
  { to: 'search', label: 'Search', icon: FiSearch },
  { to: 'members', label: 'Members', icon: FiUsers },
  { to: 'audit', label: 'Audit log', icon: FiClipboard, minimumRole: 'admin' }
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
    isActive
      ? 'bg-stone-200/70 font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-100'
      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/60'
  );

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const workspaces = useAppSelector((state) => state.workspaces.items);
  const unread = useAppSelector((state) => state.notifications.unread);

  const role = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId)?.role,
    [workspaces, workspaceId]
  );

  const links = useMemo(
    () => WORKSPACE_LINKS.filter((link) => !link.minimumRole || hasRole(role, link.minimumRole)),
    [role]
  );

  return (
    <nav className="flex h-full flex-col gap-4 p-3" aria-label="Main">
      <div className="px-2 py-1">
        <Logo />
      </div>

      <div className="px-1">
        <label htmlFor="workspace-switcher" className="sr-only">
          Workspace
        </label>
        <select
          id="workspace-switcher"
          value={workspaceId ?? ''}
          onChange={(event) => {
            navigate(event.target.value ? `/w/${event.target.value}` : '/');
            onNavigate();
          }}
          className="h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <option value="">All workspaces</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {!workspaceId && (
          <NavLink to="/" end className={linkClass} onClick={onNavigate}>
            <FiGrid /> Workspaces
          </NavLink>
        )}
        {workspaceId &&
          links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to ? `/w/${workspaceId}/${to}` : `/w/${workspaceId}`}
              end={end}
              className={linkClass}
              onClick={onNavigate}
            >
              <Icon /> {label}
            </NavLink>
          ))}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-stone-200 pt-3 dark:border-stone-800">
        <NavLink to="/notifications" className={linkClass} onClick={onNavigate}>
          <FiBell />
          <span className="flex-1">Notifications</span>
          {unread > 0 && (
            <span className="rounded bg-brand-700 px-1.5 text-xs font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </NavLink>
        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <FiSettings /> Settings
        </NavLink>
      </div>
    </nav>
  );
}

export default memo(Sidebar);
