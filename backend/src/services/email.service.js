import nodemailer from "nodemailer";
import { EMAIL_FROM, EMAIL_PASS, EMAIL_USER, FRONTEND_URL } from "../config/configEnv.js";
import path from "path";
import { fileURLToPath } from "url";
import { renderEmailTemplate } from "../helpers/emailTemplate.helper.js";       


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bannerPath = path.resolve(__dirname, "../../../frontend/public/BannerArriendU.png");
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

function getBrandAttachments() {
  return [
    {
      filename: "BannerArriendU.png",
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
  return sendTemplateEmail({
    to: user.email,
    subject: "Tu cuenta ArriendU fue aprobada",
    template: "account-approved",
    data: {
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
    const baseUrl = FRONTEND_URL.replace(/\/$/, "");
    const rentalUrl = `${baseUrl}/rental/${rental.id}`;

    const greetingNameArrendador =
      rental.arrendador?.nombreCompleto || "Arrendador";
    const greetingNameEstudiante =
      rental.estudiante?.nombreCompleto || "Estudiante";

    // correo para arrendador
    if (rental.arrendador?.email) {
      await sendTemplateEmail({
        to: rental.arrendador.email,
        subject: "¡Arriendo confirmado!",
        template: "arriendo-completado",
        attachments: getBrandAttachments().filter(img => img.cid === "arriendu-banner"),
        data: {
          nombre: greetingNameArrendador,
          otroNombre: greetingNameEstudiante,
          rentalUrl: rentalUrl
        },
      });
    }

    // correo para estudiante
    if (rental.estudiante?.email) {
      await sendTemplateEmail({
        to: rental.estudiante.email,
        subject: "¡Arriendo confirmado!",
        template: "arriendo-completado",
        attachments: getBrandAttachments().filter(img => img.cid === "arriendu-banner"),
        data: {
          nombre: greetingNameEstudiante,
          otroNombre: greetingNameArrendador,
          rentalUrl: rentalUrl
        },
      });
    }
  } catch (error) {
    console.error("Error al enviar correo de arriendo completado:", error);
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
