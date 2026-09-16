import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

import { readJson, writeJson } from '@/utils/storage';

export type Theme = 'light' | 'dark';
export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  toasts: Toast[];
}

const THEME_KEY = 'flowdeck.theme';

function preferredTheme(): Theme {
  const saved = readJson<Theme | null>(THEME_KEY, null);

  if (saved) {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialState: UiState = {
  theme: preferredTheme(),
  sidebarOpen: false,
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      writeJson(THEME_KEY, state.theme);
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(message: string, tone: ToastTone = 'info') {
        return { payload: { id: nanoid(), message, tone } };
      }
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    }
  }
});

export const { toggleTheme, setSidebarOpen, showToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
