const { body, param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((error) => ({
            field: error.path || error.param || error.location,
            message: error.msg
        }))
    });
};

const signupValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 50 })
        .withMessage("Name cannot be longer than 50 characters"),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .isString()
        .withMessage("Password must be a string")
        .isLength({ min: 8, max: 100 })
        .withMessage("Password must be between 8 and 100 characters")
        .matches(/[A-Za-z]/)
        .withMessage("Password must contain at least one letter")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

const createRecipeValidation = [
    body("title")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Title must be between 1 and 100 characters"),
    body("description")
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Description must be between 1 and 1000 characters"),
    body("ingredients")
        .isArray({ min: 1 })
        .withMessage("At least one ingredient is required"),
    body("ingredients.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Ingredients cannot be empty"),
    body("steps")
        .isArray({ min: 1 })
        .withMessage("At least one cooking step is required"),
    body("steps.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Cooking steps cannot be empty"),
    body("image")
        .optional({ nullable: true })
        .isString()
        .withMessage("Image must be a string"),
    body("servings")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Servings must be an integer of at least 1")
        .toInt(),
    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),
    body("tags.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Tags cannot be empty")
];

const updateRecipeValidation = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Title must be between 1 and 100 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Description must be between 1 and 1000 characters"),
    body("ingredients")
        .optional()
        .isArray({ min: 1 })
        .withMessage("At least one ingredient is required"),
    body("ingredients.*")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Ingredients cannot be empty"),
    body("steps")
        .optional()
        .isArray({ min: 1 })
        .withMessage("At least one cooking step is required"),
    body("steps.*")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Cooking steps cannot be empty"),
    body("image")
        .optional({ nullable: true })
        .isString()
        .withMessage("Image must be a string"),
    body("servings")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Servings must be an integer of at least 1")
        .toInt(),
    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),
    body("tags.*")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Tags cannot be empty"),
    body().custom((value) => {
        const allowed = ["title", "description", "ingredients", "steps", "image", "servings", "tags"];
        return allowed.some((field) => Object.prototype.hasOwnProperty.call(value, field));
    }).withMessage("At least one recipe field is required for an update")
];

const bulkRecipeValidation = [
    body("recipes")
        .isArray({ min: 1, max: 100 })
        .withMessage("recipes must be an array containing between 1 and 100 recipes"),
    body("recipes.*.title")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Each recipe title must be between 1 and 100 characters"),
    body("recipes.*.description")
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Each recipe description must be between 1 and 1000 characters"),
    body("recipes.*.ingredients")
        .isArray({ min: 1 })
        .withMessage("Each recipe needs at least one ingredient"),
    body("recipes.*.ingredients.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Ingredients cannot be empty"),
    body("recipes.*.steps")
        .isArray({ min: 1 })
        .withMessage("Each recipe needs at least one cooking step"),
    body("recipes.*.steps.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Cooking steps cannot be empty"),
    body("recipes.*.image")
        .optional({ nullable: true })
        .isString()
        .withMessage("Image must be a string"),
    body("recipes.*.servings")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Servings must be an integer of at least 1")
        .toInt(),
    body("recipes.*.tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),
    body("recipes.*.tags.*")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Tags cannot be empty")
];

const idValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid recipe ID")
];

module.exports = {
    validate,
    signupValidation,
    loginValidation,
    createRecipeValidation,
    updateRecipeValidation,
    bulkRecipeValidation,
    idValidation
};
