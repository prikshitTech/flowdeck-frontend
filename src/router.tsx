import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppShell from '@/components/layout/AppShell';
import WorkspaceLayout from '@/features/workspaces/WorkspaceLayout';
import { GuestRoute, ProtectedRoute } from '@/components/common/RouteGuards';
import { PageLoader } from '@/components/ui/Spinner';

const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/features/auth/RegisterScreen'));
const WorkspacesScreen = lazy(() => import('@/features/workspaces/WorkspacesScreen'));
const OverviewScreen = lazy(() => import('@/features/workspaces/OverviewScreen'));
const MembersScreen = lazy(() => import('@/features/workspaces/MembersScreen'));
const PagesScreen = lazy(() => import('@/features/pages/PagesScreen'));
const BoardsScreen = lazy(() => import('@/features/boards/BoardsScreen'));
const BoardScreen = lazy(() => import('@/features/boards/BoardScreen'));
const ChannelsScreen = lazy(() => import('@/features/channels/ChannelsScreen'));
const FilesScreen = lazy(() => import('@/features/files/FilesScreen'));
const SearchScreen = lazy(() => import('@/features/search/SearchScreen'));
const AuditScreen = lazy(() => import('@/features/audit/AuditScreen'));
const NotificationsScreen = lazy(() => import('@/features/notifications/NotificationsScreen'));
const SettingsScreen = lazy(() => import('@/features/settings/SettingsScreen'));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: withSuspense(<LoginScreen />) },
      { path: '/register', element: withSuspense(<RegisterScreen />) }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: withSuspense(<WorkspacesScreen />) },
          { path: '/notifications', element: withSuspense(<NotificationsScreen />) },
          { path: '/settings', element: withSuspense(<SettingsScreen />) },
          {
            path: '/w/:workspaceId',
            element: <WorkspaceLayout />,
            children: [
              { index: true, element: withSuspense(<OverviewScreen />) },
              { path: 'members', element: withSuspense(<MembersScreen />) },
              { path: 'pages/:pageId?', element: withSuspense(<PagesScreen />) },
              { path: 'boards', element: withSuspense(<BoardsScreen />) },
              { path: 'boards/:boardId', element: withSuspense(<BoardScreen />) },
              { path: 'channels/:channelId?', element: withSuspense(<ChannelsScreen />) },
              { path: 'files', element: withSuspense(<FilesScreen />) },
              { path: 'search', element: withSuspense(<SearchScreen />) },
              { path: 'audit', element: withSuspense(<AuditScreen />) }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
