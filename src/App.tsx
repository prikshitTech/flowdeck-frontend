import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import ErrorBoundary from '@/components/common/ErrorBoundary';
import OfflineBanner from '@/components/common/OfflineBanner';
import ToastHost from '@/components/common/ToastHost';
import { router } from '@/router';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';

function ThemeSync() {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeSync />
      <ErrorBoundary>
        <div className="flex h-full flex-col">
          <OfflineBanner />
          <div className="min-h-0 flex-1">
            <RouterProvider router={router} />
          </div>
        </div>
      </ErrorBoundary>
      <ToastHost />
    </Provider>
  );
}
