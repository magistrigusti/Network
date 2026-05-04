import { NextRequest, NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/auth/session";
import {
  isAllowedPortalSsoReturnUrl,
  redirectWithPortalSsoTicket,
} from "@/lib/auth/portal-sso";

export const dynamic = "force-dynamic";

const RETURN_TO_COOKIE = "portal_sso_return_to";

export const GET = async (request: NextRequest) => {
  const returnTo = request.cookies.get(RETURN_TO_COOKIE)?.value ?? "";
  if (!isAllowedPortalSsoReturnUrl(returnTo)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const user = await getCurrentPortalUser();
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_url", "/api/auth/portal-sso/complete");
    return NextResponse.redirect(loginUrl);
  }

  const response = redirectWithPortalSsoTicket({ request, returnTo, user });
  response.cookies.delete(RETURN_TO_COOKIE);

  return response;
};
