import { ActivityAction } from "../../../prisma/generated/client.js";
import { prisma } from "../../db/prisma.js";
import { activityService } from "../activity/activity.service.js";
import { workspaceRepo } from "./workspace.repo.js";
export const workspaceService = {
    async create(workspaceData, userId) {
        const result = await prisma.$transaction(async (tx) => {
            const newWorkspace = {
                name: workspaceData.name,
                creator: { connect: { id: userId } }
            };
            const workspace = await workspaceRepo.create(newWorkspace, tx);
            const newWorkspaceMember = {
                user: { connect: { id: userId } },
                workspace: { connect: { id: workspace.id } },
                role: "owner"
            };
            await workspaceRepo.createMembership(newWorkspaceMember, tx);
            await activityService.logActivity(workspace.id, ActivityAction.CREATE_WORKSPACE, "workspace", userId, workspace.id, { name: workspace.name }, tx);
            const safeWorkspace = {
                id: workspace.id,
                name: workspace.name,
                createdBy: workspace.createdBy,
                createdAt: workspace.createdAt.toISOString(),
                updatedAt: workspace.updatedAt.toISOString(),
            };
            return safeWorkspace;
        });
        return result;
    },
    async getById(workspaceId, userId) {
        const workspace = await workspaceRepo.findById(workspaceId);
    }
};
