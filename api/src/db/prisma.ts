import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client.js';
import { Pool } from 'pg';
import { env } from '../config/env.js';

const SOFT_DELETE_MODELS = new Set([
    'workdspace',
    'project',
    'task',
    'comment',
    'lead',
    'activityLog'
] as const);

const db = new PrismaClient({
    adapter: new PrismaPg(
        new Pool({
            connectionString: env.DATABASE_URL
        })
    )
});

function addNotDeleted(args: any) {
    const where = args?.where ?? {};
    if (where.deletedAt == undefined) {
        args.where = { ...where, deletedAt: null };
    }
}

export const prisma = db.$extends({
    name: 'soft-delete',
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                if (!model || !SOFT_DELETE_MODELS.has(model as any)) {
                    return query(args);
                }

                if (
                    operation === 'findUnique' ||
                    operation === 'findFirst' ||
                    operation === 'findMany' ||
                    operation === 'count' ||
                    operation === 'aggregate' ||
                    operation === 'groupBy' ||
                    operation === 'update' ||
                    operation === 'updateMany' ||
                    operation === 'upsert'
                ) {
                    addNotDeleted(args);
                    return query(args);
                }

                if (operation === 'delete') {
                    return (db as any)[model].update({
                        where: { ...(args?.where ?? {}) },
                        data: { deletedAt: new Date() },
                    });
                }

                if (operation === 'deleteMany') {
                    return (db as any)[model].update({
                        where: { ...(args?.where ?? {}), deletedAt: null },
                        data: { deletedAt: new Date() }
                    })
                }

                return query(args)
            }
        }
    }
})

export { db };