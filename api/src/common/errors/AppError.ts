export class AppError extends Error {
  status: number;
  code?: string;
  detail?: any;

  constructor(message: string, status = 500, code?: string, detail?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
