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
] as const;

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

const SOFT_DELETE_MODEL_SET = new Set<string>(SOFT_DELETE_MODELS);

function isSoftDeleteModel(model: string | undefined): model is SoftDeleteModel {
  return typeof model === 'string' && SOFT_DELETE_MODEL_SET.has(model);
}

type SoftDeleteArgs = {
  where?: Record<string, unknown>;
};

type SoftDeleteDelegate = {
  update(args: { where: Record<string, unknown>; data: { deletedAt: Date } }): Promise<unknown>;

  updateMany(args: { where: Record<string, unknown>; data: { deletedAt: Date } }): Promise<unknown>;
};

const db = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: env.DATABASE_URL,
    }),
  ),
});

const softDeleteDelegates: Record<SoftDeleteModel, SoftDeleteDelegate> = {
  Workspace: db.workspace as unknown as SoftDeleteDelegate,
  WorkspaceMember: db.workspaceMember as unknown as SoftDeleteDelegate,
  Project: db.project as unknown as SoftDeleteDelegate,
  Column: db.column as unknown as SoftDeleteDelegate,
  Task: db.task as unknown as SoftDeleteDelegate,
  Comment: db.comment as unknown as SoftDeleteDelegate,
  Lead: db.lead as unknown as SoftDeleteDelegate,
  ActivityLog: db.activityLog as unknown as SoftDeleteDelegate,
};

function addNotDeleted(args: SoftDeleteArgs): void {
  const where = args.where ?? {};

  const hasDeletedAtFilter = Object.prototype.hasOwnProperty.call(where, 'deletedAt');

  if (!hasDeletedAtFilter) {
    args.where = {
      ...where,
      deletedAt: null,
    };
  }
}

const AUTO_FILTER_OPERATIONS = new Set<string>([
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

        const softDeleteArgs = args as SoftDeleteArgs;

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

type InteractiveTransactionCallback = Parameters<typeof prisma.$transaction>[0];

export type TxClient = InteractiveTransactionCallback extends (tx: infer T) => unknown ? T : never;

export type DbClient = typeof prisma;
export type DbOrTxClient = DbClient | TxClient;

export { db };
