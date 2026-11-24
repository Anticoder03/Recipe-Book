const express = require("express");
const router = express.Router();

const {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
} = require("../controllers/recipeController");

// Create recipe
router.post("/", createRecipe);

// Get all recipes
router.get("/", getRecipes);

// Get single recipe
router.get("/:id", getRecipeById);

// Update recipe
router.put("/:id", updateRecipe);

// Delete recipe
router.delete("/:id", deleteRecipe);

module.exports = router;