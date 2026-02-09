import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export const transporter = nodemailer.createTransport({
    host: "smpt.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD
    }
});

export async function sendPasswordResetEmail(email: string, resetLink: string) {
    await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Reset your password",
        html:`
        <p>Click here to reset:</>
        <a href="${resetLink}">${resetLink}</a>
        `
    });
}