export default {
    async login(ctx) {
        try {
            const { password } = ctx.request.body;

            if (!password) {
                ctx.status = 400;
                ctx.body = { error: "Missing password." };
                return;
            }

            if (password === process.env.SECRET_PASSWORD) {
                ctx.cookies.set("auth", "true", {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                });
                ctx.body = { success: true };
            } else {
                ctx.status = 401;
                ctx.body = { error: "Invalid password." };
            }
        } catch (err) {
            strapi.log.error("Login route error:", err);

            ctx.status = 500;
            ctx.body = {
                error: "Internal server error.",
                details: err.message,
                stack: err.stack,
            };
        }
    },

    async check(ctx) {
        const auth = ctx.cookies.get("auth");
        if (auth === "true") {
            ctx.body = { authorized: true };
        } else {
            ctx.status = 401;
            ctx.body = { error: "Unauthorized." };
        }
    },

    async logout(ctx) {
        ctx.cookies.set("auth", null, { maxAge: 0 });
        ctx.body = { success: true };
    },
};
