const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

const SALT_ROUNDS = 12;

const publicUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email
});

exports.signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token: generateToken(user._id),
            user: publicUser(user)
        });
    } catch (error) {
        // Handles a race between the email check and the unique index.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Generic failure message avoids revealing whether an email is registered.
        const invalidCredentials = {
            success: false,
            message: "Invalid email or password"
        };

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json(invalidCredentials);
        }

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: generateToken(user._id),
            user: publicUser(user)
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: publicUser(req.user)
    });
};
