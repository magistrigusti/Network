import { NextResponse } from "next/server";
import { TELEGRAM_SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(TELEGRAM_SESSION_COOKIE);
  return response;
};
