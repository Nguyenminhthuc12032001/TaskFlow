import { prisma } from "../../db/prisma.js";
export const workspaceRepo = {
    async create(workspaceData, db = prisma) {
        return db.workspace.create({
            data: workspaceData,
        });
    },
    async createMembership(workspaceMemberData, db = prisma) {
        return db.workspaceMember.create({
            data: workspaceMemberData
        });
    },
    async findById(workspaceId, db = prisma) {
        return db.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });
    },
    async findByUserId(userId, db = prisma) {
        return db.workspace.findMany({
            where: {
                members: {
                    some: { userId }
                }
            }
        });
    },
    async update(workspaceId, data, db = prisma) {
        return db.workspace.update({
            where: { id: workspaceId },
            data,
        });
    },
    async delete(workspaceId, db = prisma) {
        return db.workspace.delete({
            where: { id: workspaceId }
        });
    }
};
