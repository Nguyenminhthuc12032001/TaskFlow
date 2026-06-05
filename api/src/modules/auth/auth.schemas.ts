import { z } from '../../docs/zod.js';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

export const passwordSchema = z
  .string() 
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than or equal 72 characters');

// ========== REQUEST ==========

// POST auth/register
export const registerBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than or equal 100 characters'),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();
export type RegisterBody = z.infer<typeof registerBodySchema>;

// POST auth/login
export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();
export type LoginBody = z.infer<typeof loginBodySchema>;

// POST auth/forgot-password
export const forgotPasswordBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

// POST auth/reset-password
export const resetPasswordBodySchema = z
  .object({
    resetToken: z.string().trim().min(10, 'Invalid reset token'),
    newPassword: passwordSchema,
  })
  .strict();
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

// POST auth/change-password
export const changePasswordBodySchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .strict();
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

// ========== RESSPONSE ==========

// SafeUser
export const safeUserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: emailSchema,
  })
  .strict();
export type SafeUserResponse = z.infer<typeof safeUserSchema>;

// REGISTER
export const registerResponseSchema = z
  .object({
    user: safeUserSchema,
    accessToken: z.string(),
  })
  .strict();
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// LOGIN
export const loginResponseSchema = z
  .object({
    user: safeUserSchema,
    accessToken: z.string(),
  })
  .strict();
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// REFRESH
export const refreshResponseSchema = z
  .object({
    user: safeUserSchema,
    accessToken: z.string(),
  })
  .strict();
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
