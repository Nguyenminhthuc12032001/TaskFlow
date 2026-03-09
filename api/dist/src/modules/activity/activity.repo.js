import { prisma } from "../../db/prisma.js";
export class ActivityRepo {
    async log(data, db = prisma) {
        return db.activityLog.create({ data });
    }
    async deleteByWorkspaceId(workspaceId, actorId, db = prisma) {
        return db.activityLog;
    }
}
