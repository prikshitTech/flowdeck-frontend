import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppShell from '@/components/layout/AppShell';
import WorkspaceLayout from '@/features/workspaces/WorkspaceLayout';
import { GuestRoute, ProtectedRoute } from '@/components/common/RouteGuards';
import { PageLoader } from '@/components/ui/Spinner';

const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/features/auth/RegisterScreen'));
const WorkspacesScreen = lazy(() => import('@/features/workspaces/WorkspacesScreen'));

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
          {
            path: '/w/:workspaceId',
            element: <WorkspaceLayout />,
            children: [{ index: true, element: <p className="p-6 text-sm text-stone-500">Overview</p> }]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
