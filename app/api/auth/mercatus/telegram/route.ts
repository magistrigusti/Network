import { NextRequest, NextResponse } from "next/server";
import {
  createTelegramSessionValue,
  TELEGRAM_SESSION_COOKIE,
} from "@/lib/auth/session";
import { verifyMercatusSsoTicket } from "@/lib/auth/mercatus-sso";
import { syncUserFromTelegram } from "@/lib/actions/user.actions";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const ticket = request.nextUrl.searchParams.get("ticket") ?? "";
    const payload = verifyMercatusSsoTicket(ticket);
    const user = await syncUserFromTelegram({
      telegramId: String(payload.user.id),
      firstName: payload.user.firstName || payload.user.username || "Mercatus",
      lastName: payload.user.lastName,
      username: payload.user.username,
      photoUrl: payload.user.photoUrl,
      wallets: payload.wallets,
    });

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(TELEGRAM_SESSION_COOKIE, createTelegramSessionValue(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Mercatus Telegram SSO failed:", error);
    return NextResponse.redirect(new URL("/login?mercatus=failed", request.url));
  }
};
