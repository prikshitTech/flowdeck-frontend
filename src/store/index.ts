import { configureStore } from '@reduxjs/toolkit';

import authReducer, { sessionExpired } from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { sessionEvents } from '@/api/sessionEvents';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer
  }
});

sessionEvents.onExpired(() => store.dispatch(sessionExpired()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
