export default [
    "strapi::logger",
    "strapi::errors",
    {
        name: "strapi::security",
        config: {
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    "connect-src": ["'self'", "https:"],
                    "img-src": [
                        "'self'",
                        "data:",
                        "blob:",
                        "market-assets.strapi.io",
                        "res.cloudinary.com",
                    ],
                    "media-src": [
                        "'self'",
                        "data:",
                        "blob:",
                        "market-assets.strapi.io",
                        "res.cloudinary.com",
                    ],
                    "script-src": ["'self'", "'unsafe-inline'"],
                    "style-src": ["'self'", "'unsafe-inline'"],
                    "object-src": ["'none'"],
                    "base-uri": ["'self'"],
                    "form-action": ["'self'"],
                    "frame-ancestors": ["'none'"],
                    upgradeInsecureRequests: null,
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
            },
            xss: true,
            noSniff: true,
            frameOptions: "DENY",
        },
    },
    {
        name: "strapi::cors",
        config: {
            enabled: true,
            headers: "*",
            origin:
                process.env.NODE_ENV === "production"
                    ? [
                          process.env.FRONTEND_URL ||
                              "http://localhost:3000",
                      ]
                    : [
                          "http://localhost:3000",
                          "http://localhost:5173",
                      ],
            methods: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "HEAD",
                "OPTIONS",
            ],
            keepHeaderOnError: true,
        },
    },
    "strapi::poweredBy",
    "strapi::query",
    "strapi::body",
    "strapi::session",
    "strapi::favicon",
    "strapi::public",
];
