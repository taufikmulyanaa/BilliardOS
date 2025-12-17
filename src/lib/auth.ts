import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "your-secret-key-change-me";
const ENCODED_KEY = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function signJWT(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(ENCODED_KEY);
}

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, ENCODED_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession(request: Request) {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const token = cookieHeader
        .split(";")
        .find((c) => c.trim().startsWith("token="))
        ?.split("=")[1];

    if (!token) return null;
    return await verifyJWT(token);
}
