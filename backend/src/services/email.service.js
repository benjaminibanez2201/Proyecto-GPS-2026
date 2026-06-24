"use strict";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import path from "path";
import {
  BACKEND_URL,
  EMAIL_FROM,
  EMAIL_PASS,
  EMAIL_USER,
  FRONTEND_URL,
} from "../config/configEnv.js";
import { renderEmailTemplate } from "../helpers/emailTemplate.helper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bannerPath = path.resolve(__dirname, "../../../frontend/src/assets/slidebaar.png");
const bannerCid = "arriendu-banner";
const logoPath = path.resolve(__dirname, "../../../frontend/src/assets/miLogo.png");
const logoCid = "arriendu-logo";

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Faltan EMAIL_USER o EMAIL_PASS en el .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

function normalizeBaseUrl(url = "http://localhost:5173") {
  return url.replace(/\/$/, "");
}

function buildEmailConfirmationUrl(token) {
  return `${normalizeBaseUrl(BACKEND_URL)}/auth/confirm-email/${encodeURIComponent(token)}`;
}

function getBrandAttachments() {
  return [
    {
      filename: "slidebaar.png",
      path: bannerPath,
      cid: bannerCid,
    },
    {
      filename: "miLogo.png",
      path: logoPath,
      cid: logoCid,
    },
  ];
}


async function sendTemplateEmail({ attachments = [], data, subject, template, to }) {
  const { html, text } = await renderEmailTemplate(template, data);

  return createTransporter().sendMail({
    from: EMAIL_FROM,
    html,
    subject,
    text,
    to,
    attachments,
  });
}

export async function sendAccountApprovedEmail(user) {
  const confirmEmailUrl = user.emailVerificacionToken
    ? buildEmailConfirmationUrl(user.emailVerificacionToken)
    : `${normalizeBaseUrl(FRONTEND_URL)}/auth`;

  return sendTemplateEmail({
    to: user.email,
    subject: "Confirma tu correo para activar tu cuenta ArriendU",
    template: "account-approved",
    data: {
      confirmEmailUrl,
      loginUrl: `${normalizeBaseUrl(FRONTEND_URL)}/auth`,
      nombreCompleto: user.nombreCompleto,
    },
  });
}

export async function sendRegistrationReceivedEmail(user) {
  return sendTemplateEmail({
    to: user.email,
    subject: "Recibimos tu registro en ArriendU",
    template: "registration-received",
    attachments: getBrandAttachments(),
    data: {
      loginUrl: `${normalizeBaseUrl(FRONTEND_URL)}/auth`,
      nombreCompleto: user.nombreCompleto,
      rol: user.rol,
    },
  });
}

export async function sendAccountRejectedEmail(user, motivoRechazo = "") {
  return sendTemplateEmail({
    to: user.email,
    subject: "Tu cuenta ArriendU fue revisada",
    template: "account-rejected",
    data: {
      motivoRechazo: motivoRechazo || "No se especifico un motivo.",
      nombreCompleto: user.nombreCompleto,
    },
  });
}

export async function sendVerificationInfoRequestEmail(user, solicitudAntecedentes = "") {
  return sendTemplateEmail({
    to: user.email,
    subject: "Necesitamos nuevos antecedentes para revisar tu cuenta",
    template: "verification-info-request",
    data: {
      nombreCompleto: user.nombreCompleto,
      solicitudAntecedentes: solicitudAntecedentes
        || "El administrador solicito nuevos antecedentes para completar la revision.",
    },
  });
}

export async function sendRecoveryEmail(email, resetToken) {
  const resetUrl = `${normalizeBaseUrl(FRONTEND_URL)}/reset-password/${encodeURIComponent(resetToken)}`;

  return sendTemplateEmail({
    to: email,
    subject: "Restablecer contrasena",
    template: "password-recovery",
    attachments: getBrandAttachments(),
    data: {
      resetUrl,
    },
  });
}

