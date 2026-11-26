const Recipe = require("../models/Recipe");

// Only these fields may be written from an HTTP request. This prevents mass-assignment attacks.
const writableFields = ["title", "description", "ingredients", "steps", "image", "servings", "tags"];

const pickFields = (source, fields) =>
    fields.reduce((result, field) => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            result[field] = source[field];
        }
        return result;
    }, {});

const sendMongooseValidationError = (res, error) =>
    res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors || {}).map((item) => item.message)
    });

// A recipe without a createdBy (legacy data) belongs to nobody.
const isRecipeOwner = (recipe, userId) =>
    Boolean(recipe && recipe.createdBy && String(recipe.createdBy) === String(userId));

// Create a single recipe (authenticated).
exports.createRecipe = async (req, res, next) => {
    try {
        const recipeData = {
            ...pickFields(req.body, writableFields),
            createdBy: req.user._id
        };

        const recipe = await Recipe.create(recipeData);

        res.status(201).json({
            success: true,
            message: "Recipe created successfully",
            recipe
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return sendMongooseValidationError(res, error);
        }

        next(error);
    }
};

// Create many recipes in one request (authenticated).
exports.createRecipesBulk = async (req, res, next) => {
    try {
        const recipes = req.body.recipes.map((item) => ({
            ...pickFields(item, writableFields),
            createdBy: req.user._id
        }));

        const created = await Recipe.insertMany(recipes, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${created.length} recipes created successfully`,
            count: created.length,
            recipes: created
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return sendMongooseValidationError(res, error);
        }

        next(error);
    }
};

// Get all recipes (public), newest first.
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

// Get a single recipe by ID (public).
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

// Update a recipe (authenticated, creator only). Only whitelisted fields can change.
exports.updateRecipe = async (req, res, next) => {
    try {
        const updates = pickFields(req.body, writableFields);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one recipe field is required for an update"
            });
        }

        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        if (!isRecipeOwner(recipe, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You can only edit recipes you created"
            });
        }

        Object.assign(recipe, updates);
        await recipe.save();

        res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return sendMongooseValidationError(res, error);
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID"
            });
        }

        next(error);
    }
};

// Delete a recipe (authenticated, creator only).
exports.deleteRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        if (!isRecipeOwner(recipe, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You can only delete recipes you created"
            });
        }

        await recipe.deleteOne();

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
