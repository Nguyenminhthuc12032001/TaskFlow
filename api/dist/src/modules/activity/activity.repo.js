import { prisma } from "../../db/prisma.js";
export const activityRepo = {
    async log(data, db = prisma) {
        return db.activityLog.create({ data });
    }
};
