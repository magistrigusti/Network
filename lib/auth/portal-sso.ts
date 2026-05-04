import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PortalAuthUser } from "./session";

const SSO_TICKET_TTL_SECONDS = 60;

type PortalSsoTicket = {
  userId: string;
  username: string | null;
  name: string;
  imageUrl: string;
  emailAddress: string;
  authProvider: "clerk" | "telegram";
  exp: number;
};

const getPortalSsoSecret = () => {
  const secret =
    process.env.PORTAL_SSO_SECRET ||
    process.env.TELEGRAM_SESSION_SECRET ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.CLERK_SECRET_KEY;

  if (!secret) throw new Error("Missing PORTAL_SSO_SECRET");

  return secret;
};

const base64UrlEncode = (value: string) =>
  Buffer.from(value).toString("base64url");

const sign = (payload: string) =>
  crypto.createHmac("sha256", getPortalSsoSecret()).update(payload).digest("base64url");

const getAllowedOrigins = () => {
  const raw =
    process.env.PORTAL_SSO_ALLOWED_ORIGINS ||
    "https://land-of-smiles.vercel.app,http://localhost:3000,http://localhost:3001";

  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
};

export const isAllowedPortalSsoReturnUrl = (value: string) => {
  try {
    const url = new URL(value);
    return getAllowedOrigins().includes(url.origin);
  } catch {
    return false;
  }
};

export const createPortalSsoTicket = (user: PortalAuthUser) => {
  const payload: PortalSsoTicket = {
    userId: user.id,
    username: user.username,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Portal user",
    imageUrl: user.imageUrl,
    emailAddress: user.emailAddress,
    authProvider: user.authProvider,
    exp: Math.floor(Date.now() / 1000) + SSO_TICKET_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const redirectWithPortalSsoTicket = ({
  request,
  returnTo,
  user,
}: {
  request: NextRequest;
  returnTo: string;
  user: PortalAuthUser;
}) => {
  const url = new URL(returnTo);
  url.searchParams.set("ticket", createPortalSsoTicket(user));

  return NextResponse.redirect(url);
};
