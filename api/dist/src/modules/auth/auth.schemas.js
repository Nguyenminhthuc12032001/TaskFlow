import { z } from "zod";
export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Invalid email address"));
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
}).strict();
// POST auth/login
export const loginBodySchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(1, "Password cannot be empty")
}).strict();
// POST auth/forgot-password
export const forgotPasswordBodySchema = z.object({
    email: emailSchema
}).strict();
// POST auth/reset-password
export const resetPasswordBodySchema = z.object({
    resetToken: z.string().min(10, "Invalid reset token"),
    newPassword: passwordSchema
}).strict();
// POST auth/change-password
export const changePasswordBodySchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password cannot be empty"),
    newPassword: passwordSchema
}).strict();
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
}).strict();
// REGISTER
export const registerResponseSchema = z.object({
    user: safeUserSchema,
    accessToken: z.string(),
}).strict();
// LOGIN
export const loginResponseSchema = z.object({
    user: safeUserSchema,
    accessToken: z.string(),
}).strict();
// REFRESH
export const refreshResponseSchema = z.object({
    accessToken: z.string(),
}).strict();
