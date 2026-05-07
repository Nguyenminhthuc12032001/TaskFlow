import type { PaginationMetaType } from "../schemas/common.schemas.js";

export const buildPagination = (page?: number, limit?: number): { safePage: number, safeLimit: number, skip: number, take: number } => {
    const safePage = page && page > 0 ? page : 1;
    const safeLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;

    return {
        safePage: safePage,
        safeLimit: safeLimit,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
    }
};

export const buildPaginationMeta = (safePage: number, safeLimit: number, totalItems: number): PaginationMetaType => {
    const totalPages = Math.ceil(totalItems / safeLimit);

    const paginationMeta: PaginationMetaType = {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
    };

    return paginationMeta;
}