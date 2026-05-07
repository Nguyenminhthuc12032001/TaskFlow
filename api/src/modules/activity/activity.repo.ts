import type { ActivityLog, Prisma } from '../../../prisma/generated/client.js';
import { prisma, type DbOrTxClient } from '../../db/prisma.js';

export class ActivityRepo {
  async log(data: Prisma.ActivityLogCreateInput, db: DbOrTxClient = prisma): Promise<ActivityLog> {
    return db.activityLog.create({ data });
  }

  async deleteByWorkspaceId(workspaceId: string, actorId: string, db: DbOrTxClient = prisma): Promise<Prisma.BatchPayload> {
    return db.activityLog.deleteMany({
      where: {
        workspaceId,
        actorId,
      },
    });
  }
}
