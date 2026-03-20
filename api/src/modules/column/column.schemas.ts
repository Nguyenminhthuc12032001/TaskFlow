import z from "../../docs/zod.js";
import { ColumnType } from "../../../prisma/generated/enums.js";

// REQUEST

export const createBodySchema = z.object({
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
    position: z.number()
        .int("Position must be an integer")
        .min(0, "Position must be greater than or equal to 0"),
    type: z.enum(ColumnType)
}).strict();
export type CreateBodyType = z.infer<typeof createBodySchema>;

export const updateBodySchema = z.object({
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long")
}).strict();
export type UpdateBodyType = z.infer<typeof updateBodySchema>;

export const reOrderBodySchema = z.array(
    z.object({
        columnId: z.uuid(),
        position: z.number()
            .int("Position must be an integer")
            .min(0, "Position must be greater than or equal to 0")
    }).strict()
).min(1, "ReOrder data cannot be empty")
    .superRefine((items, ctx) => {
        const idSet = new Set<string>();
        const positionSet = new Set<number>();

        items.forEach((item, index) => {
            if (idSet.has(item.columnId)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Duplicate id is not allowed",
                    path: [index, "columnId"]
                });
            };
            idSet.add(item.columnId);

            if (positionSet.has(item.position)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Duplicate position is not allowed",
                    path: [index, "position"]
                });
            };
            positionSet.add(item.position);
        })
    });
export type ReOrderBodyType = z.infer<typeof reOrderBodySchema>;

// RESPONSE
export const safeColumnSchema = z.object({
    id: z.uuid(),
    projectId: z.uuid(),
    name: z.string().trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
    position: z.number()
        .int("Position must be an integer")
        .min(0, "Position must be greater than or equal to 0"),
    type: z.enum(ColumnType),
    createdAt: z.date()
});
export type SafeColumnType = z.infer<typeof safeColumnSchema>;

export const safeColumnsSchema = z.array(safeColumnSchema)
    .superRefine((items, ctx) => {
        const idSet = new Set<string>();
        const positionSet = new Set<number>();

        items.forEach((item, index) => {
            if (idSet.has(item.id)) {
                ctx.addIssue(
                    {
                        code: "custom",
                        message: "Duplicate id is not allowed",
                        path: [index, "columnId"]
                    }
                )
            }
            idSet.add(item.id);

            if (positionSet.has(item.position)) {
                ctx.addIssue(
                    {
                        code: "custom",
                        message: "Duplicate position is not allowed",
                        path: [index, "position"]
                    }
                )
            }
            positionSet.add(item.position);
        });
    });
export type SafeColumnsType = z.infer<typeof safeColumnsSchema>;