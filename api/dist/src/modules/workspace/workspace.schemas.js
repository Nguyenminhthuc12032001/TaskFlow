import z from "zod";
// ========= REQUEST ==========
// POST workspace/create
export const createBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
});
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
// DELETE workspace/:workspaceId
export const deleteBodySchema = z.undefined()
    .or(z.object({}).strict());
// ========= RESPONSE ==========
// POST workspace/create
export const createResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
// Get workspace
export const getByUserIdResponseSchema = z.array(createResponseSchema);
// Get workspace/:workspaceId
export const getByIdResponseSchema = createResponseSchema;
// Put workspace/:workspaceId
export const updateResponseSchema = createResponseSchema;
