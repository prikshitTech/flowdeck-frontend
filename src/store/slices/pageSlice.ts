import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { pageApi } from '@/api/services';
import type { PageDetail, PageTreeNode } from '@/types/models';

interface PageState {
  workspaceId: string | null;
  tree: PageTreeNode[];
  treeLoading: boolean;
  current: PageDetail | null;
  currentLoading: boolean;
  previousTitle: string | null;
}

const initialState: PageState = {
  workspaceId: null,
  tree: [],
  treeLoading: false,
  current: null,
  currentLoading: false,
  previousTitle: null
};

interface PageRef {
  workspaceId: string;
  pageId: string;
}

function findNode(nodes: PageTreeNode[], id: string): PageTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const child = findNode(node.children, id);

    if (child) {
      return child;
    }
  }

  return null;
}

export const fetchPageTree = createAsyncThunk('pages/tree', (workspaceId: string) => pageApi.tree(workspaceId));

export const fetchPage = createAsyncThunk('pages/detail', ({ workspaceId, pageId }: PageRef) =>
  pageApi.detail(workspaceId, pageId)
);

export const createPage = createAsyncThunk(
  'pages/create',
  async ({ workspaceId, title, parent }: { workspaceId: string; title: string; parent: string | null }, { dispatch }) => {
    const page = await pageApi.create(workspaceId, { title, parent });
    await dispatch(fetchPageTree(workspaceId));
    return page;
  }
);

export const savePage = createAsyncThunk(
  'pages/save',
  ({ workspaceId, pageId, title, body }: PageRef & { title: string; body: string }) =>
    pageApi.update(workspaceId, pageId, { title, body })
);

export const archivePage = createAsyncThunk('pages/archive', async ({ workspaceId, pageId }: PageRef, { dispatch }) => {
  await pageApi.archive(workspaceId, pageId);
  await dispatch(fetchPageTree(workspaceId));
  return pageId;
});

export const movePage = createAsyncThunk(
  'pages/move',
  async ({ workspaceId, pageId, parent }: PageRef & { parent: string | null }, { dispatch }) => {
    await pageApi.move(workspaceId, pageId, parent);
    await dispatch(fetchPageTree(workspaceId));
    await dispatch(fetchPage({ workspaceId, pageId }));
  }
);

export const restoreRevision = createAsyncThunk(
  'pages/restore',
  async ({ workspaceId, pageId, version }: PageRef & { version: number }, { dispatch }) => {
    await pageApi.restore(workspaceId, pageId, version);
    await dispatch(fetchPage({ workspaceId, pageId }));
    await dispatch(fetchPageTree(workspaceId));
  }
);

const pageSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPageTree.pending, (state, action) => {
        if (state.workspaceId !== action.meta.arg) {
          state.workspaceId = action.meta.arg;
          state.tree = [];
          state.current = null;
        }

        state.treeLoading = state.tree.length === 0;
      })
      .addCase(fetchPageTree.fulfilled, (state, action) => {
        state.tree = action.payload;
        state.treeLoading = false;
      })
      .addCase(fetchPageTree.rejected, (state) => {
        state.treeLoading = false;
      })
      .addCase(fetchPage.pending, (state, action) => {
        state.currentLoading = state.current?.id !== action.meta.arg.pageId;
      })
      .addCase(fetchPage.fulfilled, (state, action) => {
        state.current = action.payload;
        state.currentLoading = false;
      })
      .addCase(fetchPage.rejected, (state) => {
        state.current = null;
        state.currentLoading = false;
      })
      .addCase(savePage.pending, (state, action) => {
        const node = findNode(state.tree, action.meta.arg.pageId);

        if (node) {
          state.previousTitle = node.title;
          node.title = action.meta.arg.title;
        }
      })
      .addCase(savePage.fulfilled, (state, action) => {
        state.previousTitle = null;

        if (state.current?.id === action.payload.id) {
          state.current.title = action.payload.title;
          state.current.body = action.payload.body;
          state.current.version = action.payload.version;
          state.current.updatedAt = action.payload.updatedAt;
        }
      })
      .addCase(savePage.rejected, (state, action) => {
        const node = findNode(state.tree, action.meta.arg.pageId);

        if (node && state.previousTitle !== null) {
          node.title = state.previousTitle;
        }

        state.previousTitle = null;
      })
      .addCase(archivePage.fulfilled, (state, action) => {
        if (state.current?.id === action.payload) {
          state.current = null;
        }
      });
  }
});

export default pageSlice.reducer;
