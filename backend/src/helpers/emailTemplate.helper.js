"use strict";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, "../templates/emails");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(template, data) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => escapeHtml(data[key]));
}

async function readTemplate(templateName, extension) {
  const templatePath = path.join(templatesDir, `${templateName}.${extension}`);
  return fs.readFile(templatePath, "utf8");
}

export async function renderEmailTemplate(templateName, data = {}) {
  const [htmlTemplate, textTemplate] = await Promise.all([
    readTemplate(templateName, "html"),
    readTemplate(templateName, "txt"),
  ]);

  return {
    html: render(htmlTemplate, data),
    text: render(textTemplate, data),
  };
}
