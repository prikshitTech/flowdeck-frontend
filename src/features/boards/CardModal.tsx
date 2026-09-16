import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import useNotify from '@/hooks/useNotify';
import useRequest from '@/hooks/useRequest';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { archiveCard, updateCard } from '@/store/slices/boardSlice';
import { requiredText } from '@/utils/validation';
import { useAppDispatch } from '@/store/hooks';
import { workspaceApi } from '@/api/services';
import type { Card, CardPriority } from '@/types/models';

const PRIORITIES: { value: CardPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const schema = z.object({
  title: requiredText('Title', 200),
  description: z.string().max(8000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  labels: z.string().max(250),
  dueAt: z.string(),
  assignees: z.array(z.string()),
  completed: z.boolean()
});

type CardValues = z.infer<typeof schema>;

interface CardModalProps {
  card: Card;
  workspaceId: string;
  boardId: string;
  canWrite: boolean;
  onClose: () => void;
}

export default function CardModal({ card, workspaceId, boardId, canWrite, onClose }: CardModalProps) {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const members = useRequest(() => workspaceApi.members(workspaceId, { limit: 100 }), [workspaceId]);

  const defaults = useMemo<CardValues>(
    () => ({
      title: card.title,
      description: card.description ?? '',
      priority: card.priority,
      labels: card.labels.join(', '),
      dueAt: card.dueAt ? card.dueAt.slice(0, 10) : '',
      assignees: card.assignees,
      completed: Boolean(card.completedAt)
    }),
    [card]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CardValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const onSave = handleSubmit(async (values) => {
    try {
      await dispatch(
        updateCard({
          workspaceId,
          boardId,
          cardId: card.id,
          changes: {
            title: values.title,
            description: values.description,
            priority: values.priority,
            labels: values.labels
              .split(',')
              .map((label) => label.trim())
              .filter(Boolean)
              .slice(0, 10),
            dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
            assignees: values.assignees,
            completed: values.completed
          }
        })
      ).unwrap();
      onClose();
    } catch (error) {
      notify.error(error);
    }
  });

  const onArchive = async () => {
    onClose();

    try {
      await dispatch(archiveCard({ workspaceId, boardId, cardId: card.id })).unwrap();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Modal
      open
      title="Card details"
      size="lg"
      onClose={onClose}
      footer={
        canWrite && (
          <>
            <Button variant="ghost" onClick={onArchive} className="mr-auto text-red-600">
              Archive card
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="card-form" loading={isSubmitting}>
              Save
            </Button>
          </>
        )
      }
    >
      <form id="card-form" onSubmit={onSave} className="grid gap-4 sm:grid-cols-2" noValidate>
        <fieldset disabled={!canWrite} className="contents">
          <Input label="Title" error={errors.title?.message} className="sm:col-span-2" {...register('title')} />
          <div className="sm:col-span-2">
            <Textarea label="Description" error={errors.description?.message} {...register('description')} />
          </div>
          <Select label="Priority" options={PRIORITIES} {...register('priority')} />
          <Input label="Due date" type="date" {...register('dueAt')} />
          <Input label="Labels" hint="Comma separated" {...register('labels')} />
          <FormField label="Status">
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-brand-700" {...register('completed')} />
              Mark as done
            </label>
          </FormField>
          <FormField label="Assignees" className="sm:col-span-2">
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-stone-200 p-2 dark:border-stone-700">
              {members.data?.items.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={member.user.id} className="h-4 w-4 accent-brand-700" {...register('assignees')} />
                  {member.user.name}
                  <span className="text-xs text-stone-500">{member.user.email}</span>
                </label>
              ))}
              {members.loading && <p className="text-xs text-stone-500">Loading members…</p>}
            </div>
          </FormField>
        </fieldset>
      </form>
    </Modal>
  );
}
