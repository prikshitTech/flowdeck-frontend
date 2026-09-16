import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiHash, FiLock, FiPlus } from 'react-icons/fi';
import { NavLink, useParams } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import ChannelView from './ChannelView';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import useNotify from '@/hooks/useNotify';
import { EmptyState } from '@/components/ui/Display';
import { Input, Select } from '@/components/ui/FormField';
import { createChannel, fetchChannels, openChannel } from '@/store/slices/channelSlice';
import { cn } from '@/utils/cn';
import { hasRole } from '@/utils/roles';
import { requiredText } from '@/utils/validation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Channel } from '@/types/models';

const schema = z.object({
  name: requiredText('Name', 60),
  topic: z.string().trim().max(200).optional(),
  visibility: z.enum(['public', 'private'])
});

type ChannelValues = z.infer<typeof schema>;

const ChannelLink = memo(function ChannelLink({ channel, workspaceId }: { channel: Channel; workspaceId: string }) {
  return (
    <NavLink
      to={`/w/${workspaceId}/channels/${channel.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded px-2 py-1.5 text-sm',
          isActive ? 'bg-stone-200/70 font-medium dark:bg-stone-800' : 'hover:bg-stone-100 dark:hover:bg-stone-800/60',
          !channel.joined && 'text-stone-500'
        )
      }
    >
      {channel.visibility === 'private' ? <FiLock className="shrink-0" /> : <FiHash className="shrink-0" />}
      <span className="truncate">{channel.name}</span>
    </NavLink>
  );
});

export default function ChannelsScreen() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { channelId } = useParams();
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const { channels, channelsLoading } = useAppSelector((state) => state.channels);
  const [creating, setCreating] = useState(false);

  const canWrite = hasRole(workspace.role, 'member');
  const active = channels.find((channel) => channel.id === channelId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChannelValues>({ resolver: zodResolver(schema), defaultValues: { visibility: 'public' } });

  useEffect(() => {
    dispatch(fetchChannels(workspace.id));
    return () => {
      dispatch(openChannel(null));
    };
  }, [dispatch, workspace.id]);

  const onCreate = handleSubmit(async (values) => {
    try {
      await dispatch(createChannel({ workspaceId: workspace.id, ...values })).unwrap();
      reset({ name: '', topic: '', visibility: 'public' });
      setCreating(false);
    } catch (error) {
      notify.error(error);
    }
  });

  const joined = channels.filter((channel) => channel.joined);
  const others = channels.filter((channel) => !channel.joined);

  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="max-h-56 shrink-0 overflow-y-auto border-b border-stone-200 p-3 md:max-h-none md:w-60 md:border-r md:border-b-0 dark:border-stone-800">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Channels</h2>
          {canWrite && (
            <Button size="sm" variant="ghost" icon={<FiPlus />} onClick={() => setCreating(true)}>
              New
            </Button>
          )}
        </div>
        {channelsLoading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        {joined.map((channel) => (
          <ChannelLink key={channel.id} channel={channel} workspaceId={workspace.id} />
        ))}
        {others.length > 0 && <p className="mt-4 mb-1 px-2 text-xs text-stone-500">Browse</p>}
        {others.map((channel) => (
          <ChannelLink key={channel.id} channel={channel} workspaceId={workspace.id} />
        ))}
      </aside>

      <section className="min-h-0 flex-1">
        {active ? (
          <ChannelView key={active.id} channel={active} workspaceId={workspace.id} canWrite={canWrite} />
        ) : (
          <EmptyState
            icon={<FiHash />}
            title={channelId && !channelsLoading ? 'Channel not found' : 'Pick a channel'}
            message="Conversations live in channels. Join one on the left or start a new one."
          />
        )}
      </section>

      <Modal
        open={creating}
        title="New channel"
        onClose={() => setCreating(false)}
        footer={
          <Button type="submit" form="create-channel" loading={isSubmitting}>
            Create
          </Button>
        }
      >
        <form id="create-channel" onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
          <Input label="Name" placeholder="design-reviews" error={errors.name?.message} {...register('name')} />
          <Input label="Topic" placeholder="What this channel is about" error={errors.topic?.message} {...register('topic')} />
          <Select
            label="Visibility"
            options={[
              { value: 'public', label: 'Public, anyone in the workspace can join' },
              { value: 'private', label: 'Private, invite only' }
            ]}
            {...register('visibility')}
          />
        </form>
      </Modal>
    </div>
  );
}
