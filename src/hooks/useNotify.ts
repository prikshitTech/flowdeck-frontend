import { useMemo } from 'react';

import { showToast } from '@/store/slices/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import { getErrorMessage } from '@/utils/errors';

export default function useNotify() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      success: (message: string) => dispatch(showToast(message, 'success')),
      info: (message: string) => dispatch(showToast(message, 'info')),
      error: (error: unknown) => dispatch(showToast(getErrorMessage(error), 'error'))
    }),
    [dispatch]
  );
}
