import { body, query, param } from "express-validator";

const updateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { field: "firstName", min: 2, max: 50 }]),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { field: "lastName", min: 2, max: 50 }]),
  body("phone")
    .optional()
    .trim()
    .isMobilePhone("ar-EG")
    .withMessage(["INVALID_PHONE_FORMAT"]),
  body("specialistInfo.specialization")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "specialization", min: 3, max: 100 },
    ]),
  body("specialistInfo.experienceYears")
    .optional()
    .isInt({ min: 0 })
    .withMessage(["INVALID_LENGTH", { field: "experienceYears", min: 0 }]),
  body("profile.gender")
    .optional()
    .isIn(["male", "female"])
    .withMessage([
      "INVALID_ENUM_VALUE",
      { field: "gender", allowed: ["male", "female"] },
    ]),
  body("profile.age")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage(["INVALID_INPUT"]),
  body("profile.currentWeight")
    .optional()
    .isFloat({ min: 1 })
    .withMessage(["INVALID_INPUT"]),
  body("profile.height")
    .optional()
    .isFloat({ min: 30 })
    .withMessage(["INVALID_INPUT"]),
  body("profile.maritalStatus")
    .optional()
    .isIn(["single", "married", "other"])
    .withMessage([
      "INVALID_ENUM_VALUE",
      { field: "maritalStatus", allowed: ["single", "married", "other"] },
    ]),
  body("profile.location")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "location", min: 1 }]),
  body("profile.activityLevel")
    .optional()
    .isIn(["low", "moderate", "high", "extreme"])
    .withMessage([
      "INVALID_ENUM_VALUE",
      {
        field: "activityLevel",
        allowed: ["low", "moderate", "high", "extreme"],
      },
    ]),
];

const addWeightRecord = [
  param("customerId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "customerId" }]),
  body("weight")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "weight" }])
    .isFloat({ min: 1 })
    .withMessage(["INVALID_INPUT"]),
  body("date").optional().isISO8601().withMessage(["INVALID_DATE"]),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage(["INVALID_LENGTH", { field: "note", max: 200 }]),
];

const updateWeight = [
  param("customerId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "customerId" }]),
  body("weight")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "weight" }])
    .isFloat({ min: 1 })
    .withMessage(["INVALID_INPUT"])
    .toFloat(),
  body("date").optional().isISO8601().withMessage(["INVALID_DATE"]),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage(["INVALID_LENGTH", { field: "note", max: 200 }]),
];

const createSpecialistProfile = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "firstName" }])
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { field: "firstName", min: 2, max: 50 }]),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "lastName" }])
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { field: "lastName", min: 2, max: 50 }]),
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "phone" }])
    .isMobilePhone("ar-EG")
    .withMessage(["INVALID_PHONE_FORMAT"]),
  body("password")
    .notEmpty()
    .withMessage(["PASSWORD_REQUIRED"])
    .isLength({ min: 8, max: 72 })
    .withMessage(["INVALID_LENGTH", { field: "password", min: 8, max: 72 }])
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage(["PASSWORD_TOO_LONG"]),
  body("specialization")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "specialization" }])
    .isLength({ min: 3 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "specialization", min: 3, max: 100 },
    ]),
  body("experienceYears")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "experienceYears" }])
    .isInt({ min: 0 })
    .withMessage(["INVALID_INPUT"]),
];

const searchProfiles = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "search", min: 1 }]),
  query("firstName")
    .optional()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "firstName", min: 1 }]),
  query("lastName")
    .optional()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "lastName", min: 1 }]),
  query("email")
    .optional()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "email", min: 1 }]),
  query("phone")
    .optional()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "phone", min: 1 }]),
  query("role")
    .optional()
    .isIn(["customer", "specialist", "admin"])
    .withMessage(["INVALID_ROLE"]),
  query("assignedToSpecialist")
    .optional()
    .isBoolean()
    .withMessage(["INVALID_ASSIGNED_TO_SPECIALIST_VALUE"]),
  query("specialistStatus")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage(["INVALID_SPECIALIST_STATUS"]),
  query("specialization")
    .optional()
    .isLength({ min: 1 })
    .withMessage(["INVALID_LENGTH", { field: "specialization", min: 1 }]),
  query("assignedSpecialistId")
    .optional()
    .isMongoId()
    .withMessage([
      "INVALID_MONGO_ID_FORMAT",
      { field: "assignedSpecialistId" },
    ]),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage(["INVALID_PAGE_NUMBER"]),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(["INVALID_LIMIT_NUMBER"]),
];

const specialistId = [
  param("specialistId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "specialist" }]),
];

const updateSpecialistProfile = [
  param("specialistId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "specialistId" }]),
  body("specialization")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "specialization", min: 3, max: 100 },
    ]),
  body("experienceYears")
    .optional()
    .isInt({ min: 0 })
    .withMessage(["INVALID_INPUT"]),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage(["INVALID_SPECIALIST_STATUS"]),
  body()
    .custom((_, { req }) => {
      if (
        req.body.specialization === undefined &&
        req.body.experienceYears === undefined &&
        req.body.status === undefined
      ) {
        return false;
      }
      return true;
    })
    .withMessage(["NO_BODY_FIELDS_PROVIDED"]),
];

const assignCustomersToSpecialist = [
  param("specialistId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "specialistId" }]),
  body("customerIds")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD"])
    .isArray({ min: 1 })
    .withMessage(["INVALID_ARRAY", { field: "customerIds" }])
    .custom((ids) => ids.every((id) => /^[a-f\d]{24}$/i.test(id)))
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "customerIds" }]),
];

const userId = [
  param("userId")
    .isMongoId()
    .withMessage(["INVALID_MONGO_ID_FORMAT", { field: "user" }]),
];

export default {
  updateProfile,
  updateWeight,
  addWeightRecord,
  createSpecialistProfile,
  updateSpecialistProfile,
  searchProfiles,
  specialistId,
  userId,
  assignCustomersToSpecialist,
};
