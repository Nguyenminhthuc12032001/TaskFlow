import z from "zod";

// ========= REQUEST ==========

// POST workspace/create
export const createBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
});
export type CreateWorkspaceBody = z.infer<typeof createBodySchema>;

// Get workspace
export const getByUserIdBodySchema = z.undefined()
    .or(z.object({}).strict());

// Get workspace/:workspaceId
export const getByIdBodySchema = z.undefined()
    .or(z.object({}).strict());

//  Put workspace/:workspaceId
export const updateBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
});
export type UpdateWorkspaceBody = z.infer<typeof updateBodySchema>;

// DELETE workspace/:workspaceId
export const deleteBodySchema = z.undefined()
    .or(z.object({}).strict());

// ========= RESPONSE ==========

// POST workspace/create
export const createResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type SafeWorkspaceResponse = z.infer<typeof createResponseSchema>;

// Get workspace
export const getByUserIdResponseSchema = z.array(createResponseSchema);
export type SafeWorkspacesResponse = z.infer<typeof getByUserIdResponseSchema>;

// Get workspace/:workspaceId
export const getByIdResponseSchema = createResponseSchema;

// Put workspace/:workspaceId
export const updateResponseSchema = createResponseSchema;