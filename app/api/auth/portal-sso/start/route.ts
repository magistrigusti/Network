import { NextRequest, NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/auth/session";
import {
  isAllowedPortalSsoReturnUrl,
  redirectWithPortalSsoTicket,
} from "@/lib/auth/portal-sso";

export const dynamic = "force-dynamic";

const RETURN_TO_COOKIE = "portal_sso_return_to";

export const GET = async (request: NextRequest) => {
  const returnTo = request.nextUrl.searchParams.get("return_to") ?? "";
  if (!isAllowedPortalSsoReturnUrl(returnTo)) {
    return NextResponse.json({ error: "Invalid return_to" }, { status: 400 });
  }

  const user = await getCurrentPortalUser();
  if (user) {
    return redirectWithPortalSsoTicket({ request, returnTo, user });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect_url", "/api/auth/portal-sso/complete");

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
};
