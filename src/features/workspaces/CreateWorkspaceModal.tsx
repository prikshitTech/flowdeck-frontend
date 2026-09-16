import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import useNotify from '@/hooks/useNotify';
import { Input, Textarea } from '@/components/ui/FormField';
import { createWorkspace } from '@/store/slices/workspaceSlice';
import { requiredText } from '@/utils/validation';
import { useAppDispatch } from '@/store/hooks';

const schema = z.object({
  name: requiredText('Name', 80),
  description: z.string().trim().max(400, 'Keep the description under 400 characters').optional()
});

type WorkspaceValues = z.infer<typeof schema>;

export default function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notify = useNotify();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WorkspaceValues>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: WorkspaceValues) => {
    try {
      const workspace = await dispatch(createWorkspace(values)).unwrap();
      notify.success(`${workspace.name} is ready`);
      close();
      navigate(`/w/${workspace.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Modal
      open={open}
      title="New workspace"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="create-workspace" loading={isSubmitting}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-workspace" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Name" placeholder="Product team" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Description"
          placeholder="What this workspace is for"
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  );
}
