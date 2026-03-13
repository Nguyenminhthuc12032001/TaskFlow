import z from "../../docs/zod.js";
// REQUEST
export const createBodySchema = z.object({
    workspaceId: z.uuid(),
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
    description: z.string().trim()
        .min(10, "Name must be at least 10 characters long")
        .max(100, "Name must be at most 100 characters long")
        .optional(),
});
export const getBodySchema = z.undefined()
    .or(z.object({}).strict());
export const listByWorkspaceBodySchema = z.undefined()
    .or(z.object({}).strict());
export const listByUserBodySchema = z.undefined()
    .or(z.object({}).strict());
export const updateBodySchema = z.object({
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
    description: z.string().trim()
        .min(10, "Name must be at least 10 characters long")
        .max(100, "Name must be at most 100 characters long")
        .optional(),
});
export const removeBodySchema = z.undefined()
    .or(z.object({}).strict());
// RESPONSE
export const safeProjectResponseSchema = z.object({
    workspaceId: z.uuid(),
    id: z.uuid(),
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
    description: z.string().trim()
        .min(10, "Name must be at least 10 characters long")
        .max(100, "Name must be at most 100 characters long"),
    createdAt: z.date(),
    createdBy: z.uuid()
});
export const listProjectsResponseSchema = z.array(safeProjectResponseSchema);
