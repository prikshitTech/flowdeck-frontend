import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiLogOut, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import IconButton from '@/components/ui/IconButton';
import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import useInfiniteList from '@/hooks/useInfiniteList';
import useNotify from '@/hooks/useNotify';
import { Avatar, Badge, PageHeader, Panel } from '@/components/ui/Display';
import { Input, Select } from '@/components/ui/FormField';
import { ROLE_OPTIONS, hasRole } from '@/utils/roles';
import { archiveWorkspace, fetchWorkspaces, updateWorkspace } from '@/store/slices/workspaceSlice';
import { emailField, requiredText } from '@/utils/validation';
import { timeAgo } from '@/utils/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { workspaceApi } from '@/api/services';
import type { Member, WorkspaceRole } from '@/types/models';

const inviteSchema = z.object({
  email: emailField,
  role: z.enum(['admin', 'member', 'viewer'])
});

const renameSchema = z.object({ name: requiredText('Name', 80) });

type Pending = { kind: 'remove' | 'transfer'; member: Member } | { kind: 'leave' } | { kind: 'archive' } | null;

interface MemberRowProps {
  member: Member;
  canManage: boolean;
  isOwner: boolean;
  isSelf: boolean;
  onRoleChange: (member: Member, role: WorkspaceRole) => void;
  onAsk: (pending: Pending) => void;
}

const MemberRow = memo(function MemberRow({ member, canManage, isOwner, isSelf, onRoleChange, onAsk }: MemberRowProps) {
  const editable = canManage && member.role !== 'owner' && !isSelf;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar name={member.user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.user.name} {isSelf && <span className="text-stone-400">(you)</span>}
        </p>
        <p className="truncate text-xs text-stone-500">
          {member.user.email} · joined {timeAgo(member.joinedAt)}
        </p>
      </div>
      {editable ? (
        <Select
          aria-label={`Role for ${member.user.name}`}
          value={member.role}
          options={ROLE_OPTIONS}
          onChange={(event) => onRoleChange(member, event.target.value as WorkspaceRole)}
          className="h-8 w-28"
        />
      ) : (
        <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}>{member.role}</Badge>
      )}
      {isOwner && !isSelf && (
        <Button size="sm" variant="ghost" onClick={() => onAsk({ kind: 'transfer', member })}>
          Make owner
        </Button>
      )}
      {editable && (
        <IconButton label={`Remove ${member.user.name}`} icon={<FiTrash2 />} onClick={() => onAsk({ kind: 'remove', member })} />
      )}
    </li>
  );
});

