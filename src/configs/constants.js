import path from "path";
import { fileURLToPath } from "url";
import { getEnv } from "./config.js";
import OpenAI from "openai";

export const __dirName = fileURLToPath(import.meta.url);
export const __fileName = path.dirname(__dirName);
export const __root = path.join(__fileName, "../..");

const isDev = getEnv("NODE_ENV") == "development";

export const accessTokenOptions = {
  httpOnly: true,
  sameSite: isDev ? "lax" : "none",
  secure: !isDev, // only secure if not dev
  maxAge: parseInt(getEnv("ACCESS_TOKEN_MAX_AGE")),
};

export const refreshTokenOptions = {
  httpOnly: true,
  sameSite: isDev ? "lax" : "none",
  secure: !isDev,
  maxAge: Number(getEnv("REFRESH_TOKEN_MAX_AGE")),
};

export const openai = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
