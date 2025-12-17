import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

// Public paths (no auth needed)
const publicPaths = [
    "/api/auth/login",
    "/api/setup",
    "/login",
];

// Role-based route protection
// Format: { pathPrefix: [allowedRoles] }
// Empty array = any authenticated user
const protectedApiRoutes: Record<string, string[]> = {
    // Admin/Manager only
    "POST /api/products": ["ADMIN", "MANAGER"],
    "PATCH /api/products": ["ADMIN", "MANAGER"],
    "DELETE /api/products": ["ADMIN", "MANAGER"],
    "POST /api/tables": ["ADMIN", "MANAGER"],
    "PATCH /api/tables": ["ADMIN", "MANAGER"],
    "DELETE /api/tables": ["ADMIN", "MANAGER"],
    // Any authenticated user
    "GET /api/": [],
    "POST /api/transactions": [],
    "POST /api/tables/": [], // Start/Stop/Transfer
    "GET /api/members/": [], // Allow viewing members and transactions
    "POST /api/members/": [], // Allow creating/updating members
    "PATCH /api/members/": [], // Allow updating members
};

// UI routes that require authentication
const protectedUiPaths = [
    "/dashboard",
    "/pos",
    "/members",
    "/reservations",
    "/reports",
    "/inventory",
    "/settings",
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // 1. Allow public paths
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Get token
    const token = request.cookies.get("token")?.value;

    // 3. Protect UI routes
    if (protectedUiPaths.some((path) => pathname.startsWith(path))) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const payload = await verifyJWT(token);
        if (!payload) {
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    // 4. Protect API routes
    if (pathname.startsWith("/api")) {
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Role check for specific routes
        const userRole = payload.role as string;
        const routeKey = `${method} ${pathname}`;

        // Find matching route pattern
        for (const [pattern, allowedRoles] of Object.entries(protectedApiRoutes)) {
            const [patternMethod, patternPath] = pattern.split(" ");

            if (method === patternMethod && pathname.startsWith(patternPath)) {
                // If allowedRoles is empty, any authenticated user is allowed
                if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
                break;
            }
        }

        // Pass user info to API routes via headers
        const response = NextResponse.next();
        response.headers.set("x-user-id", String(payload.id));
        response.headers.set("x-user-role", String(payload.role));
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*", "/dashboard/:path*", "/pos/:path*", "/members/:path*", "/reservations/:path*", "/reports/:path*", "/inventory/:path*"],
};
