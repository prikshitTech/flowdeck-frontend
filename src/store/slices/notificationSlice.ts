import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { notificationApi } from '@/api/services';
import type { AppNotification } from '@/types/models';

interface NotificationState {
  items: AppNotification[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  unread: number;
}

const PAGE_SIZE = 20;

const initialState: NotificationState = {
  items: [],
  page: 0,
  hasMore: true,
  loading: false,
  unread: 0
};

export const fetchUnreadCount = createAsyncThunk('notifications/unread', async () => {
  const counts = await notificationApi.unread();
  return counts.total;
});

export const fetchNotificationPage = createAsyncThunk('notifications/page', (page: number) =>
  notificationApi.list({ page, limit: PAGE_SIZE })
);

export const markNotificationRead = createAsyncThunk('notifications/markRead', (id: string) =>
  notificationApi.markRead(id)
);

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', () =>
  notificationApi.markAllRead()
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived(state, action: PayloadAction<AppNotification>) {
      if (!state.items.some((item) => item.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }

      state.unread += 1;
    },
    resetNotifications() {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload;
      })
      .addCase(fetchNotificationPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotificationPage.fulfilled, (state, action) => {
        const { items, meta } = action.payload;
        const known = new Set(state.items.map((item) => item.id));

        state.items = meta.page === 1 ? items : [...state.items, ...items.filter((item) => !known.has(item.id))];
        state.page = meta.page;
        state.hasMore = meta.hasNext;
        state.loading = false;
      })
      .addCase(fetchNotificationPage.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markNotificationRead.pending, (state, action) => {
        const item = state.items.find((notification) => notification.id === action.meta.arg);

        if (item && !item.readAt) {
          item.readAt = new Date().toISOString();
          state.unread = Math.max(state.unread - 1, 0);
        }
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        const item = state.items.find((notification) => notification.id === action.meta.arg);

        if (item) {
          item.readAt = null;
          state.unread += 1;
        }
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        const now = new Date().toISOString();

        for (const item of state.items) {
          item.readAt ??= now;
        }

        state.unread = 0;
      });
  }
});

export const { notificationReceived, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
