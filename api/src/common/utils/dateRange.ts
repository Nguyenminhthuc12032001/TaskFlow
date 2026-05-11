import { AppError } from '../errors/AppError.js';
import type { DataRangeQueryType } from '../schemas/common.schemas.js';

export function buildDateRange(query: { startDate?: Date; endDate?: Date }): DataRangeQueryType {
  const now = new Date();

  if (query.startDate && query.startDate > now) {
    throw new AppError('Start date must be in the past', 400);
  }

  if (query.endDate && query.endDate > now) {
    throw new AppError('End date must be in the past', 400);
  }

  return {
    startDate: query.startDate,
    endDate: query.endDate,
  };
}
