import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../errors/AppError.js";
import type { WorkspaceRole } from "../../../prisma/generated/enums.js";

export type WorkspaceParams = { workspaceId: string };

const rank: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
}

export function requireWorkspaceMember(minRole: WorkspaceRole = "viewer") {
    return async (req: Request<WorkspaceParams>, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("Unauthorized", 401, "USER_NOT_AUTHENTICATED")
        }

        const workspaceId = req.params.workspaceId;

        const mebership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId },
            },
            select: { role: true },
        })

        if (!mebership) {
            throw new AppError("Forbidden", 403, "USER_NOT_WORKSPACE_MEMBER")
        }

        if (rank[mebership.role] < rank[minRole]) {
            throw new AppError("Forbidden", 403, "INSUFFICIENT_WORKSPACE_ROLE")
        }

        next();
    }
}