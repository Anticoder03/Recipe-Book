const express = require("express");

const {
    createRecipe,
    createRecipesBulk,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
} = require("../controllers/recipeController");
const { protect } = require("../middleware/auth");
const { bulkLimiter } = require("../middleware/rateLimiter");
const {
    createRecipeValidation,
    updateRecipeValidation,
    bulkRecipeValidation,
    idValidation,
    validate
} = require("../middleware/validate");

const router = express.Router();

// /bulk must be registered before /:id so "bulk" is not treated as an ObjectId.
router.post("/bulk", protect, bulkLimiter, ...bulkRecipeValidation, validate, createRecipesBulk);

router.post("/", protect, ...createRecipeValidation, validate, createRecipe);

router.get("/", getRecipes);

router.get("/:id", ...idValidation, validate, getRecipeById);

router.put("/:id", protect, ...idValidation, ...updateRecipeValidation, validate, updateRecipe);

router.delete("/:id", protect, ...idValidation, validate, deleteRecipe);

module.exports = router;
