import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor || request.headers.get("x-real-ip") || "local";
  if (request.nextUrl.pathname.startsWith("/api/") || request.method !== "GET") {
    console.info(`[request] ${request.method} ${request.nextUrl.pathname} ip=${clientIp}`);
  }

  const password = process.env.DEMO_ACCESS_PASSWORD;
  if (!password) return NextResponse.next();
  const expectedUser = process.env.DEMO_ACCESS_USER || "sales";
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    const [user, suppliedPassword] = atob(authorization.slice(6)).split(":");
    if (user === expectedUser && suppliedPassword === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="外贸获客系统"' } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
