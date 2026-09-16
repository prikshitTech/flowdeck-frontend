import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const CONTROL =
  'w-full rounded-md border bg-white px-3 text-sm text-stone-800 placeholder:text-stone-400 ' +
  'focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 ' +
  'disabled:bg-stone-100 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:disabled:bg-stone-800';

function controlClass(error: string | undefined, extra?: string) {
  return cn(CONTROL, error ? 'border-red-500' : 'border-stone-300 dark:border-stone-700', extra);
}

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends ComponentProps<'input'> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, name, className, ...rest }: InputProps) {
  const fieldId = id ?? name;

  return (
    <FormField label={label} error={error} hint={hint} htmlFor={fieldId}>
      <input
        id={fieldId}
        name={name}
        aria-invalid={Boolean(error)}
        className={controlClass(error, cn('h-10', className))}
        {...rest}
      />
    </FormField>
  );
}

interface TextareaProps extends ComponentProps<'textarea'> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, name, className, ...rest }: TextareaProps) {
  const fieldId = id ?? name;

  return (
    <FormField label={label} error={error} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        name={name}
        aria-invalid={Boolean(error)}
        className={controlClass(error, cn('min-h-24 py-2', className))}
        {...rest}
      />
    </FormField>
  );
}

interface SelectProps extends ComponentProps<'select'> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, id, name, options, className, ...rest }: SelectProps) {
  const fieldId = id ?? name;

  return (
    <FormField label={label} error={error} htmlFor={fieldId}>
      <select id={fieldId} name={name} className={controlClass(error, cn('h-10', className))} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
