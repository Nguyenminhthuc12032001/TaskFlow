import { object, z } from "zod";

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
        z.email("Invalid email address")
    );

export const passwordSchema = z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than or equal 72 characters");

// ========== REQUEST ==========

// POST auth/register
export const registerBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than or equal 100 characters"),
    email: emailSchema,
    password: passwordSchema
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

// POST auth/login
export const loginBodySchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(1, "Password cannot be empty")
});
export type LoginBody = z.infer<typeof loginBodySchema>;

// POST auth/forgot-password
export const forgotPasswordSchema = z.object({
    email: emailSchema
});
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

// POST auth/reset-password
export const resetPasswordBodySchema = z.object({
    resetToken: z.string().min(10, "Invalid reset token"),
    newPassword: passwordSchema
});
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

// POST auth/change-password
export const changePasswordBodySchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password cannot be empty"),
    newPassword: passwordSchema
});
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

// POST auth/refresh
export const refreshBodySchema = z.undefined()
    .or(z.object({}).strict());

// POST auth/login
export const logoutBodySchema = z.undefined()
    .or(z.object({}).strict());

// POST auth/me
export const meBodySchema = z.undefined()
    .or(z.object({}).strict());

// ========== RESSPONSE ==========

// SafeUser
export const safeUserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: emailSchema,
});
export type SafeUserResponse = z.infer<typeof safeUserSchema>;

// REGISTER
export const registerResponseSchema = z.object({
    user: safeUserSchema,
    accessToken: z.string(),
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// LOGIN
export const loginResponseSchema = z.object({
    user: safeUserSchema,
    accessToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// REFRESH
export const refreshResponseSchema = z.object({
    accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;