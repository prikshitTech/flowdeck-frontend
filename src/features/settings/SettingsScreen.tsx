import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMonitor, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import useNotify from '@/hooks/useNotify';
import useRequest from '@/hooks/useRequest';
import { Input } from '@/components/ui/FormField';
import { PageHeader, Panel } from '@/components/ui/Display';
import { authApi } from '@/api/services';
import { clearOfflineCache } from '@/utils/offline';
import { disconnectSocket } from '@/realtime/socket';
import { requiredText, strongPassword } from '@/utils/validation';
import { sessionExpired, updateProfile } from '@/store/slices/authSlice';
import { timeAgo } from '@/utils/format';
import { tokenStorage } from '@/utils/storage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const profileSchema = z.object({ name: requiredText('Name', 80) });

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: strongPassword,
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  });

function describeAgent(agent: string | null): string {
  if (!agent) {
    return 'Unknown device';
  }

  const browsers = ['Edg', 'Chrome', 'Firefox', 'Safari'];
  const browser = browsers.find((name) => agent.includes(name)) ?? 'Browser';
  const system = ['Windows', 'Mac OS', 'Android', 'iPhone', 'Linux'].find((name) => agent.includes(name)) ?? 'unknown OS';

  return `${browser === 'Edg' ? 'Edge' : browser} on ${system}`;
}

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const user = useAppSelector((state) => state.auth.user)!;
  const sessions = useRequest(() => authApi.sessions(), []);
  const [signingOut, setSigningOut] = useState(false);

  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user.name }
  });

  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const endAllSessions = () => {
    disconnectSocket();
    tokenStorage.clear();
    void clearOfflineCache();
    dispatch(sessionExpired());
    navigate('/login', { replace: true });
  };

  const onProfile = profile.handleSubmit(async (values) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      notify.success('Profile saved');
    } catch (error) {
      notify.error(error);
    }
  });

  const onPassword = password.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      notify.success('Password changed. Sign in again with the new password.');
      endAllSessions();
    } catch (error) {
      notify.error(error);
    }
  });

  const revoke = async (sessionId: string) => {
    sessions.setData((current) => current?.filter((session) => session.id !== sessionId) ?? null);

    try {
      await authApi.revokeSession(sessionId);
    } catch (error) {
      notify.error(error);
      sessions.reload();
    }
  };

  const signOutEverywhere = async () => {
    setSigningOut(true);

    try {
      await authApi.logoutAll();
      endAllSessions();
    } catch (error) {
      notify.error(error);
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Settings" description={user.email} />

      <Panel className="p-4">
        <h2 className="mb-3 text-sm font-medium">Profile</h2>
        <form onSubmit={onProfile} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
          <Input label="Name" error={profile.formState.errors.name?.message} {...profile.register('name')} />
          <Button type="submit" variant="secondary" loading={profile.formState.isSubmitting} disabled={!profile.formState.isDirty} className="sm:mt-7">
            Save
          </Button>
        </form>
      </Panel>

      <Panel className="p-4">
        <h2 className="mb-3 text-sm font-medium">Change password</h2>
        <form onSubmit={onPassword} className="grid gap-3 sm:grid-cols-3" noValidate>
          <Input
            label="Current"
            type="password"
            autoComplete="current-password"
            error={password.formState.errors.currentPassword?.message}
            {...password.register('currentPassword')}
          />
          <Input
            label="New"
            type="password"
            autoComplete="new-password"
            error={password.formState.errors.newPassword?.message}
            {...password.register('newPassword')}
          />
          <Input
            label="Confirm"
            type="password"
            autoComplete="new-password"
            error={password.formState.errors.confirmPassword?.message}
            {...password.register('confirmPassword')}
          />
          <div className="sm:col-span-3">
            <Button type="submit" loading={password.formState.isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Active sessions</h2>
          <Button size="sm" variant="danger" loading={signingOut} onClick={signOutEverywhere}>
            Sign out everywhere
          </Button>
        </div>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {sessions.data?.map((session) => (
            <li key={session.id} className="flex items-center gap-3 py-2">
              <FiMonitor className="text-stone-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{describeAgent(session.userAgent)}</p>
                <p className="text-xs text-stone-500">
                  {session.ip ?? 'Unknown address'} · signed in {timeAgo(session.createdAt)}
                </p>
              </div>
              <IconButton label="Revoke session" icon={<FiTrash2 />} onClick={() => revoke(session.id)} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
