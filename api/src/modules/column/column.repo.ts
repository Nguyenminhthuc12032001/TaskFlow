import type { Prisma } from "../../../prisma/generated/client.js";
import type { DbClient, DbOrTxClient } from "../../db/prisma.js";

export class ColumnRepo {
    constructor(
        readonly prisma: DbClient
    ) { };

    create = async (
        data: Prisma.ColumnCreateInput,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    listByProject = async (
        projectId: string,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    get = async (
        columnId: string,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    update = async (
        data: Prisma.ColumnUpdateInput,
        columnId: string,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    reOrder = async (
        columns: { id: string, position: number }[],
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    remove = async (
        columnId: string,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };

    removeByProject = async (
        projectId: string,
        actorId: string,
        db: DbOrTxClient = this.prisma) => { };
}