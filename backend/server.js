const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");

const config = require("./config/env");
const connectDB = require("./config/db");
const recipeRoutes = require("./routes/recipeRoutes");
const authRoutes = require("./routes/authRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");
const { sanitizeInput, sanitizeMongoOperators } = require("./middleware/security");

const app = express();

// Basic hardening.
app.disable("x-powered-by");
if (config.trustProxy) {
    app.set("trust proxy", 1);
}
app.use(helmet());

// Only known browser origins may call the API.
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || config.clientOrigins.includes(origin)) {
            return callback(null, true);
        }

        const error = new Error("Origin not allowed by CORS");
        error.status = 403;
        return callback(error);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Request hardening.
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeMongoOperators);
app.use(hpp({ whitelist: ["ingredients", "steps", "tags", "recipes"] }));
app.use(sanitizeInput);

// Rate limiting before all API routes.
app.use("/api", apiLimiter);

// Routes.
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);

// Health check.
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Recipe Book API is running"
    });
});

// Unknown routes.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Centralized error handler. Stack traces are never sent to clients.
app.use((err, req, res, next) => {
    console.error(err);

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large"
        });
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON body"
        });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(err.errors || {}).map((item) => item.message)
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID"
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "A record with these details already exists"
        });
    }

    const status = err.status || err.statusCode || 500;
    const message =
        status >= 500 && config.isProd
            ? "Internal server error"
            : err.message || "Internal server error";

    res.status(status).json({
        success: false,
        message
    });
});

if (require.main === module) {
    connectDB();
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
}

module.exports = app;
