import mongoose from "mongoose";
import {
  ASSESSMENT_CONDITION_LOGIC,
  ASSESSMENT_CONDITION_FIELDS,
  ASSESSMENT_CONDITION_OPERATORS,
} from "../modules/assessments/assessments.constants.js";

const idTransform = (doc, ret) => {
  ret.id = ret._id;
  delete ret._id;
};

const choiceSchema = new mongoose.Schema(
  {
    text: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    score: { type: Number, required: true, min: 0, max: 10 },
  },
  {
    _id: true,
    toJSON: { transform: idTransform },
    toObject: { transform: idTransform },
  },
);

const conditionSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    choiceIds: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "condition.choiceIds must contain at least one choice ID",
      },
    },
  },
  { _id: false },
);

// Section visibility condition based on user attributes
const sectionConditionSchema = new mongoose.Schema(
  {
    // Simple rule: { field: 'gender', value: 'female' }
    // Complex rule with operators: { field: 'age', operator: '>=', value: 18 }
    rules: {
      type: [
        {
          field: {
            type: String,
            required: true,
            enum: ASSESSMENT_CONDITION_FIELDS,
          },
          operator: {
            type: String,
            enum: ASSESSMENT_CONDITION_OPERATORS,
            default: "equals",
          },
          value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
          },
        },
      ],
      default: [],
    },
    logic: {
      type: String,
      enum: ASSESSMENT_CONDITION_LOGIC,
      default: "AND",
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    text: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    order: { type: Number, required: true, min: 1 },
    condition: { type: conditionSchema, default: null },
    choices: {
      type: [choiceSchema],
      default: [],
      validate: {
        validator: function (arr) {
          // const section = this.ownerDocument();
          const section = this.ownerDocument();
          const isTextSection = section?.isText;
          this.wasTextSection = isTextSection; // Store the value for use in the validator
          if (isTextSection) {
            return !arr || arr.length === 0;
          }
          return Array.isArray(arr) && arr.length >= 2 && arr.length <= 10;
        },
        message: function () {
          return `Questions under text section should not have choices and each question should have at least 2 choices and at most 10 choices.`;
        },
      },
    },
  },
  {
    _id: true,
    toJSON: { transform: idTransform },
    toObject: { transform: idTransform },
  },
);

const resultRangeSchema = new mongoose.Schema(
  {
    minScore: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    label: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    recommendations: {
      type: [
        {
          en: { type: String, required: true, trim: true },
          ar: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const assessmentSectionSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentForm",
      required: true,
      index: true,
    },
    title: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, trim: true, default: "" },
      ar: { type: String, trim: true, default: "" },
    },
    order: { type: Number, required: true, min: 1 },
    isText: { type: Boolean, default: false },
    isOptional: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
    // Condition to determine if this section is visible for a user
    visibilityCondition: {
      type: sectionConditionSchema,
      default: () => ({ rules: [], logic: "AND" }),
    },
    resultRanges: {
      type: [resultRangeSchema],
      validate: {
        validator: function (ranges) {
          if (this.isText) {
            if (ranges && ranges.length > 0)
              throw new Error("NO_RESULT_RANGES_FOR_TEXT_SECTION");
            return true; // No ranges should be provided for text sections
          }

          if (!ranges || ranges.length === 0) return false;
          const sorted = [...ranges].sort((a, b) => a.minScore - b.minScore);
          if (sorted[0].minScore !== 0) return false;
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].maxScore < sorted[i].minScore) return false;
            if (i > 0 && sorted[i].minScore !== sorted[i - 1].maxScore + 1)
              return false;
          }
          return true;
        },
        message:
          "Result ranges must be non-empty, start at 0, and be contiguous with no gaps or overlaps",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

const AssessmentSection = mongoose.model(
  "AssessmentSection",
  assessmentSectionSchema,
);
export default AssessmentSection;
