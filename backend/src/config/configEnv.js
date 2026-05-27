"use strict";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const _filename = fileURLToPath(import.meta.url);

const _dirname = path.dirname(_filename);

const envFilePath = path.resolve(_dirname, "../../.env");

dotenv.config({ path: envFilePath });

export const PORT = process.env.PORT;
export const HOST = process.env.HOST;
export const DB_USERNAME = process.env.DB_USERNAME;
export const PASSWORD = process.env.PASSWORD;
export const DATABASE = process.env.DATABASE;
export const DB_PORT = Number(process.env.DB_PORT || 5432);
<<<<<<< Updated upstream
export const ACCESS_TOKEN_SECRET =
	process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
export const cookieKey = process.env.cookieKey || process.env.COOKIE_KEY;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
=======
export const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
export const cookieKey = process.env.COOKIE_KEY;
>>>>>>> Stashed changes
