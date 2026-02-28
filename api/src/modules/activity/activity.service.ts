import type { ActivityAction } from "../../../prisma/generated/enums.js";
import type { DbOrTxClient } from "../../db/prisma.js";
import { activityRepo } from "./activity.repo.js";

export const activityService = {
    async logActivity(
        workspaceId: string,
        action: ActivityAction,
        entityType: string,
        actorId?: string,
        entityId?: string,
        meta?: unknown,
        db: DbOrTxClient | undefined = undefined
    ) {
        await activityRepo.log({
            action,
            entityType,
            entityId,
            meta: meta ? JSON.stringify(meta) : undefined,
            workspace: { connect: { id: workspaceId } },
            actor: actorId ? { connect: { id: actorId } } : undefined,
        }, db);
    }
}
