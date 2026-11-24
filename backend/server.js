const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const recipeRoutes = require("./routes/recipeRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads directory
app.use("/uploads", express.static("uploads"));

// Database connection
connectDB();

// Routes
app.use("/api/recipes", recipeRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Recipe Book API is running"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

