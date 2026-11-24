const xss = require("xss");
const mongoSanitize = require("express-mongo-sanitize");

// Fields that must be preserved exactly as submitted (e.g. passwords for bcrypt).
const preservedKeys = new Set(["password", "token"]);

function sanitizeValue(value, key) {
    if (preservedKeys.has(key)) {
        return value;
    }

    if (typeof value === "string") {
        return xss(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item, key));
    }

    if (value && typeof value === "object") {
        for (const childKey of Object.keys(value)) {
            value[childKey] = sanitizeValue(value[childKey], childKey);
        }
    }

    return value;
}

// Removes MongoDB operator keys (e.g. $ne, $where) from user input.
// We sanitize body and params directly because Express 5 makes req.query read-only.
const sanitizeMongoOperators = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = mongoSanitize.sanitize(req.body, { replaceWith: "_" });
    }

    if (req.params && typeof req.params === "object") {
        for (const key of Object.keys(req.params)) {
            req.params[key] = mongoSanitize.sanitize(req.params[key], { replaceWith: "_" });
        }
    }

    next();
};

// Removes executable HTML from user-supplied strings before they reach a controller or the database.
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        for (const key of Object.keys(req.body)) {
            req.body[key] = sanitizeValue(req.body[key], key);
        }
    }

    if (req.params && typeof req.params === "object") {
        for (const key of Object.keys(req.params)) {
            req.params[key] = sanitizeValue(req.params[key], key);
        }
    }

    next();
};

module.exports = { sanitizeInput, sanitizeMongoOperators };
