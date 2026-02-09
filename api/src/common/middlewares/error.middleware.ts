import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { fail } from "../utils/response/format.js";

export function errorMiddleware (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error(err);

    if (err instanceof AppError) {
        return res.status(err.status).json(fail(err.message))
    }

    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json(fail(message))
}