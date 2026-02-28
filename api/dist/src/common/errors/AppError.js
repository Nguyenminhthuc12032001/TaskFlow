export class AppError extends Error {
    constructor(message, status = 500, code, detail) {
        super(message);
        this.status = status;
        this.code = code;
        this.detail = detail;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
