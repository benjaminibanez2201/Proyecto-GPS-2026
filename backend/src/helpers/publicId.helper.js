"use strict";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidPublicId(value) {
  return typeof value === "string" && UUID_REGEX.test(value);
}
