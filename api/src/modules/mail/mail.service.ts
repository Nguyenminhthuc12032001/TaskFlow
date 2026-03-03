import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import type { IEmailService } from "./mail.interface.js";

export class EmailService implements IEmailService {
    private transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_APP_PASSWORD
        },
        tls: { minVersion: "TLSv1.2" }
    });

    async sendPasswordResetEmail(email: string, resetLink: string) {
        await this.transporter.sendMail({
            from: env.EMAIL_FROM,
            to: email,
            subject: "Reset your password",
            html: `
        <p>Click here to reset:</p>
        <a href="${resetLink}">${resetLink}</a>
        `
        });
    };

    async sendInviteEmail(email: string, workspaceName: string, inviteLink: string) {
    await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: `You are invited to join workspace: ${workspaceName}`,
        html: `
        <p>You have been invited to join the workspace: <strong>${workspaceName}</strong></p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        `
    });
}}