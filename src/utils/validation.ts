import { z } from 'zod';

const isLower = (char: string) => char >= 'a' && char <= 'z';
const isUpper = (char: string) => char >= 'A' && char <= 'Z';
const isDigit = (char: string) => char >= '0' && char <= '9';
const isSymbol = (char: string) => char.trim().length > 0 && !isLower(char) && !isUpper(char) && !isDigit(char);

export const PASSWORD_RULES = [
  { label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { label: 'A lowercase letter', test: (value: string) => [...value].some(isLower) },
  { label: 'An uppercase letter', test: (value: string) => [...value].some(isUpper) },
  { label: 'A number', test: (value: string) => [...value].some(isDigit) },
  { label: 'A special character', test: (value: string) => [...value].some(isSymbol) }
];

export const emailField = z.string().trim().min(1, 'Email is required').email('Enter a valid email');

export const strongPassword = z
  .string()
  .max(128, 'Password is too long')
  .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), {
    message: 'Password does not meet every rule below'
  });

export const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);
