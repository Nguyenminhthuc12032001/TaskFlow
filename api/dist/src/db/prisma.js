import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../prisma/generated/client.js';
import { env } from '../config/env.js';
const SOFT_DELETE_MODELS = [
    'Workspace',
    'WorkspaceMember',
    'Project',
    'Column',
    'Task',
    'Comment',
    'Lead',
    'ActivityLog',
];
const SOFT_DELETE_MODEL_SET = new Set(SOFT_DELETE_MODELS);
function isSoftDeleteModel(model) {
    return typeof model === 'string' && SOFT_DELETE_MODEL_SET.has(model);
}
const db = new PrismaClient({
    adapter: new PrismaPg(new Pool({
        connectionString: env.DATABASE_URL,
    })),
});
const softDeleteDelegates = {
    Workspace: db.workspace,
    WorkspaceMember: db.workspaceMember,
    Project: db.project,
    Column: db.column,
    Task: db.task,
    Comment: db.comment,
    Lead: db.lead,
    ActivityLog: db.activityLog,
};
function addNotDeleted(args) {
    const where = args.where ?? {};
    const hasDeletedAtFilter = Object.prototype.hasOwnProperty.call(where, 'deletedAt');
    if (!hasDeletedAtFilter) {
        args.where = {
            ...where,
            deletedAt: null,
        };
    }
}
const AUTO_FILTER_OPERATIONS = new Set([
    'findUnique',
    'findFirst',
    'findMany',
    'count',
    'aggregate',
    'groupBy',
    'update',
    'updateMany',
    'upsert',
]);
export const prisma = db.$extends({
    name: 'soft-delete',
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                if (!isSoftDeleteModel(model)) {
                    return query(args);
                }
                const softDeleteArgs = args;
                if (AUTO_FILTER_OPERATIONS.has(operation)) {
                    addNotDeleted(softDeleteArgs);
                    return query(args);
                }
                const delegate = softDeleteDelegates[model];
                if (operation === 'delete') {
                    return delegate.update({
                        where: {
                            ...(softDeleteArgs.where ?? {}),
                        },
                        data: {
                            deletedAt: new Date(),
                        },
                    });
                }
                if (operation === 'deleteMany') {
                    return delegate.updateMany({
                        where: {
                            ...(softDeleteArgs.where ?? {}),
                            deletedAt: null,
                        },
                        data: {
                            deletedAt: new Date(),
                        },
                    });
                }
                return query(args);
            },
        },
    },
});
export { db };
