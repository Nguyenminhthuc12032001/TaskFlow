import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { fail } from "../utils/response/format.js";
import { log } from "../logger/logger.js";

export function errorMiddleware (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof AppError) {
        return res.status(err.status).json(fail(err.message, err.code, err.detail))
    }

    log.error(
        {
            error: err,
            requestId: req.requestId,
            userId: req.user?.id,
        },
        "Unhandled error"
    )

    res.status(500).json(fail(`Internal Server Error: ${err}`))
}