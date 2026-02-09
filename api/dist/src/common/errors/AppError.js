export class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
