import crypto from "crypto";

// Rate limiting store (in production, use Redis or similar)
const loginAttempts = new Map<
    string,
    { count: number; lastAttempt: number }
>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Session store (in production, use Redis or database)
const sessions = new Map<
    string,
    { userId: string; expiresAt: number; lastActivity: number }
>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

function isRateLimited(ip: string): boolean {
    const attempts = loginAttempts.get(ip);
    if (!attempts) return false;

    const now = Date.now();
    if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
        loginAttempts.delete(ip);
        return false;
    }

    return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip: string, success: boolean): void {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || {
        count: 0,
        lastAttempt: now,
    };

    if (success) {
        loginAttempts.delete(ip);
    } else {
        attempts.count += 1;
        attempts.lastAttempt = now;
        loginAttempts.set(ip, attempts);
    }
}

function validatePassword(password: string): boolean {
    if (!password || typeof password !== "string") return false;
    if (password.length < 8) return false;

    // Check for common weak passwords
    const weakPasswords = [
        "password",
        "123456",
        "admin",
        "test",
        "qwerty",
    ];
    if (weakPasswords.includes(password.toLowerCase())) return false;

    return password === process.env.SECRET_PASSWORD;
}

function createSession(userId: string): string {
    const sessionToken = generateSessionToken();
    const now = Date.now();

    sessions.set(sessionToken, {
        userId,
        expiresAt: now + SESSION_DURATION,
        lastActivity: now,
    });

    return sessionToken;
}

function validateSession(sessionToken: string): boolean {
    const session = sessions.get(sessionToken);
    if (!session) return false;

    const now = Date.now();

    // Check if session expired
    if (now > session.expiresAt) {
        sessions.delete(sessionToken);
        return false;
    }

    // Check for inactivity timeout
    if (now - session.lastActivity > SESSION_INACTIVITY_LIMIT) {
        sessions.delete(sessionToken);
        return false;
    }

    // Update last activity
    session.lastActivity = now;
    sessions.set(sessionToken, session);

    return true;
}

export default {
    async login(ctx) {
        try {
            const { password } = ctx.request.body;
            const clientIP =
                ctx.request.ip ||
                ctx.request.connection.remoteAddress ||
                "unknown";

            // Rate limiting check
            if (isRateLimited(clientIP)) {
                ctx.status = 429;
                ctx.body = {
                    error: "Too many login attempts. Please try again later.",
                    retryAfter: LOCKOUT_DURATION / 1000,
                };
                return;
            }

            if (!password) {
                recordLoginAttempt(clientIP, false);
                ctx.status = 400;
                ctx.body = { error: "Missing password." };
                return;
            }

            if (validatePassword(password)) {
                // Clear any existing sessions for this user
                for (const [token, session] of sessions.entries()) {
                    if (session.userId === "admin") {
                        sessions.delete(token);
                    }
                }

                const sessionToken = createSession("admin");
                const isProduction =
                    process.env.NODE_ENV === "production";

                ctx.cookies.set("auth", sessionToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    maxAge: SESSION_DURATION,
                    path: "/",
                });

                recordLoginAttempt(clientIP, true);
                ctx.body = { success: true };
            } else {
                recordLoginAttempt(clientIP, false);
                ctx.status = 401;
                ctx.body = { error: "Invalid password." };
            }
        } catch (err) {
            ctx.status = 500;
            ctx.body = {
                error: "Internal server error.",
            };
        }
    },

    async check(ctx) {
        try {
            const sessionToken = ctx.cookies.get("auth");

            if (!sessionToken || !validateSession(sessionToken)) {
                // Clear invalid session cookie
                ctx.cookies.set("auth", null, {
                    maxAge: 0,
                    path: "/",
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                });
                ctx.status = 401;
                ctx.body = { error: "Unauthorized." };
                return;
            }

            ctx.body = { authorized: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: "Internal server error." };
        }
    },

    async logout(ctx) {
        try {
            const sessionToken = ctx.cookies.get("auth");
            if (sessionToken) {
                sessions.delete(sessionToken);
            }

            ctx.cookies.set("auth", null, {
                maxAge: 0,
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            });
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: "Internal server error." };
        }
    },

    // Cleanup expired sessions (call this periodically)
    cleanupSessions() {
        const now = Date.now();
        for (const [token, session] of sessions.entries()) {
            if (
                now > session.expiresAt ||
                now - session.lastActivity > SESSION_INACTIVITY_LIMIT
            ) {
                sessions.delete(token);
            }
        }
    },
};
