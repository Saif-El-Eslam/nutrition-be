import {
  ASSESSMENT_CONDITION_LOGIC,
  ASSESSMENT_CONDITION_FIELDS,
  ASSESSMENT_CONDITION_OPERATORS,
} from "./assessments.constants.js";

/**
 * Keep the completed-assessment summary public to the owning customer while
 * reserving per-section results, answers, and recommendations for paid access.
 */
export function filterResultForAccess(result, hasAccess) {
  const filteredResult = { ...result };

  if (!hasAccess) {
    delete filteredResult.sectionResults;
  }

  return filteredResult;
}

/**
 * Validate that result ranges are:
 * - Non-empty array
 * - Sorted ascending by minScore
 * - Non-overlapping
 * - Contiguous (no gaps)
 * - Starting at 0
 * Returns null if valid, or an error message string if invalid.
 */
export function validateResultRanges(ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return "Result ranges must be a non-empty array";
  }

  const sorted = [...ranges].sort((a, b) => a.minScore - b.minScore);

  if (sorted[0].minScore !== 0) {
    return "Result ranges must start at minScore 0";
  }

  for (let i = 0; i < sorted.length; i++) {
    const range = sorted[i];

    if (range.maxScore < range.minScore) {
      return `Range "${range.label}": maxScore must be > or = minScore`;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (range.minScore !== prev.maxScore + 1) {
        return `Gap or overlap detected between ranges "${prev.label}" and "${range.label}"`;
      }
    }
  }

  return null;
}

/**
 * Determine which questions are visible for a given answers map.
 * Processes questions in ascending order order.
 * A question without a condition is always visible.
 * A question with a condition is visible only if the trigger question
 * was answered with one of the specified choiceIds.
 *
 * @param {Array} questions - the section's embedded questions
 * @param {Map<string, string>} answerMap - questionId (string) → choiceId (string)
 * @returns {Array} visibleQuestions sorted by order
 */
export function resolveVisibleQuestions(questions, answerMap) {
  const sorted = [...questions].sort((a, b) => a.order - b.order);

  return sorted.filter((q) => {
    if (!q.condition) return true;

    const triggerAnswer = answerMap.get(q.condition.questionId.toString());
    if (!triggerAnswer) return false;

    const triggerChoiceId =
      typeof triggerAnswer === "object"
        ? triggerAnswer.choiceId?.toString()
        : triggerAnswer;

    if (!triggerChoiceId) return false;

    return q.condition.choiceIds
      .map((id) => id.toString())
      .includes(triggerChoiceId);
  });
}

/**
 * Calculate the section score from visible answers.
 * Only visible choice questions contribute to the score.
 *
 * @param {Array} questions - the section's embedded questions
 * @param {Array} answers - array of { questionId, choiceId, answerText }
 * @returns {number} the section score
 */
export function calculateSectionScore(section, answers) {
  const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a]));

  const visibleQuestions = resolveVisibleQuestions(
    section.questions,
    answerMap,
  );

  if (section.isText) {
    return { percentage: 0, score: 0 };
  }
  let score = 0;
  let maxScore = 0;
  let minScore = 0;

  for (const q of visibleQuestions) {
    maxScore += Math.max(...q.choices.map((c) => c.score));
    minScore += Math.min(...q.choices.map((c) => c.score));
    const answer = answerMap.get(q._id.toString());
    if (!answer?.choiceId) continue;

    const choice = q.choices.find(
      (c) => c._id.toString() === answer.choiceId.toString(),
    );
    if (choice) score += choice.score;
  }

  return { percentage: (maxScore - score) / (maxScore - minScore), score };
}

/**
 * Find the result range that matches a given score.
 * Returns the matching range object or null.
 */
export function matchResultRange(ranges, score) {
  return ranges.find((r) => score >= r.minScore && score <= r.maxScore) ?? null;
}

/**
 * Compute max possible score for a section.
 * Assumes all conditional questions are visible (worst-case upper bound).
 */
export function sectionMaxPossibleScore(section) {
  if (section.isText) return 0;
  return section.questions.reduce((total, q) => {
    const maxChoiceScore = Math.max(...q.choices.map((c) => c.score));
    return total + maxChoiceScore;
  }, 0);
}

/**
 * Build the answer snapshots for a section, marking conditional questions.
 * Only includes visible questions' answers.
 *
 * @param {Array} questions - the section's embedded questions
 * @param {Array} answers - array of { questionId, choiceId }
 * @returns {Array} answerSnapshots
 */
export function buildAnswerSnapshots(section, answers) {
  const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a]));

  const visibleQuestions = resolveVisibleQuestions(
    section.questions,
    answerMap,
  );
  const snapshots = [];

  for (const q of visibleQuestions) {
    const answer = answerMap.get(q._id.toString());
    if (!answer) continue;

    if (section.isText) {
      snapshots.push({
        questionId: q._id,
        questionText: q.text,
        answerText: answer.answerText?.trim() ?? "",
        score: 0,
        wasConditional: !!q.condition,
      });
      continue;
    }

    const choiceIdStr = answer.choiceId?.toString();
    if (!choiceIdStr) continue;

    const choice = q.choices.find((c) => c._id.toString() === choiceIdStr);
    if (!choice) continue;

    snapshots.push({
      questionId: q._id,
      questionText: q.text,
      choiceId: choice._id,
      choiceText: choice.text,
      score: choice.score,
      wasConditional: !!q.condition,
    });
  }

  return snapshots;
}

