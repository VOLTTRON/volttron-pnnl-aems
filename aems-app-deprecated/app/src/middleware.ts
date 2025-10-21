import { NextResponse, NextRequest } from "next/server";

/**
 * External service configuration.
 */
interface Rewrite {
  name?: string;
  path?: string;
  authenticate?: boolean;
  roles?: RegExp;
  authorized?: string;
  unauthorized?: string;
}

const isRequired = (v: Rewrite): v is Required<Rewrite> =>
  v.name && v.path && v.authenticate !== undefined && v.roles && v.authorized && v.unauthorized ? true : false;

const options = Object.entries(
  Object.entries(process.env)
    .filter(
      ([key]) =>
        key.startsWith("EXT_") && ["_PATH", "_ROLES", "_AUTHORIZED", "_UNAUTHORIZED"].find((k) => key.endsWith(k))
    )
    .reduce((acc, [key, value]) => {
      const [, name, option] =
        /ext_([a-z0-9_-]+)_(path|roles|authorized|unauthorized)/i.exec(key)?.map((v) => v?.toLowerCase()) ?? [];
      const temp = acc[name] ?? {};
      switch (option) {
        case "path":
          if (!value?.startsWith("/ext")) {
            throw new Error(`External service configuration '${key}' path must start with "/ext"`);
          }
          temp.path = value;
          break;
        case "roles":
          const any = value?.toLowerCase() === "any";
          temp.authenticate = !any;
          temp.roles = new RegExp(
            value
              ?.split(",")
              .map((r) => r.trim())
              .join("|") ?? "",
            "i"
          );
          break;
        case "authorized":
          temp.authorized = value ?? "";
          break;
        case "unauthorized":
          temp.unauthorized = value ?? "";
          break;
        default:
          return acc;
      }
      acc[name] = temp;
      return acc;
    }, {} as Record<string, Rewrite>)
)
  .map(([key, value]) => ({ ...value, name: key }))
  .filter(isRequired)
  .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));

/**
 * Middleware to authenticate users and rewrite to external pages.
 * Middleware must be lean and can't use most libraries so some duplication is necessary.
 */
export async function middleware(req: NextRequest) {
  const option = options.find((v) => req.nextUrl.pathname?.startsWith(v.path));
  if (!option) {
    return NextResponse.next();
  }
  if (option.authenticate) {
    const authUrl = `http://localhost:3000/api/auth/validate`;
    const authHeaders = new Headers(req.headers);
    authHeaders.delete("Content-Length");
    authHeaders.delete("content-length");
    authHeaders.delete("Content-Type");
    authHeaders.delete("content-type");
    const auth = await fetch(authUrl, {
      method: "GET",
      headers: authHeaders,
    }).then((res) => res.json());
    if (!new RegExp(option.roles, "i").test(auth.role)) {
      // can't import HttpStatus because of webpack on edge
      return NextResponse.redirect(option.unauthorized, { status: 302, statusText: "Found" });
    }
  }
  const rewriteUrl = `${option.authorized}${
    req.nextUrl.pathname?.replace(new RegExp(`^${option.path}`, "i"), "") ?? ""
  }${req.nextUrl.search ?? ""}`;
  return NextResponse.rewrite(rewriteUrl, { request: req, headers: req.headers });
}

export const config = {
  // Nextjs doesn't support dynamic matcher in middleware.
  matcher: "/ext/:path*",
};
