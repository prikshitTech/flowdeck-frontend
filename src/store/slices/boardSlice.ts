import { createAsyncThunk, createSlice, current, type PayloadAction } from '@reduxjs/toolkit';

import { boardApi, type CardInput } from '@/api/services';
import type { BoardSnapshot, Card } from '@/types/models';

interface BoardState {
  snapshot: BoardSnapshot | null;
  loading: boolean;
  backup: BoardSnapshot | null;
}

const initialState: BoardState = {
  snapshot: null,
  loading: false,
  backup: null
};

interface BoardRef {
  workspaceId: string;
  boardId: string;
}

export interface MoveArgs extends BoardRef {
  cardId: string;
  toList: string;
  toIndex: number;
}

function renumber(cards: Card[]) {
  cards.forEach((card, index) => {
    card.position = index;
  });
}

function locateCard(board: BoardSnapshot, cardId: string) {
  for (const list of board.lists) {
    const index = list.cards.findIndex((card) => card.id === cardId);

    if (index >= 0) {
      return { list, index };
    }
  }

  return null;
}

export const fetchBoard = createAsyncThunk('boards/fetch', ({ workspaceId, boardId }: BoardRef) =>
  boardApi.snapshot(workspaceId, boardId)
);

export const moveCard = createAsyncThunk('boards/moveCard', ({ workspaceId, boardId, cardId, toList, toIndex }: MoveArgs) =>
  boardApi.moveCard(workspaceId, boardId, cardId, { list: toList, position: toIndex })
);

export const createCard = createAsyncThunk(
  'boards/createCard',
  ({ workspaceId, boardId, list, title }: BoardRef & { list: string; title: string }) =>
    boardApi.createCard(workspaceId, boardId, { list, title })
);

export const updateCard = createAsyncThunk(
  'boards/updateCard',
  ({ workspaceId, boardId, cardId, changes }: BoardRef & { cardId: string; changes: CardInput }) =>
    boardApi.updateCard(workspaceId, boardId, cardId, changes)
);

export const archiveCard = createAsyncThunk(
  'boards/archiveCard',
  ({ workspaceId, boardId, cardId }: BoardRef & { cardId: string }) =>
    boardApi.archiveCard(workspaceId, boardId, cardId)
);

export const createList = createAsyncThunk('boards/createList', ({ workspaceId, boardId, name }: BoardRef & { name: string }) =>
  boardApi.createList(workspaceId, boardId, name)
);

export const archiveList = createAsyncThunk(
  'boards/archiveList',
  async ({ workspaceId, boardId, listId }: BoardRef & { listId: string }) => {
    await boardApi.archiveList(workspaceId, boardId, listId);
    return listId;
  }
);

const takeBackup = (state: BoardState) => {
  state.backup = state.snapshot ? current(state.snapshot) : null;
};

const restoreBackup = (state: BoardState) => {
  if (state.backup) {
    state.snapshot = state.backup;
  }

  state.backup = null;
};

const boardSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    clearBoard() {
      return initialState;
    },
    boardReplaced(state, action: PayloadAction<BoardSnapshot>) {
      if (!state.backup) {
        state.snapshot = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoard.pending, (state, action) => {
        state.loading = state.snapshot?.id !== action.meta.arg.boardId;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        if (!state.backup) {
          state.snapshot = action.payload;
        }

        state.loading = false;
      })
      .addCase(fetchBoard.rejected, (state) => {
        state.loading = false;
      })
      .addCase(moveCard.pending, (state, action) => {
        if (!state.snapshot) {
          return;
        }

        takeBackup(state);
        const { cardId, toList, toIndex } = action.meta.arg;
        const origin = locateCard(state.snapshot, cardId);
        const target = state.snapshot.lists.find((list) => list.id === toList);

        if (!origin || !target) {
          return;
        }

        const [card] = origin.list.cards.splice(origin.index, 1);
        target.cards.splice(toIndex, 0, card);
        renumber(origin.list.cards);
        renumber(target.cards);
      })
      .addCase(moveCard.fulfilled, (state) => {
        state.backup = null;
      })
      .addCase(moveCard.rejected, restoreBackup)
      .addCase(createCard.fulfilled, (state, action) => {
        const list = state.snapshot?.lists.find((column) => column.id === action.payload.list);

        if (list && !list.cards.some((card) => card.id === action.payload.id)) {
          list.cards.push(action.payload);
        }
      })
      .addCase(updateCard.pending, (state, action) => {
        if (!state.snapshot || action.meta.arg.changes.completed === undefined) {
          return;
        }

        takeBackup(state);
        const found = locateCard(state.snapshot, action.meta.arg.cardId);

        if (found) {
          found.list.cards[found.index].completedAt = action.meta.arg.changes.completed ? new Date().toISOString() : null;
        }
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        state.backup = null;
        const found = state.snapshot && locateCard(state.snapshot, action.payload.id);

        if (found) {
          found.list.cards[found.index] = { ...found.list.cards[found.index], ...action.payload };
        }
      })
      .addCase(updateCard.rejected, restoreBackup)
      .addCase(archiveCard.pending, (state, action) => {
        if (!state.snapshot) {
          return;
        }

        takeBackup(state);
        const found = locateCard(state.snapshot, action.meta.arg.cardId);

        if (found) {
          found.list.cards.splice(found.index, 1);
          renumber(found.list.cards);
        }
      })
      .addCase(archiveCard.fulfilled, (state) => {
        state.backup = null;
      })
      .addCase(archiveCard.rejected, restoreBackup)
      .addCase(createList.fulfilled, (state, action) => {
        state.snapshot?.lists.push({ ...action.payload, cards: [] });
      })
      .addCase(archiveList.fulfilled, (state, action) => {
        if (state.snapshot) {
          state.snapshot.lists = state.snapshot.lists.filter((list) => list.id !== action.payload);
        }
      });
  }
});

export const { clearBoard, boardReplaced } = boardSlice.actions;
export default boardSlice.reducer;
