import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FiCheck, FiMinus, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import AuthLayout from '@/features/auth/AuthLayout';
import Button from '@/components/ui/Button';
import useRequest from '@/hooks/useRequest';
import { Input } from '@/components/ui/FormField';
import { PASSWORD_RULES, emailField, requiredText, strongPassword } from '@/utils/validation';
import { PageLoader } from '@/components/ui/Spinner';
import { adminApi } from '@/api/services';
import { cn } from '@/utils/cn';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { registerSuperAdmin } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';

const schema = z.object({
  name: requiredText('Name', 80),
  email: emailField,
  password: strongPassword,
  setupKey: z.string().optional()
});

type SetupValues = z.infer<typeof schema>;

export default function SuperAdminSetupScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useRequest(() => adminApi.setupStatus(), []);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SetupValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } });

  const password = watch('password');

  const onSubmit = async (values: SetupValues) => {
    try {
      await dispatch(registerSuperAdmin(values)).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      for (const [field, message] of Object.entries(getFieldErrors(error))) {
        setError(field as keyof SetupValues, { message });
      }

      setError('root', { message: getErrorMessage(error) });
    }
  };

  if (status.loading) {
    return <PageLoader label="Checking setup" />;
  }

  if (status.data && !status.data.available) {
    return (
      <AuthLayout
        title="Setup already done"
        subtitle="This deployment already has a super admin, so this page is closed."
        footer={
          <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-500">
            Go to sign in
          </Link>
        }
      >
        <p className="text-sm text-stone-500">
          If you need access, ask the person who set it up. The seat can only be claimed once.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create the super admin"
      subtitle="One account with access to every workspace. This page closes once it is created."
      footer={
        <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-500">
          Back to sign in
        </Link>
      }
    >
      <p className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
        <FiShield className="mt-0.5 shrink-0" />
        This account can read and change everything in every workspace. Keep the credentials safe.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <ul className="-mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);

            return (
              <li key={rule.label} className={cn('flex items-center gap-1.5', met ? 'text-green-700' : 'text-stone-500')}>
                {met ? <FiCheck /> : <FiMinus />}
                {rule.label}
              </li>
            );
          })}
        </ul>
        {status.data?.requiresKey && (
          <Input
            label="Setup key"
            hint="The SUPER_ADMIN_SETUP_KEY value from the server environment"
            error={errors.setupKey?.message}
            {...register('setupKey')}
          />
        )}
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create super admin
        </Button>
      </form>
    </AuthLayout>
  );
}