/**
 * Strip scores from choices before returning form data to a customer.
 * Returns a new form structure with choices lacking the score field.
 * If lang is provided, all { en, ar } text fields are resolved to that language.
 */
export function stripScoresFromForm(form, lang = null) {
  const plain = form.toJSON ? form.toJSON() : { ...form };

  if (plain.sections) {
    plain.sections = plain.sections.map((section) => {
      const s = section.toJSON ? section.toJSON() : { ...section };
      if (s.questions) {
        s.questions = s.questions.map((q) => {
          const question = { ...q };
          question.choices = (question.choices || []).map(
            // eslint-disable-next-line no-unused-vars
            ({ score, ...rest }) => rest,
          );
          return question;
        });
      }
      // Never expose result ranges to customers
      delete s.resultRanges;
      return s;
    });
  }

  return lang ? localizeContent(plain, lang) : plain;
}

/**
 * Deep-localize an object tree by replacing every { en, ar } leaf
 * with the value for the given language (falls back to "en").
 * Skips Mongoose ObjectIds, Dates, and other non-plain objects.
 */
export function localizeContent(obj, lang) {
  if (obj === null || obj === undefined) return obj;

  // Detect a localized text leaf: plain object where both en and ar are strings
  if (
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    typeof obj.en === "string" &&
    typeof obj.ar === "string"
  ) {
    return obj[lang] ?? obj.en;
  }

  if (Array.isArray(obj)) return obj.map((item) => localizeContent(item, lang));

  if (typeof obj === "object") {
    // Skip Date objects, ObjectIds, Buffers, etc.
    if (obj instanceof Date || obj._bsontype) return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = localizeContent(val, lang);
    }
    return result;
  }

  return obj;
}

/**
 * Check if a section is visible for a given user based on visibility condition.
 *
 * @param {Object} section - the assessment section with visibilityCondition
 * @param {Object} user - the user object with profile data
 * @returns {boolean} true if section is visible for the user, false otherwise
 */
export function isSectionVisibleForUser(section, user) {
  // If no visibility condition or no rules, section is always visible
  if (
    !section.visibilityCondition ||
    !section.visibilityCondition.rules ||
    section.visibilityCondition.rules.length === 0
  ) {
    return true;
  }

  const { rules, logic } = section.visibilityCondition;

  if (!rules || rules.length === 0) {
    return false;
  }

  if (!logic) {
    return false;
  }

  if (!Object.values(ASSESSMENT_CONDITION_LOGIC).includes(logic)) {
    return false;
  }

  const results = rules.map((rule) => evaluateRule(rule, user));

  // If logic is "AND", all rules must be true. If "OR", at least one must be true.
  if (logic === ASSESSMENT_CONDITION_LOGIC.AND) {
    return results.every((r) => r === true);
  } else if (logic === ASSESSMENT_CONDITION_LOGIC.OR) {
    return results.some((r) => r === true);
  }

  return true;
}

/** A section is required only when it is visible to the user and not optional. */
export function isSectionRequiredForUser(section, user) {
  return !section.isOptional && isSectionVisibleForUser(section, user);
}

/**
 * Evaluate a single condition rule against a user object.
 *
 * @param {Object} rule - condition rule with { field, operator, value }
 * @param {Object} user - the user object
 * @returns {boolean} whether the rule matches
 */
function evaluateRule(rule, user) {
  const { field, operator, value } = rule;

  if (!field || !operator || !value) {
    return false;
  }
  if (!Object.values(ASSESSMENT_CONDITION_FIELDS).includes(field)) {
    return false;
  }
  if (!Object.values(ASSESSMENT_CONDITION_OPERATORS).includes(operator)) {
    return false;
  }

  // Extract the field value from user (supports nested paths like profile.gender)
  const fieldValue = getFieldValue(user, field);

  if (fieldValue === undefined) {
    return false;
  }

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "notEquals":
      return fieldValue !== value;
    case "greaterThan":
      return fieldValue > value;
    case "lessThan":
      return fieldValue < value;
    case "greaterThanOrEquals":
      return fieldValue >= value;
    case "lessThanOrEquals":
      return fieldValue <= value;
    case "in":
      return Array.isArray(value) ? value.includes(fieldValue) : false;
    default:
      return false;
  }
}

/**
 * Get a field value from a user object, supporting nested paths.
 *
 * @param {Object} user - the user object
 * @param {string} fieldPath - field path (e.g., "gender" or "profile.gender")
 * @returns {*} the field value or undefined
 */
function getFieldValue(user, fieldPath) {
  const parts = fieldPath.split(".");
  let value = user;

  for (const part of parts) {
    if (value && typeof value === "object") {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}
