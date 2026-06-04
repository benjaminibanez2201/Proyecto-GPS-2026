"use strict";
import nodemailer from "nodemailer";
import {
  EMAIL_FROM,
  EMAIL_PASS,
  EMAIL_USER,
  FRONTEND_URL,
} from "../config/configEnv.js";
import { renderEmailTemplate } from "../helpers/emailTemplate.helper.js";

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

function normalizeBaseUrl(url) {
  return url.replace(/\/$/, "");
}

async function sendTemplateEmail({ data, subject, template, to }) {
  const { html, text } = await renderEmailTemplate(template, data);

  return createTransporter().sendMail({
    from: EMAIL_FROM,
    html,
    subject,
    text,
    to,
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

export async function sendRecoveryEmail(email, resetToken) {
  const resetUrl = `${normalizeBaseUrl(FRONTEND_URL)}/reset-password/${encodeURIComponent(resetToken)}`;

  return sendTemplateEmail({
    to: email,
    subject: "Restablecer contrasena",
    template: "password-recovery",
    data: {
      resetUrl,
    },
  });
}
