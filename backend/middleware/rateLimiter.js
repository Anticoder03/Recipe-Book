const rateLimit = require("express-rate-limit");

const baseOptions = {
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
};

// Applies to every /api request.
const apiLimiter = rateLimit({
    ...baseOptions,
    windowMs: 15 * 60 * 1000,
    limit: 100
});

// Slower limit for credential endpoints to reduce brute-force attempts.
const authLimiter = rateLimit({
    ...baseOptions,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        success: false,
        message: "Too many login or signup attempts. Please try again later."
    }
});

// Bulk writes are expensive, so they get a stricter separate limit.
const bulkLimiter = rateLimit({
    ...baseOptions,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: {
        success: false,
        message: "Bulk recipe limit reached. Please try again later."
    }
});

module.exports = { apiLimiter, authLimiter, bulkLimiter };