export async function sendRentalCompleteEmail(rental) {
  try {
    const transporter = createTransporter();
    const baseUrl = normalizeBaseUrl(FRONTEND_URL);
    const idPublicacion = rental.publicacionId || rental.publicacion?.id || rental.id;
    const rentalUrl = `${baseUrl}/publicacion/${idPublicacion}`;
    const nextPath = `/publicacion/${idPublicacion}`;
    const loginWithNextUrl = `${baseUrl}/auth?next=${encodeURIComponent(nextPath)}`;
    const greetingNameArrendador = rental.arrendador?.nombreCompleto || "Arrendador";
    const greetingNameEstudiante = rental.estudiante?.nombreCompleto || "Estudiante";

    const commonWrapper = [
      "margin:0",
      "padding:0",
      "background-color:#fdfefe",
      "font-family:Arial,Helvetica,sans-serif",
    ].join(";");
    const containerStyle = ["max-width:600px", "margin:0 auto", "padding:24px"].join(";");
    const cardStyle = [
      "background:#ffffff",
      "border:1px solid #e6e8ef",
      "border-radius:10px",
      "overflow:hidden",
    ].join(";");
    const headerStyle = ["padding:18px 24px", "background:#008080", "color:#ffffff"].join(";");
    const bannerStyle = [
      "display:block",
      "max-width:220px",
      "width:100%",
      "height:auto",
      "margin:0 0 10px",
    ].join(";");
    const bodyStyle = ["padding:24px", "color:#111827"].join(";");
    const pStyle = ["margin:0 0 12px", "font-size:14px", "line-height:1.6"].join(";");
    const centerStyle = ["text-align:center", "margin:22px 0"].join(";");
    const buttonStyle = [
      "display:inline-block",
      "padding:12px 18px",
      "border-radius:8px",
      "background:#008080",
      "color:#ffffff",
      "text-decoration:none",
      "font-weight:700",
      "font-size:14px",
    ].join(";");
    const footerStyle = [
      "padding:16px 24px",
      "background:#fdfefe",
      "border-top:1px solid #e6e8ef",
      "color:#6b7280",
      "font-size:12px",
      "line-height:1.5",
    ].join(";");

    const buildMail = ({ name, otherName, subject, to }) => ({
      from: EMAIL_FROM,
      to,
      subject,
        text: [
        `Hola ${name},`,
        "",
        `Tu arriendo con ${otherName} ha sido confirmado por ambas partes. Gracias por usar ArriendU.`,
        "",
        loginWithNextUrl,
        "",
        "Saludos,",
        "Soporte ArriendU",
      ].join("\n"),
      html: [
        `<div style="${commonWrapper}">`,
        `  <div style="${containerStyle}">`,
        `    <div style="${cardStyle}">`,
        `      <div style="${headerStyle}">`,
        `        <img src="cid:${bannerCid}" alt="ArriendU" style="${bannerStyle}" />`,
        "        <p style=\"margin:6px 0 0;font-size:13px;opacity:0.95\">Arriendo confirmado</p>",
        "      </div>",
        `      <div style="${bodyStyle}">`,
        `        <p style="${pStyle}">Hola ${name},</p>`,
        `        <p style="${pStyle}">Tu arriendo con ${otherName} ha sido confirmado por ambas partes.</p>`,
        `        <div style="${centerStyle}">`,
        `          <a href="${loginWithNextUrl}" style="${buttonStyle}">Ver arriendo</a>`,
        "        </div>",
        "        <p style=\"margin:0;font-size:13px;line-height:1.6;color:#6b7280;\">",
        "          Este es un mensaje automatico, por favor no respondas.",
        "        </p>",
        "      </div>",
        `      <div style="${footerStyle}">`,
        "        <p style=\"margin:0\">Gracias por usar ArriendU</p>",
        "      </div>",
        "    </div>",
        "  </div>",
        "</div>",
      ].join("\n"),
      attachments: getBrandAttachments(),
    });

    if (rental.arrendador?.email) {
      await transporter.sendMail(buildMail({
        name: greetingNameArrendador,
        otherName: greetingNameEstudiante,
        subject: "Arriendo confirmado",
        to: rental.arrendador.email,
      }));
    }

    if (rental.estudiante?.email) {
      await transporter.sendMail(buildMail({
        name: greetingNameEstudiante,
        otherName: greetingNameArrendador,
        subject: "Arriendo confirmado",
        to: rental.estudiante.email,
      }));
    }
  } catch (error) {
    console.error("Error al enviar correos de arriendo completado:", error);
  }
}

export async function sendCredentialChangedEmail(user, tiposCambio = []) {
  const descripcion = tiposCambio.includes('email')
    ? 'tu correo electrónico de acceso'
    : 'tu contraseña';

  return sendTemplateEmail({
    to: user.email, // se envía al correo anterior
    subject: "Aviso de seguridad: cambio de credenciales en ArriendU",
    template: "credenciales-cambio",
    attachments: getBrandAttachments(),
    data: {
      nombreCompleto: user.nombreCompleto,
      descripcion,
      loginUrl: `${normalizeBaseUrl(FRONTEND_URL)}/auth`,
    },
  });
}
