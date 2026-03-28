import type { ActivityAction } from '../../../prisma/generated/enums.js';
import type { DbOrTxClient } from '../../db/prisma.js';
import type { ActivityRepo } from './activity.repo.js';

export class ActivityService {
  constructor(private activityRepo: ActivityRepo) {}

  async logActivity(
    workspaceId: string,
    action: ActivityAction,
    entityType: string,
    actorId?: string,
    entityId?: string,
    meta?: unknown,
    db: DbOrTxClient | undefined = undefined,
  ) {
    await this.activityRepo.log(
      {
        action,
        entityType,
        entityId,
        meta: meta ? JSON.stringify(meta) : undefined,
        workspace: { connect: { id: workspaceId } },
        actor: actorId ? { connect: { id: actorId } } : undefined,
      },
      db,
    );
  }
}
