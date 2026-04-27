import crypto from "crypto";

export type TelegramLoginPayload = {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24;

export const verifyTelegramLogin = (payload: TelegramLoginPayload) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  const { hash, ...authData } = payload;
  const dataCheckString = Object.entries(authData)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const isValidHash = crypto.timingSafeEqual(
    Buffer.from(calculatedHash),
    Buffer.from(hash)
  );

  if (!isValidHash) throw new Error("Invalid Telegram login signature");

  const authDate = Number(payload.auth_date);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new Error("Telegram login data is outdated");
  }

  return payload;
};
