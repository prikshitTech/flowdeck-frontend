import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { workspaceApi } from '@/api/services';
import type { WorkspaceDetail, WorkspaceSummary } from '@/types/models';

type Status = 'idle' | 'loading' | 'ready' | 'failed';

interface WorkspaceState {
  items: WorkspaceSummary[];
  listStatus: Status;
  current: WorkspaceDetail | null;
  currentStatus: Status;
}

const initialState: WorkspaceState = {
  items: [],
  listStatus: 'idle',
  current: null,
  currentStatus: 'idle'
};

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async () => {
  const { items } = await workspaceApi.list({ limit: 100 });
  return items;
});

export const fetchWorkspace = createAsyncThunk('workspaces/fetchOne', (workspaceId: string) =>
  workspaceApi.detail(workspaceId)
);

export const createWorkspace = createAsyncThunk(
  'workspaces/create',
  (values: { name: string; description?: string }) => workspaceApi.create(values)
);

export const updateWorkspace = createAsyncThunk(
  'workspaces/update',
  ({ workspaceId, changes }: { workspaceId: string; changes: { name?: string; description?: string } }) =>
    workspaceApi.update(workspaceId, changes)
);

export const archiveWorkspace = createAsyncThunk('workspaces/archive', async (workspaceId: string) => {
  await workspaceApi.archive(workspaceId);
  return workspaceId;
});

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    clearCurrentWorkspace(state) {
      state.current = null;
      state.currentStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.listStatus = state.items.length ? 'ready' : 'loading';
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.items = action.payload;
        state.listStatus = 'ready';
      })
      .addCase(fetchWorkspaces.rejected, (state) => {
        state.listStatus = 'failed';
      })
      .addCase(fetchWorkspace.pending, (state, action) => {
        if (state.current?.id !== action.meta.arg) {
          state.currentStatus = 'loading';
        }
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.current = action.payload;
        state.currentStatus = 'ready';
      })
      .addCase(fetchWorkspace.rejected, (state) => {
        state.current = null;
        state.currentStatus = 'failed';
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.items.unshift({ ...action.payload, role: 'owner' });
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const { id, name, description } = action.payload;
        const item = state.items.find((workspace) => workspace.id === id);

        if (item) {
          Object.assign(item, { name, description });
        }

        if (state.current?.id === id) {
          Object.assign(state.current, { name, description });
        }
      })
      .addCase(archiveWorkspace.fulfilled, (state, action) => {
        state.items = state.items.filter((workspace) => workspace.id !== action.payload);
        state.current = null;
      });
  }
});

export const { clearCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
