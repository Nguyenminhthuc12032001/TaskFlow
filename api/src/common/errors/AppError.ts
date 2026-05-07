export class AppError extends Error {
  status: number;
  code?: string;
  detail?: unknown;

  constructor(message: string, status = 500, code?: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
