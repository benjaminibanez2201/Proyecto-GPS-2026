import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../config/configEnv.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// Fallback SOLO para desarrollo local. En producción definir FRONTEND_URL en el .env.
// TODO: cambiar esta URL cuando se despliegue el frontend.
const DEFAULT_FRONTEND_URL = "http://localhost:5173";
const FRONTEND_URL = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

export async function sendRecoveryEmail(email, resetToken) {
    const baseUrl = FRONTEND_URL.replace(/\/$/, "");
    const encodedToken = encodeURIComponent(resetToken);
    const resetUrl = `${baseUrl}/reset-password/${encodedToken}`;

    const wrapperStyle = [
        "margin:0",
        "padding:0",
        "background-color:#f6f7fb",
        "font-family:Arial,Helvetica,sans-serif",
    ].join(";");
    const containerStyle = ["max-width:600px", "margin:0 auto", "padding:24px"].join(";");
    const cardStyle = [
        "background:#ffffff",
        "border:1px solid #e6e8ef",
        "border-radius:10px",
        "overflow:hidden",
    ].join(";");
    const headerStyle = ["padding:18px 24px", "background:#0b2a5b", "color:#ffffff"].join(";");
    const titleStyle = ["margin:0", "font-size:18px", "font-weight:700"].join(";");
    const subtitleStyle = ["margin:6px 0 0", "font-size:13px", "opacity:0.95"].join(";");
    const bodyStyle = ["padding:24px", "color:#111827"].join(";");
    const pStyle = ["margin:0 0 12px", "font-size:14px", "line-height:1.6"].join(";");
    const pSecondaryStyle = ["margin:0 0 16px", "font-size:14px", "line-height:1.6"].join(";");
    const centerStyle = ["text-align:center", "margin:22px 0"].join(";");
    const buttonStyle = [
        "display:inline-block",
        "padding:12px 18px",
        "border-radius:8px",
        "background:#2563eb",
        "color:#ffffff",
        "text-decoration:none",
        "font-weight:700",
        "font-size:14px",
    ].join(";");
    const smallMutedStyle = [
        "margin:0 0 8px",
        "font-size:13px",
        "line-height:1.6",
        "color:#374151",
    ].join(";");
    const breakAllStyle = [
        "margin:0 0 16px",
        "font-size:13px",
        "line-height:1.6",
        "word-break:break-all",
    ].join(";");
    const linkStyle = ["color:#2563eb", "text-decoration:underline"].join(";");
    const noteStyle = ["margin:0", "font-size:13px", "line-height:1.6", "color:#6b7280"].join(";");
    const footerStyle = [
        "padding:16px 24px",
        "background:#f9fafb",
        "border-top:1px solid #e6e8ef",
        "color:#6b7280",
        "font-size:12px",
        "line-height:1.5",
    ].join(";");
    const footerPStyle = ["margin:0"].join(";");

    const mailOptions = {
        from: `ArriendU <${EMAIL_USER}>`,
        to: email,
        subject: "Restablecer Contraseña",
        text:
            "Hola,\n\n"
            + "Recibimos una solicitud para restablecer tu contraseña.\n"
            + `Para continuar, usa este enlace:\n${resetUrl}\n\n`
            + "Si no solicitaste este cambio, puedes ignorar este correo.\n\n"
            + "Saludos,\nSoporte ArriendU",
        html: [
            `<div style="${wrapperStyle}">`,
            `  <div style="${containerStyle}">`,
            `    <div style="${cardStyle}">`,
            `      <div style="${headerStyle}">`,
            `        <h1 style="${titleStyle}">ArriendU</h1>`,
            `        <p style="${subtitleStyle}">Restablecimiento de contraseña</p>`,
            "      </div>",
            `      <div style="${bodyStyle}">`,
            `        <p style="${pStyle}">Hola,</p>`,
            `        <p style="${pSecondaryStyle}">`,
            "          Recibimos una solicitud para restablecer tu contraseña.",
            "          Para continuar, haz clic en el siguiente botón:",
            "        </p>",
            `        <div style="${centerStyle}">`,
            `          <a href="${resetUrl}" style="${buttonStyle}">Restablecer contraseña</a>`,
            "        </div>",
            `        <p style="${smallMutedStyle}">`,
            "          Si el botón no funciona, copia y pega este enlace en tu navegador:",
            "        </p>",
            `        <p style="${breakAllStyle}">`,
            `          <a href="${resetUrl}" style="${linkStyle}">${resetUrl}</a>`,
            "        </p>",
            `        <p style="${noteStyle}">Si no solicitaste este cambio, puedes ignorar este correo.</p>`,
            "      </div>",
            `      <div style="${footerStyle}">`,
            `        <p style="${footerPStyle}">`,
            "          Este es un mensaje automático, por favor no respondas a este correo.",
            "        </p>",
            "      </div>",
            "    </div>",
            "  </div>",
            "</div>",
        ].join("\n"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[email.service] Recovery email sent", {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        envelope: info.envelope,
    });
}

