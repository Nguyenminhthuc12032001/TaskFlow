import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD
    },
    tls: { minVersion: "TLSv1.2" }
});

export async function sendPasswordResetEmail(email: string, resetLink: string) {
    await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Reset your password",
        html:`
        <p>Click here to reset:</p>
        <a href="${resetLink}">${resetLink}</a>
        `
    });
};

export async function sendInviteEmail(email: string, workspaceName: string, inviteLink: string) {
    await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: `You are invited to join workspace: ${workspaceName}`,
        html: `
        <p>You have been invited to join the workspace: <strong>${workspaceName}</strong></p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        `
    });
};