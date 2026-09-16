import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FiCheck, FiMinus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import AuthLayout from './AuthLayout';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/FormField';
import { PASSWORD_RULES, emailField, requiredText, strongPassword } from '@/utils/validation';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { register as registerAccount } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { cn } from '@/utils/cn';

const schema = z.object({
  name: requiredText('Name', 80),
  email: emailField,
  password: strongPassword
});

type RegisterValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } });

  const password = watch('password');

  const onSubmit = async (values: RegisterValues) => {
    try {
      await dispatch(registerAccount(values)).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);

      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof RegisterValues, { message });
      }

      setError('root', { message: getErrorMessage(error) });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute. You can invite your team after."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-500">
            Sign in
          </Link>
        </>
      }
    >
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
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
