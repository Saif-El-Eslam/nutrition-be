import mongoose from "mongoose";
import {
  generateSlug,
  validateIngredients,
  validateInstructions,
  validateNutritionInfo,
  validateTags,
} from "#modules/recipes/recipes.helpers.js";
import {
  RECIPE_UNITS,
  RECIPE_DIFFICULTIES,
} from "#modules/recipes/recipes.constants.js";
import { translate, ERROR_CODES } from "#utils/localization.js";

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "ar"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async function (value) {
          // Verify author exists
          const author = await mongoose.models.User.findById(value);
          return !!author;
        },
        message: "Author must be a valid user",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
      validate: {
        validator: async function (value) {
          // Verify category exists and is for recipes
          const category = await mongoose.models.Category.findById(value);

          if (!category) {
            const error = new Error(["CATEGORY_NOT_FOUND"]);
            error.code = ERROR_CODES.CATEGORY_NOT_FOUND;
            error.status = 400;
            throw error;
          }
          if (category.type !== "recipe") {
            const error = new Error(["CATEGORY_INVALID_TYPE_RECIPE"]);
            error.code = ERROR_CODES.CATEGORY_INVALID_TYPE_RECIPE;
            error.status = 400;
            throw error;
          }
          if (!category.isActive) {
            const error = new Error(["CATEGORY_INACTIVE"]);
            error.code = ERROR_CODES.CATEGORY_INACTIVE;
            error.status = 400;
            throw error;
          }
          return true;
        },
        message: "Category must be a valid active recipe category",
      },
    },
    ingredients: [
      {
        _id: false,
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: String,
          required: true,
        },
        unit: {
          type: String,
          enum: RECIPE_UNITS,
          default: "",
        },
      },
    ],
    instructions: [
      {
        _id: false,
        step: Number,
        description: String,
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    prepTime: {
      type: Number, // in minutes
      min: 0,
    },
    cookTime: {
      type: Number, // in minutes
      min: 0,
    },
    servings: {
      type: Number,
      min: 1,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: RECIPE_DIFFICULTIES,
      default: "medium",
    },
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for recipes sorted by date
recipeSchema.index({ isHidden: 1, createdAt: -1 });

// Compound index for efficient category queries
recipeSchema.index({ category: 1, isHidden: 1 });

// Create slug from title before saving
recipeSchema.pre("save", async function () {
  try {
    if (this.isModified("title") || this.isNew) {
      this.slug = await generateSlug(this.title, this._id);
    }

    // Validate ingredients
    if (this.isModified("ingredients") || this.isNew) {
      validateIngredients(this.ingredients);
    }

    // Validate instructions
    if (
      (this.isModified("instructions") || this.isNew) &&
      this.instructions &&
      this.instructions.length > 0
    ) {
      validateInstructions(this.instructions);
    }

    // Validate tags
    if (
      (this.isModified("tags") || this.isNew) &&
      this.tags &&
      this.tags.length > 0
    ) {
      validateTags(this.tags);
    }

    // Mongoose initializes nested paths as an empty object even when they were
    // not provided. Use the serialized value so optional nutrition info is not
    // validated as five undefined fields.
    const nutritionInfo = this.toObject().nutritionInfo;

    // Validate nutrition info
    if (
      (this.isModified("nutritionInfo") || this.isNew) &&
      nutritionInfo
    ) {
      validateNutritionInfo(nutritionInfo);
    }
  } catch (error) {
    throw error;
  }
});

// Handle updates via findByIdAndUpdate and updateOne
recipeSchema.pre(["findOneAndUpdate", "updateOne"], async function () {
  try {
    const update = this.getUpdate();

    // If title is being updated, regenerate slug
    if (update.title) {
      update.slug = await generateSlug(update.title, this.getQuery()._id);
    }

    // Validate ingredients if being updated
    if (update.ingredients && update.ingredients.length > 0) {
      validateIngredients(update.ingredients);
    }

    // Validate instructions if being updated
    if (update.instructions && update.instructions.length > 0) {
      validateInstructions(update.instructions);
    }

    // Validate tags if being updated
    if (update.tags && update.tags.length > 0) {
      validateTags(update.tags);
    }

    // Validate nutrition info if being updated
    if (update.nutritionInfo) {
      validateNutritionInfo(update.nutritionInfo);
    }
  } catch (error) {
    throw error;
  }
});

recipeSchema.methods.toJSON = function () {
  const recipe = this.toObject();

  // Remove sensitive fields
  delete recipe.__v;
  delete recipe.isHidden;

  // Rename fields
  recipe.id = recipe._id;
  delete recipe._id;

  // Transform author object
  if (recipe.author && typeof recipe.author === "object") {
    recipe.author = {
      id: recipe.author._id,
      firstName: recipe.author.firstName,
      lastName: recipe.author.lastName,
      email: recipe.author.email,
      phone: recipe.author.phone,
    };
  }

  // Transform category object
  if (recipe.category && typeof recipe.category === "object") {
    recipe.category = {
      id: recipe.category._id,
      name: recipe.category.name,
      displayName: recipe.category.displayName,
      arDisplayName: recipe.category.arDisplayName,
    };
  }

  return recipe;
};

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;
