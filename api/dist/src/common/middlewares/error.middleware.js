import { AppError } from "../errors/AppError.js";
export function errorMiddleware(err, req, res, next) {
    console.error(err);
    if (err instanceof AppError) {
        return res.status(err.status).json({
            ok: false,
            error: { message: err.message }
        });
    }
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
        ok: false,
        error: { message }
    });
}