export default function MembersScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [working, setWorking] = useState(false);

  const canManage = hasRole(workspace.role, 'admin');
  const isOwner = workspace.role === 'owner';

  const members = useInfiniteList(
    (page) => workspaceApi.members(workspace.id, { page, limit: 25, sort: 'oldest' }),
    `${workspace.id}:${version}`
  );

  const invite = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' }
  });

  const rename = useForm<z.infer<typeof renameSchema>>({
    resolver: zodResolver(renameSchema),
    values: { name: workspace.name }
  });

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const onInvite = invite.handleSubmit(async (values) => {
    try {
      await workspaceApi.addMember(workspace.id, values);
      notify.success(`${values.email} was added`);
      invite.reset({ email: '', role: values.role });
      refresh();
    } catch (error) {
      notify.error(error);
    }
  });

  const onRename = rename.handleSubmit(async (values) => {
    try {
      await dispatch(updateWorkspace({ workspaceId: workspace.id, changes: values })).unwrap();
      notify.success('Workspace renamed');
    } catch (error) {
      notify.error(error);
    }
  });

  const setMembers = members.setItems;

  const changeRole = useCallback(
    async (member: Member, role: WorkspaceRole) => {
      const previous = member.role;
      setMembers((items) => items.map((item) => (item.id === member.id ? { ...item, role } : item)));

      try {
        await workspaceApi.updateMember(workspace.id, member.user.id, role);
      } catch (error) {
        setMembers((items) => items.map((item) => (item.id === member.id ? { ...item, role: previous } : item)));
        notify.error(error);
      }
    },
    [notify, setMembers, workspace.id]
  );

  const confirm = async () => {
    if (!pending) {
      return;
    }

    setWorking(true);

    try {
      if (pending.kind === 'remove') {
        await workspaceApi.removeMember(workspace.id, pending.member.user.id);
        setMembers((items) => items.filter((item) => item.id !== pending.member.id));
        notify.success(`${pending.member.user.name} was removed`);
      }

      if (pending.kind === 'transfer') {
        await workspaceApi.transfer(workspace.id, pending.member.user.id);
        notify.success(`${pending.member.user.name} now owns this workspace`);
        dispatch(fetchWorkspaces());
        navigate(0);
      }

      if (pending.kind === 'leave') {
        await workspaceApi.leave(workspace.id);
        dispatch(fetchWorkspaces());
        navigate('/', { replace: true });
      }

      if (pending.kind === 'archive') {
        await dispatch(archiveWorkspace(workspace.id)).unwrap();
        navigate('/', { replace: true });
      }

      setPending(null);
    } catch (error) {
      notify.error(error);
    } finally {
      setWorking(false);
    }
  };

  const dialogCopy = {
    remove: { title: 'Remove member', message: 'They will lose access to every page, board and channel here.', label: 'Remove' },
    transfer: { title: 'Transfer ownership', message: 'You will become an admin. This cannot be undone by you.', label: 'Transfer' },
    leave: { title: 'Leave workspace', message: 'You will need a new invite to come back.', label: 'Leave' },
    archive: { title: 'Archive workspace', message: 'It disappears for every member. Data stays in the audit trail.', label: 'Archive' }
  };

  const copy = pending ? dialogCopy[pending.kind] : null;

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <PageHeader
        title="Members"
        description={`${workspace.memberCount} people in ${workspace.name}`}
        actions={
          !isOwner && (
            <Button variant="secondary" icon={<FiLogOut />} onClick={() => setPending({ kind: 'leave' })}>
              Leave workspace
            </Button>
          )
        }
      />

      {canManage && (
        <Panel className="mb-4 p-4">
          <form onSubmit={onInvite} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
            <Input
              label="Invite by email"
              placeholder="teammate@company.com"
              error={invite.formState.errors.email?.message}
              className="sm:min-w-72"
              {...invite.register('email')}
            />
            <Select label="Role" options={ROLE_OPTIONS} {...invite.register('role')} />
            <Button type="submit" icon={<FiUserPlus />} loading={invite.formState.isSubmitting} className="sm:mt-7">
              Add
            </Button>
          </form>
        </Panel>
      )}

      <Panel>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {members.items.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canManage={canManage}
              isOwner={isOwner}
              isSelf={member.user.id === userId}
              onRoleChange={changeRole}
              onAsk={setPending}
            />
          ))}
        </ul>
        <LoadMoreSentinel hasMore={members.hasMore} loading={members.loading} onLoadMore={members.loadMore} />
      </Panel>

      {canManage && (
        <Panel className="mt-6 p-4">
          <h2 className="mb-3 text-sm font-medium">Workspace settings</h2>
          <form onSubmit={onRename} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
            <Input label="Name" error={rename.formState.errors.name?.message} {...rename.register('name')} />
            <Button type="submit" variant="secondary" loading={rename.formState.isSubmitting} className="sm:mt-7">
              Save
            </Button>
          </form>
          {isOwner && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
              <p className="text-sm text-stone-500">Archiving hides the workspace from every member.</p>
              <Button variant="danger" size="sm" onClick={() => setPending({ kind: 'archive' })}>
                Archive
              </Button>
            </div>
          )}
        </Panel>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={copy?.title ?? ''}
        message={copy?.message ?? ''}
        confirmLabel={copy?.label}
        loading={working}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
