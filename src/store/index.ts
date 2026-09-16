import { configureStore } from '@reduxjs/toolkit';

import authReducer, { sessionExpired } from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import channelReducer from './slices/channelSlice';
import notificationReducer from './slices/notificationSlice';
import pageReducer from './slices/pageSlice';
import uiReducer from './slices/uiSlice';
import workspaceReducer from './slices/workspaceSlice';
import { sessionEvents } from '@/api/sessionEvents';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    workspaces: workspaceReducer,
    notifications: notificationReducer,
    pages: pageReducer,
    boards: boardReducer,
    channels: channelReducer
  }
});

sessionEvents.onExpired(() => store.dispatch(sessionExpired()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
