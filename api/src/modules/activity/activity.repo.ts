import type { Prisma } from "../../../prisma/generated/client.js";
import { prisma, type DbOrTxClient } from "../../db/prisma.js";

export const activityRepo = {
    async log(data: Prisma.ActivityLogCreateInput, db: DbOrTxClient = prisma) {
        return db.activityLog.create({ data });
    }
}
