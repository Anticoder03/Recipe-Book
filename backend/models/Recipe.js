const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Recipe title is required"],
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: 1000
        },

        ingredients: {
            type: [{
                type: String,
                trim: true
            }],
            required: true,
            validate: {
                validator: function (value) {
                    return value.length > 0 &&
                        value.every(item => item.trim().length > 0);
                },
                message: "At least one valid ingredient is required"
            }
        },

        steps: {
            type: [{
                type: String,
                trim: true
            }],
            required: true,
            validate: {
                validator: function (value) {
                    return value.length > 0 &&
                        value.every(item => item.trim().length > 0);
                },
                message: "At least one valid cooking step is required"
            }
        },

        image: {
            type: String,
            default: null
        },

        servings: {
            type: Number,
            default: 2,
            min: 1
        },

        tags: {
            type: [String],
            default: []
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Recipe", recipeSchema);