import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authApi } from '@/api/services';
import { clearOfflineCache } from '@/utils/offline';
import { tokenStorage } from '@/utils/storage';
import type { AuthResult, User } from '@/types/models';

interface AuthState {
  user: User | null;
  hasSession: boolean;
  profileLoaded: boolean;
}

const initialState: AuthState = {
  user: null,
  hasSession: Boolean(tokenStorage.getAccessToken()),
  profileLoaded: false
};

function keepTokens(result: AuthResult): User {
  tokenStorage.save({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  return result.user;
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => keepTokens(await authApi.login(credentials))
);

export const register = createAsyncThunk(
  'auth/register',
  async (details: { name: string; email: string; password: string }) => keepTokens(await authApi.register(details))
);

export const loadProfile = createAsyncThunk('auth/loadProfile', () => authApi.me());

export const updateProfile = createAsyncThunk('auth/updateProfile', (changes: { name: string }) =>
  authApi.updateProfile(changes)
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    tokenStorage.clear();
    await clearOfflineCache();
  }
});

const signedIn = (state: AuthState, action: PayloadAction<User>) => {
  state.user = action.payload;
  state.hasSession = true;
  state.profileLoaded = true;
};

const signedOut = (state: AuthState) => {
  state.user = null;
  state.hasSession = false;
  state.profileLoaded = true;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired: signedOut
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, signedIn)
      .addCase(register.fulfilled, signedIn)
      .addCase(loadProfile.fulfilled, signedIn)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loadProfile.rejected, signedOut)
      .addCase(logout.fulfilled, signedOut)
      .addCase(logout.rejected, signedOut);
  }
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
