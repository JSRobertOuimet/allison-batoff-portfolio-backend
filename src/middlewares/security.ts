import { Context, Next } from "koa";

// Security headers middleware
export const securityHeaders = async (ctx: Context, next: Next) => {
    // Remove X-Powered-By header
    ctx.remove("X-Powered-By");

    // Security headers
    ctx.set("X-Content-Type-Options", "nosniff");
    ctx.set("X-Frame-Options", "DENY");
    ctx.set("X-XSS-Protection", "1; mode=block");
    ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");
    ctx.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );

    // HSTS header for HTTPS
    if (ctx.secure || ctx.get("X-Forwarded-Proto") === "https") {
        ctx.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );
    }

    await next();
};

// Rate limiting middleware
const rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

export const rateLimit = async (ctx: Context, next: Next) => {
    const clientIP =
        ctx.request.ip ||
        ctx.req.connection?.remoteAddress ||
        "unknown";
    const now = Date.now();

    const key = `rate_limit_${clientIP}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
        // Reset or create new entry
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
    } else {
        // Increment counter
        current.count++;
        rateLimitStore.set(key, current);

        if (current.count > RATE_LIMIT_MAX_REQUESTS) {
            ctx.status = 429;
            ctx.body = {
                error: "Too many requests",
                retryAfter: Math.ceil((current.resetTime - now) / 1000),
            };
            return;
        }
    }

    await next();
};

// Input validation middleware
export const inputValidation = async (ctx: Context, next: Next) => {
    // Sanitize request body
    if (ctx.request.body) {
        ctx.request.body = sanitizeObject(ctx.request.body);
    }

    // Sanitize query parameters
    if (ctx.query) {
        ctx.query = sanitizeObject(ctx.query);
    }

    await next();
};

function sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
    }

    return sanitized;
}

function sanitizeString(value: any): any {
    if (typeof value !== "string") {
        return value;
    }

    // Remove potentially dangerous characters
    return value
        .replace(/[<>]/g, "") // Remove < and >
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, "") // Remove event handlers
        .trim();
}

// Cleanup expired rate limit entries
setInterval(
    () => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    },
    5 * 60 * 1000
); // Cleanup every 5 minutes
