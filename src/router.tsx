import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { GuestRoute, ProtectedRoute } from '@/components/common/RouteGuards';
import { PageLoader } from '@/components/ui/Spinner';

const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/features/auth/RegisterScreen'));

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
    children: [{ path: '/', element: <p className="p-6">Signed in</p> }]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
