const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");

const generateToken = (userId) =>
    jwt.sign({ id: userId.toString() }, config.jwtSecret, {
        algorithm: "HS256",
        expiresIn: config.jwtExpiresIn
    });

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Please log in to access this route"
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            algorithms: ["HS256"]
        });

        if (!decoded || !decoded.id) {
            throw new Error("Invalid token payload");
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "The account for this token no longer exists"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route"
        });
    }
};

module.exports = { protect, generateToken };
