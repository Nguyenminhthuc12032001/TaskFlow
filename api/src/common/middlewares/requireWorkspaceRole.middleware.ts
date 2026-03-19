import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../errors/AppError.js";
import type { WorkspaceRole } from "../../../prisma/generated/enums.js";

export type WorkspaceParams = { workspaceId: string, memberId?: string, projectId?: string, columnId?: string, taskId?: string };

const rank: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
}

export function requireWorkspaceRole(minRole: WorkspaceRole = "viewer") {
    return async (req: Request<WorkspaceParams>, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("Unauthorized", 401, "USER_NOT_AUTHENTICATED")
        };

        const workspaceId = req.params.workspaceId;

        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId },
            },
            select: { role: true },
        });

        if (!membership) {
            throw new AppError("Forbidden", 403, "USER_NOT_WORKSPACE_MEMBER")
        };

        if (rank[membership.role] < rank[minRole]) {
            throw new AppError("Forbidden", 403, "INSUFFICIENT_WORKSPACE_ROLE")
        };

        const projectId = req.params.projectId;
        if (projectId) {
            const projectInWorkspace = await prisma.project.findUnique({
                where: {
                    workspaceId_id: { workspaceId, id: projectId }
                }
            });

            if (!projectInWorkspace) {
                throw new AppError("Project not found", 404, "PROJECT_NOT_IN_WORKSPACE")
            }

            const columnId = req.params.columnId;
            if (columnId) {
                const columnInProject = await prisma.column.findUnique({
                    where: {
                        projectId_id: { projectId, id: columnId }
                    }
                })

                if (!columnInProject) {
                    throw new AppError("Column not found", 404, "COLUMN_NOT_IN_PROJECT")
                }
            };
        };

        next();
    }
}