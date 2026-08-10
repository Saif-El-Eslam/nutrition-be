import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: function () {
        // Enforce an authentication method when a user is first created.
        // Existing documents may have sensitive fields excluded by a query.
        return this.isNew && !this.googleSubject;
      },
      select: false, // Security: Hide by default - explicitly select if needed
    },
    // Google's immutable account identifier. Email must never be used as the
    // provider identity because a Google Account email can change.
    googleSubject: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
      trim: true,
      maxlength: 255,
    },
    role: {
      type: String,
      enum: ["customer", "specialist", "admin"],
      default: "customer",
    },
    refreshToken: {
      type: String,
      select: false, // Security: Hide by default - explicitly select if needed
    },
    // Incremented after password changes and logout. Tokens carry the version
    // they were issued for, allowing old access tokens to be rejected.
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },

    profile: {
      type: {
        gender: {
          type: String,
          enum: ["male", "female"],
        },
        age: {
          type: Number,
          min: 1,
        },
        maritalStatus: {
          type: String,
          enum: ["single", "married", "other"],
        },
        currentWeight: {
          type: Number,
          min: 1,
        },
        height: {
          type: Number,
          min: 30,
        },
        location: {
          type: String,
          trim: true,
        },
        activityLevel: {
          type: String,
          enum: ["low", "moderate", "high", "extreme"],
        },
        weightHistory: [
          new mongoose.Schema(
            {
              weight: {
                type: Number,
                required: true,
                min: 1,
              },
              date: {
                type: Date,
                required: true,
                default: Date.now,
              },
              note: {
                type: String,
                trim: true,
                default: null,
              },
            },
            { _id: false },
          ),
        ],
      },
      // profile fields for customers only
      validate: {
        validator: function (value) {
          if (this.role !== "customer") return false;
        },
        message: "Profile fields are only available for customers",
      },
    },

    // this points to the assessment result document
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      unique: true,
      sparse: true,
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function (value) {
          // If no specialist assigned, skip
          if (!value) return true;

          if (this.role !== "customer") return false;

          // Look up the user being assigned
          const user = await mongoose.models.User.findById(value);
          // Ensure the user exists and has role "specialist"
          return user && user.role === "specialist";
        },
        message:
          "Assigned specialist must be a user with role 'specialist' and must be assigned to a customer",
      },
    },

    // specialist fields
    specialistInfo: {
      type: new mongoose.Schema(
        {
          specialization: { type: String },
          experienceYears: { type: Number },
          status: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive",
          },
        },
        { _id: false }, // optional: prevents creating a new _id for subdoc
      ),
      required: function () {
        return this.role === "specialist";
      },
      validate: {
        validator: function (value) {
          if (this.role !== "specialist") return true;
        },
        message: "specialistInfo is required for users with role 'specialist'",
      },
    },
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function () {
  // Only hash if password changed
  if (this.isModified("passwordHash") && this.passwordHash) {
    this.passwordHash = bcrypt.hashSync(this.passwordHash, 12);
  }
  // no next() here!
});

// Instance method
userSchema.methods.comparePassword = function (password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  // Remove sensitive fields
  delete user.passwordHash;
  delete user.googleSubject;
  delete user.refreshToken; // if you store it
  delete user.sessionVersion;
  delete user.__v;

  // Rename fields
  user.id = user._id;
  delete user._id;

  // Format lastSeen
  if (user.lastSeen) {
    user.lastSeen = user.lastSeen.toISOString();
  }

  // Remove specialist and assessment if not customer
  if (user.role !== "customer") {
    delete user.specialist;
    delete user.assessment;
  }

  // Remove specialistInfo if not a specialist
  if (user.role !== "specialist") {
    delete user.specialistInfo;
  }

  if (user.role === "customer") {
    if (user.profile?.weightHistory) {
      user.profile.weightHistory = [...user.profile.weightHistory]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    }
  } else {
    delete user.profile;
  }

  delete user.weight;
  delete user.lastNote;

  return user;
};

const User = mongoose.model("User", userSchema);
export default User;
