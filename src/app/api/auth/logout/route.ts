import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/config";

const AUTH_COOKIES = ["accessToken", "refreshToken"] as const;

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // A revogação remota é best-effort. A sessão local ainda deve ser
    // encerrada para o usuário nunca ficar preso no dashboard.
    console.error("Não foi possível revogar a sessão na API:", error);
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  const isProduction = process.env.NODE_ENV === "production";

  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: new Date(0),
      maxAge: 0,
    });
  }

  return response;
}
