import crypto from "crypto";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import User from "@/lib/models/user.model";
import { connectToDB } from "@/lib/mongoose";

export const TELEGRAM_SESSION_COOKIE = "portal_telegram_session";

export type PortalAuthUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddress: string;
  authProvider: "clerk" | "telegram";
};

type TelegramSessionPayload = {
  userId: string;
  exp: number;
};

const getSessionSecret = () => {
  const secret =
    process.env.TELEGRAM_SESSION_SECRET ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.CLERK_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing TELEGRAM_SESSION_SECRET");
  }

  return secret;
};

const base64UrlEncode = (value: string) =>
  Buffer.from(value).toString("base64url");

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string) =>
  crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

export const createTelegramSessionValue = (userId: string) => {
  const payload: TelegramSessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const verifyTelegramSessionValue = (
  value?: string
): TelegramSessionPayload | null => {
  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (signature.length !== expectedSignature.length) return null;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) return null;

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TelegramSessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
};

export const getCurrentPortalUser = async (): Promise<PortalAuthUser | null> => {
  const clerkUser = await currentUser();

  if (clerkUser) {
    return {
      id: clerkUser.id,
      username: clerkUser.username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      emailAddress: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      authProvider: "clerk",
    };
  }

  const session = verifyTelegramSessionValue(
    cookies().get(TELEGRAM_SESSION_COOKIE)?.value
  );
  if (!session) return null;

  await connectToDB();
  const dbUser = await User.findOne({ id: session.userId });
  if (!dbUser) return null;

  const [firstName = dbUser.name, ...lastNameParts] = dbUser.name.split(" ");

  return {
    id: dbUser.id,
    username: dbUser.username,
    firstName,
    lastName: lastNameParts.join(" ") || null,
    imageUrl: dbUser.image || "/images/logo.png",
    emailAddress: dbUser.email,
    authProvider: "telegram",
  };
};
