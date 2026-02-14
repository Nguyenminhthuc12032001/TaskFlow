import { pino } from "pino";
import { env } from "../../config/env.js";

export const log = pino({
    level: env.LOG_LEVEL ?? "info",
    
    redact: {
        paths: [
            "req.header.authorization",
            "req.header.cookie",
            "req.body.password",
            "req.body.newPassword",
            "req.body.currentPassword",
            "refreshToken",
            "accessToken",
            "resetToken",
            "csrfToken"
        ],
        remove: true
    },

    base: {
        service: "taskflow-api"
    },

    timestamp: pino.stdTimeFunctions.isoTime
})