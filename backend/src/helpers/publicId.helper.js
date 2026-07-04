"use strict";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSecretKey() {
  const secretHex = process.env.PUBLIC_ID_SECRET;

  if (secretHex) {
    const key = Buffer.from(secretHex, "hex");
    if (key.length === 32) return key;
  }

  return crypto.createHash("sha256").update("arriendu-dev-fallback-secret").digest();
}

const SECRET_KEY = getSecretKey();

export function encodePublicId(id) {
  const value = Number(id);
  if (!Number.isInteger(value) || value < 0) return "";

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decodePublicId(token) {
  if (typeof token !== "string" || !token) return null;

  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) return null;

    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    const value = Number(decrypted.toString("utf8"));
    return Number.isInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}
