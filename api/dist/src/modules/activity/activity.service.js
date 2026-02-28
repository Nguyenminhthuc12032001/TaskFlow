import { activityRepo } from "./activity.repo.js";
export const activityService = {
    async logActivity(workspaceId, action, entityType, actorId, entityId, meta, db = undefined) {
        await activityRepo.log({
            action,
            entityType,
            entityId,
            meta: meta ? JSON.stringify(meta) : undefined,
            workspace: { connect: { id: workspaceId } },
            actor: actorId ? { connect: { id: actorId } } : undefined,
        }, db);
    }
};
