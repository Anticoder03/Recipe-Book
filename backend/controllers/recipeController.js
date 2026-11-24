const Recipe = require("../models/Recipe");

// Create recipe
exports.createRecipe = async (req, res, next) => {
    try {
        const { title, description, ingredients, steps, servings, tags } = req.body;

        if (!title || !description || !ingredients || !steps) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        const recipe = await Recipe.create({
            title,
            description,
            ingredients,
            steps,
            servings,
            tags
        });

        res.status(201).json({
            success: true,
            message: "Recipe created successfully",
            recipe
        });

    } catch (error) {
        next(error);
    }
};


// Get all recipes
exports.getRecipes = async (req, res, next) => {
    try {
        const recipes = await Recipe.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: recipes.length,
            recipes
        });

    } catch (error) {
        next(error);
    }
};

// Get recipe by ID
exports.getRecipeById = async (req, res, next) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            recipe
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID"
            });
        }

        next(error);
    }
};

// Update recipe
exports.updateRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID"
            });
        }

        next(error);
    }
};

// Delete recipe
exports.deleteRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Recipe deleted successfully"
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID"
            });
        }

        next(error);
    }
};

