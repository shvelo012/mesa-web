import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "mesa.ge";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const hostname = host.split(":")[0];

  const subdomain = hostname.endsWith(`.${ROOT_DOMAIN}`)
    ? hostname.slice(0, -(ROOT_DOMAIN.length + 1))
    : null;

  if (subdomain && subdomain !== "www") {
    const url = req.nextUrl.clone();
    url.pathname = `/restaurants/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
