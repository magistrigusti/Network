import { NextRequest, NextResponse } from "next/server";
import {
  createTelegramSessionValue,
  TELEGRAM_SESSION_COOKIE,
} from "@/lib/auth/session";
import { verifyTelegramLogin, TelegramLoginPayload } from "@/lib/auth/telegram";
import { syncUserFromTelegram } from "@/lib/actions/user.actions";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const payload: TelegramLoginPayload = {
      id: searchParams.get("id") ?? "",
      first_name: searchParams.get("first_name") ?? "",
      last_name: searchParams.get("last_name") ?? undefined,
      username: searchParams.get("username") ?? undefined,
      photo_url: searchParams.get("photo_url") ?? undefined,
      auth_date: searchParams.get("auth_date") ?? "",
      hash: searchParams.get("hash") ?? "",
    };

    const telegramUser = verifyTelegramLogin(payload);
    const user = await syncUserFromTelegram({
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      photoUrl: telegramUser.photo_url,
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
    console.error("Telegram auth failed:", error);
    return NextResponse.redirect(new URL("/login?telegram=failed", request.url));
  }
};
