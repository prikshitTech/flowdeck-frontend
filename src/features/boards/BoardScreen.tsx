import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';

import BoardColumn from './BoardColumn';
import Button from '@/components/ui/Button';
import CardModal from './CardModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import useNotify from '@/hooks/useNotify';
import { PageLoader } from '@/components/ui/Spinner';
import { archiveList, clearBoard, createCard, createList, fetchBoard, moveCard } from '@/store/slices/boardSlice';
import { hasRole } from '@/utils/roles';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { BoardColumn as Column, Card } from '@/types/models';

export default function BoardScreen() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { boardId } = useParams() as { boardId: string };
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const { snapshot, loading } = useAppSelector((state) => state.boards);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [listToArchive, setListToArchive] = useState<Column | null>(null);
  const [listName, setListName] = useState('');

  const canWrite = hasRole(workspace.role, 'member');

  useEffect(() => {
    dispatch(fetchBoard({ workspaceId: workspace.id, boardId }));
    return () => {
      dispatch(clearBoard());
    };
  }, [dispatch, workspace.id, boardId]);

  const openCard = useCallback((card: Card) => setOpenCardId(card.id), []);

  const addCard = useCallback(
    async (listId: string, title: string) => {
      try {
        await dispatch(createCard({ workspaceId: workspace.id, boardId, list: listId, title })).unwrap();
      } catch (error) {
        notify.error(error);
      }
    },
    [dispatch, notify, workspace.id, boardId]
  );

  const onDragEnd = useCallback(
    async ({ draggableId, source, destination }: DropResult) => {
      if (!destination || !snapshot) {
        return;
      }

      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }

      const target = snapshot.lists.find((list) => list.id === destination.droppableId);
      const changingList = destination.droppableId !== source.droppableId;

      if (target && changingList && target.cardLimit !== null && target.cards.length >= target.cardLimit) {
        notify.info(`${target.name} is at its limit of ${target.cardLimit} cards`);
        return;
      }

      try {
        await dispatch(
          moveCard({
            workspaceId: workspace.id,
            boardId,
            cardId: draggableId,
            toList: destination.droppableId,
            toIndex: destination.index
          })
        ).unwrap();
      } catch (error) {
        notify.error(error);
      }
    },
    [dispatch, notify, snapshot, workspace.id, boardId]
  );

  const submitList = async (event: FormEvent) => {
    event.preventDefault();

    if (!listName.trim()) {
      return;
    }

    try {
      await dispatch(createList({ workspaceId: workspace.id, boardId, name: listName.trim() })).unwrap();
      setListName('');
    } catch (error) {
      notify.error(error);
    }
  };

  const confirmArchiveList = async () => {
    if (!listToArchive) {
      return;
    }

    try {
      await dispatch(archiveList({ workspaceId: workspace.id, boardId, listId: listToArchive.id })).unwrap();
    } catch (error) {
      notify.error(error);
    } finally {
      setListToArchive(null);
    }
  };

  if (loading || !snapshot) {
    return <PageLoader label="Loading board" />;
  }

  const openCardData = openCardId
    ? snapshot.lists.flatMap((list) => list.cards).find((card) => card.id === openCardId)
    : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <Link to={`/w/${workspace.id}/boards`} aria-label="All boards" className="text-stone-500 hover:text-stone-800">
          <FiArrowLeft />
        </Link>
        <h1 className="flex-1 truncate font-semibold">{snapshot.name}</h1>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
          {snapshot.lists.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              canWrite={canWrite}
              onOpenCard={openCard}
              onAddCard={addCard}
              onArchive={setListToArchive}
            />
          ))}
          {canWrite && (
            <form onSubmit={submitList} className="flex w-64 shrink-0 flex-col gap-2 self-start rounded-lg border border-dashed border-stone-300 p-3 dark:border-stone-700">
              <input
                aria-label="New list name"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="New list"
                maxLength={80}
                className="h-9 rounded border border-stone-300 bg-white px-2 text-sm dark:border-stone-700 dark:bg-stone-900"
              />
              <Button type="submit" size="sm" variant="secondary" icon={<FiPlus />} disabled={!listName.trim()}>
                Add list
              </Button>
            </form>
          )}
        </div>
      </DragDropContext>

      {openCardData && (
        <CardModal
          card={openCardData}
          workspaceId={workspace.id}
          boardId={boardId}
          canWrite={canWrite}
          onClose={() => setOpenCardId(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(listToArchive)}
        title="Archive list"
        message={`Archiving ${listToArchive?.name ?? 'this list'} also archives every card in it.`}
        confirmLabel="Archive"
        onConfirm={confirmArchiveList}
        onCancel={() => setListToArchive(null)}
      />
    </div>
  );
}
