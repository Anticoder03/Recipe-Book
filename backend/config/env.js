const path = require("path");
const dotenv = require("dotenv");

// Load .env from the backend folder even when the app is started from the repo root.
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const requiredVars = ["MONGO_URI", "JWT_SECRET"];
const missingVars = requiredVars.filter((name) => !process.env[name]);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values."
    );
}

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

module.exports = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    clientOrigins,
    trustProxy: process.env.TRUST_PROXY === "1",
    isProd: (process.env.NODE_ENV || "development") === "production"
};
