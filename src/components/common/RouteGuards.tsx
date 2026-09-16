import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PageLoader } from '@/components/ui/Spinner';
import { loadProfile } from '@/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { hasSession, profileLoaded, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (hasSession && !profileLoaded) {
      dispatch(loadProfile());
    }
  }, [dispatch, hasSession, profileLoaded]);

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profileLoaded || !user) {
    return <PageLoader label="Loading your account" />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const location = useLocation();
  const hasSession = useAppSelector((state) => state.auth.hasSession);

  if (hasSession) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
