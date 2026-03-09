export class ActivityService {
    constructor(activityRepo) {
        this.activityRepo = activityRepo;
    }
    async logActivity(workspaceId, action, entityType, actorId, entityId, meta, db = undefined) {
        await this.activityRepo.log({
            action,
            entityType,
            entityId,
            meta: meta ? JSON.stringify(meta) : undefined,
            workspace: { connect: { id: workspaceId } },
            actor: actorId ? { connect: { id: actorId } } : undefined,
        }, db);
    }
}
