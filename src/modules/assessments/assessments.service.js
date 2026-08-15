import mongoose from "mongoose";
import AssessmentForm from "#models/assessmentForm.js";
import AssessmentSection from "#models/assessmentSection.js";
import AssessmentSubmission from "#models/assessmentSubmission.js";
import User from "#models/user.js";
import { ERROR_CODES, translate } from "#utils/localization.js";
import {
  serializeManyWithUserReferences,
  serializeWithUserReferences,
} from "#serializers/related-user.serializer.js";
import { SUBMISSION_STATUS } from "./assessments.constants.js";
import {
  validateResultRanges,
  resolveVisibleQuestions,
  calculateSectionScore,
  matchResultRange,
  buildAnswerSnapshots,
  stripScoresFromForm,
  localizeContent,
  isSectionVisibleForUser,
  isSectionRequiredForUser,
  filterResultForAccess,
} from "./assessments.helpers.js";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function createError(code, status = 400, params = {}) {
  const message = translate(code, "en", params);
  const err = new Error(message);
  err.code = code;
  err.status = status;
  err.params = params;
  return err;
}

/** Validate answers: required sections need all visible questions; choices must be valid. */
export function validateSectionAnswers(section, answers, language = "en") {
  const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a]));

  const visible = resolveVisibleQuestions(section.questions, answerMap);

  for (const q of visible) {
    const answer = answerMap.get(q._id.toString());
    if (!answer) {
      if (section.isOptional) continue;

      throw createError(ERROR_CODES.ASSESSMENT_MISSING_VISIBLE_ANSWER, 400, {
        question: q.text?.[language] ?? q.text?.en ?? q.text,
      });
    }

    if (section.isText) {
      if (!answer.answerText || !answer.answerText.trim()) {
        if (section.isOptional) continue;

        throw createError(ERROR_CODES.ASSESSMENT_MISSING_VISIBLE_ANSWER, 400, {
          question: q.text?.[language] ?? q.text?.en ?? q.text,
        });
      }
      continue;
    }

    const choiceIdStr = answer.choiceId?.toString();
    if (!choiceIdStr) {
      if (section.isOptional) continue;

      throw createError(ERROR_CODES.ASSESSMENT_MISSING_VISIBLE_ANSWER, 400, {
        question: q.text?.[language] ?? q.text?.en ?? q.text,
      });
    }

    const validChoice = q.choices.some((c) => c._id.toString() === choiceIdStr);
    if (!validChoice) {
      throw createError(ERROR_CODES.ASSESSMENT_INVALID_CHOICE, 400, {
        question: q.text?.[language] ?? q.text?.en ?? q.text,
      });
    }
  }
}

/** Score a section and return the SectionResult to store. */
function scoreSectionResult(section, answers, language = "en") {
  validateSectionAnswers(section, answers, language);

  const { percentage, score } = calculateSectionScore(section, answers);
  const snapshots = buildAnswerSnapshots(section, answers);

  if (section.isText) {
    return {
      section: section._id,
      sectionTitle: section.title,
      sectionScore: percentage,
      result: null,
      answers: snapshots,
    };
  }

  if (!section.resultRanges || section.resultRanges.length === 0) {
    throw createError(ERROR_CODES.ASSESSMENT_NO_RESULT_RANGES, 500, {
      section: section.title?.[language] ?? section.title?.en ?? "",
    });
  }

  const range = matchResultRange(section.resultRanges, score);

  if (!range) {
    throw createError(ERROR_CODES.ASSESSMENT_NO_MATCHING_RESULT_RANGE, 500, {
      section: section.title?.[language] ?? section.title?.en ?? "",
    });
  }

  return {
    section: section._id,
    sectionTitle: section.title,
    sectionScore: percentage,
    result: {
      label: range.label,
      description: range.description,
      recommendations: range.recommendations,
    },
    answers: snapshots,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Form
// ─────────────────────────────────────────────────────────────────────────────

export async function createForm(data, adminId) {
  const form = await AssessmentForm.create({
    title: data.title,
    description: data.description || "",
    isActive: false,
    createdBy: adminId,
    sections: [],
  });

  return form;
}

export async function listForms(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [forms, total] = await Promise.all([
    AssessmentForm.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AssessmentForm.countDocuments(),
  ]);

  return {
    data: forms,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getFormById(formId) {
  const form = await AssessmentForm.findById(formId).populate({
    path: "sections",
    options: { sort: { order: 1 } },
  });

  if (!form) throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 404);

  return form;
}

export async function updateForm(formId, data) {
  const update = {};
  if (data?.title !== undefined) update.title = data.title;
  if (data?.description !== undefined) update.description = data.description;

  const form = await AssessmentForm.findByIdAndUpdate(formId, update, {
    new: true,
    runValidators: true,
  });

  if (!form) throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 404);

  return form;
}

export async function activateForm(formId) {
  const form = await AssessmentForm.findById(formId).populate({
    path: "sections",
    options: { sort: { order: 1 } },
  });

  if (!form) throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 404);

  if (form.sections.length === 0) {
    throw createError(ERROR_CODES.ASSESSMENT_FORM_HAS_NO_SECTIONS, 400);
  }

  // Guard: all sections must have at least one question
  for (const section of form.sections) {
    if (!section.questions || section.questions.length === 0) {
      throw createError(ERROR_CODES.ASSESSMENT_FORM_HAS_EMPTY_SECTIONS, 400, {
        section: section.title?.en ?? "",
      });
    }
    if (!section.resultRanges || section.resultRanges.length === 0) {
      throw createError(ERROR_CODES.ASSESSMENT_NO_RESULT_RANGES, 400, {
        section: section.title?.en ?? "",
      });
    }
  }

  // Atomic swap: deactivate all others, activate this one
  await AssessmentForm.updateMany(
    { _id: { $ne: formId }, isActive: true },
    { isActive: false },
  );
  form.isActive = true;
  await form.save();

  return form;
}

export async function deleteForm(formId) {
  const form = await AssessmentForm.findById(formId);
  if (!form) throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 404);
  if (form.isActive) {
    throw createError(ERROR_CODES.CANNOT_DELETE_ACTIVE_FORM, 400);
  }

  // Clean up sections and their submissions
  await AssessmentSection.deleteMany({ form: formId });
  await AssessmentSubmission.deleteMany({ form: formId });
  await form.deleteOne();
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Section
// ─────────────────────────────────────────────────────────────────────────────

export async function addSection(formId, data) {
  const form = await AssessmentForm.findById(formId);
  if (!form) throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 404);

  // Validate result ranges if provided
  if (data.resultRanges && data.resultRanges.length > 0) {
    const rangeError = validateResultRanges(data.resultRanges);
    if (rangeError) {
      throw createError(ERROR_CODES.ASSESSMENT_RESULT_RANGES_INVALID, 400);
    }
  }

  const sectionObject = {
    form: formId,
    title: data.title,
    description: data.description || "",
    isText: data.isText || false,
    isOptional: data.isOptional || false,
    order: data.order,
    questions: [],
  };

  if (!sectionObject.isText) {
    sectionObject.resultRanges = data.resultRanges || [];
  }

  const section = await AssessmentSection.create(sectionObject);

  form.sections.push(section._id);
  await form.save();

  return section;
}

export async function updateSection(sectionId, data) {
  const update = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.order !== undefined) update.order = data.order;
  if (data.isOptional !== undefined) update.isOptional = data.isOptional;

  const section = await AssessmentSection.findByIdAndUpdate(sectionId, update, {
    new: true,
    runValidators: true,
  });

  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  return section;
}

export async function replaceSectionResultRanges(sectionId, resultRanges) {
  const rangeError = validateResultRanges(resultRanges);
  if (rangeError) {
    throw createError(ERROR_CODES.ASSESSMENT_RESULT_RANGES_INVALID, 400);
  }

  const section = await AssessmentSection.findByIdAndUpdate(
    sectionId,
    { resultRanges },
    { new: true, runValidators: true },
  );

  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  return section;
}

export async function deleteSection(sectionId) {
  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  // Remove reference from form
  await AssessmentForm.findByIdAndUpdate(section.form, {
    $pull: { sections: section._id },
  });

  await section.deleteOne();
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Question
// ─────────────────────────────────────────────────────────────────────────────

/** Validate a question's condition references a question in the same section with a lower order. */
function validateCondition(section, condition, excludeQuestionId = null) {
  if (!condition) return;

  const triggerQuestion = section.questions.find(
    (q) =>
      q._id.toString() === condition.questionId.toString() &&
      (!excludeQuestionId || q._id.toString() !== excludeQuestionId.toString()),
  );

  if (!triggerQuestion) {
    throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
  }

  // The triggering question must already exist in the section
  // Cycle prevention is enforced: trigger must have lower order
  // (validated further below using the target question's own order — checked in addQuestion/updateQuestion)

  // Validate all choiceIds belong to the trigger question
  const validChoiceIds = triggerQuestion.choices.map((c) => c._id.toString());
  for (const cid of condition.choiceIds) {
    if (!validChoiceIds.includes(cid.toString())) {
      throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
    }
  }
}

export async function addQuestion(sectionId, data) {
  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  // Cycle prevention: condition.questionId must have lower order than data.order
  if (data.condition) {
    const triggerQ = section.questions.find(
      (q) => q._id.toString() === data.condition.questionId.toString(),
    );
    if (!triggerQ) {
      throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
    }
    if (triggerQ.order >= data.order) {
      throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
    }
    validateCondition(section, data.condition);
  }

  const question = {
    text: data.text,
    order: data.order,
    condition: data.condition || null,
  };
  if (!section.isText) {
    question.choices = data.choices || [];
  }

  section.questions.push(question);

  await section.save();

  return section;
}

export async function updateQuestion(sectionId, questionId, data) {
  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  const question = section.questions.id(questionId);
  if (!question) {
    throw createError(ERROR_CODES.ASSESSMENT_QUESTION_NOT_FOUND, 404);
  }

  const targetOrder = data.order !== undefined ? data.order : question.order;

  if (data.condition !== undefined) {
    if (data.condition === null) {
      question.condition = null;
    } else {
      const triggerQ = section.questions.find(
        (q) =>
          q._id.toString() === data.condition.questionId.toString() &&
          q._id.toString() !== questionId.toString(),
      );
      if (!triggerQ) {
        throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
      }
      if (triggerQ.order >= targetOrder) {
        throw createError(ERROR_CODES.ASSESSMENT_CONDITION_INVALID, 400);
      }
      validateCondition(section, data.condition, questionId);
      question.condition = data.condition;
    }
  }

  if (data.text !== undefined) question.text = data.text;
  if (data.order !== undefined) question.order = data.order;
  if (data.choices !== undefined) question.choices = data.choices;

  await section.save();

  return section;
}

export async function deleteQuestion(sectionId, questionId) {
  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  const question = section.questions.id(questionId);
  if (!question) {
    throw createError(ERROR_CODES.ASSESSMENT_QUESTION_NOT_FOUND, 404);
  }

  // Remove any questions that have a condition depending on this question
  section.questions = section.questions.filter(
    (q) =>
      q._id.toString() !== questionId.toString() &&
      q.condition?.questionId.toString() !== questionId.toString(),
  );

  await section.save();

  return section;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer — Assessment
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveForm(userId, language = null) {
  const form = await AssessmentForm.findOne({ isActive: true }).populate({
    path: "sections",
    select: "-questions -form",
    options: { sort: { order: 1 } },
  });

  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  // Get user with profile to check section visibility
  const user = await User.findById(userId);
  if (!user) throw createError(ERROR_CODES.USER_NOT_FOUND, 404);

  // Filter sections based on visibility for the user
  if (form.sections) {
    form.sections = form.sections.filter((section) =>
      isSectionVisibleForUser(section, user),
    );
  }

  return stripScoresFromForm(form, language);
}

export async function getActiveFormSection(userId, sectionId, language = null) {
  const form = await AssessmentForm.findOne({ isActive: true });
  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  // Check section belongs to the active form
  const sectionBelongs = form.sections.some(
    (id) => id.toString() === sectionId.toString(),
  );
  if (!sectionBelongs) {
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_IN_FORM, 404);
  }

  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  // Get user and check if section is visible
  const user = await User.findById(userId);
  if (!user) throw createError(ERROR_CODES.USER_NOT_FOUND, 404);

  if (!isSectionVisibleForUser(section, user)) {
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_VISIBLE, 403, {
      section: section.title?.en ?? "",
    });
  }

  // Strip scores and result ranges for customer
  const s = section.toJSON();
  s.questions = (s.questions || []).map((q) => ({
    ...q,
    // eslint-disable-next-line no-unused-vars
    choices: (q.choices || []).map(({ score, ...rest }) => rest),
  }));
  delete s.resultRanges;

  // Include total sections count and current index for UX progress
  const allSections = await AssessmentSection.find({ form: form._id })
    .sort({ order: 1 })
    .select("_id title order");

  const currentIndex = allSections.findIndex(
    (s) => s._id.toString() === sectionId.toString(),
  );

  const result = {
    ...s,
    totalSections: allSections.length,
    sectionIndex: currentIndex + 1,
    nextSectionId:
      currentIndex + 1 < allSections.length
        ? allSections[currentIndex + 1]._id
        : null,
    prevSectionId: currentIndex > 0 ? allSections[currentIndex - 1]._id : null,
  };

  return language ? localizeContent(result, language) : result;
}

/**
 * Submit answers for a single section (section-by-section flow).
 * Creates or updates an in_progress submission document.
 */
export async function submitSection(
  userId,
  sectionId,
  answers,
  language = null,
) {
  const form = await AssessmentForm.findOne({ isActive: true });
  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  // Ensure section is part of active form
  const sectionBelongs = form.sections.some(
    (id) => id.toString() === sectionId.toString(),
  );
  if (!sectionBelongs) {
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_IN_FORM, 400);
  }

  const section = await AssessmentSection.findById(sectionId);
  if (!section)
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);

  // Check if section is visible for the user
  const user = await User.findById(userId);
  if (!user) throw createError(ERROR_CODES.USER_NOT_FOUND, 404);

  if (!isSectionVisibleForUser(section, user)) {
    throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_VISIBLE, 403, {
      section: section.title?.en ?? "",
    });
  }

  const existingSubmission = await AssessmentSubmission.findOne({
    user: userId,
    form: form._id,
  });

  // Calculate section result
  const sectionResult = scoreSectionResult(section, answers, language ?? "en");

  // If a completed submission exists, reset it to start a fresh attempt
  if (existingSubmission?.status === SUBMISSION_STATUS.COMPLETED) {
    existingSubmission.status = SUBMISSION_STATUS.IN_PROGRESS;
    existingSubmission.sectionResults = [];
    existingSubmission.totalScore = 0;
    existingSubmission.submittedAt = undefined;
  }

  if (!existingSubmission) {
    // Create draft submission with this first section
    const submission = await AssessmentSubmission.create({
      user: userId,
      form: form._id,
      status: SUBMISSION_STATUS.IN_PROGRESS,
      totalScore: sectionResult.sectionScore,
      sectionResults: [sectionResult],
    });

    return {
      sectionResult: language
        ? localizeContent(sectionResult, language)
        : sectionResult,
      submission,
    };
  }

  // Replace section result if already exists, otherwise append
  const existingIndex = existingSubmission.sectionResults.findIndex(
    (r) => r.section.toString() === sectionId.toString(),
  );

  if (existingIndex >= 0) {
    // Re-submission of a section — replace it
    const oldScore =
      existingSubmission.sectionResults[existingIndex].sectionScore;
    existingSubmission.sectionResults[existingIndex] = sectionResult;
    existingSubmission.totalScore =
      existingSubmission.totalScore - oldScore + sectionResult.sectionScore;
  } else {
    existingSubmission.sectionResults.push(sectionResult);
    existingSubmission.totalScore += sectionResult.sectionScore;
  }

  await existingSubmission.save();

  return {
    sectionResult: language
      ? localizeContent(sectionResult, language)
      : sectionResult,
    submission: existingSubmission,
  };
}

/**
 * Finalize an in-progress submission after all visible sections have been submitted
 * section-by-section.
 */
export async function finalizeSubmission(userId, language = null) {
  const form = await AssessmentForm.findOne({ isActive: true });
  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  const submission = await AssessmentSubmission.findOne({
    user: userId,
    form: form._id,
  });

  if (!submission) {
    throw createError(ERROR_CODES.ASSESSMENT_NO_DRAFT_SUBMISSION, 404);
  }

  // Get user and form with sections to check which sections are required
  const user = await User.findById(userId);
  if (!user) throw createError(ERROR_CODES.USER_NOT_FOUND, 404);

  const fullForm = await AssessmentForm.findById(form._id).populate({
    path: "sections",
    options: { sort: { order: 1 } },
  });

  // Only visible, non-optional sections must be submitted.
  const requiredSectionIds = fullForm.sections
    .filter((section) => isSectionRequiredForUser(section, user))
    .map((section) => section._id.toString());

  // Check all required sections are answered.
  const answeredSectionIds = new Set(
    submission.sectionResults.map((r) => r.section.toString()),
  );

  const missingRequiredSections = requiredSectionIds.filter(
    (id) => !answeredSectionIds.has(id),
  );

  if (missingRequiredSections.length > 0) {
    throw createError(ERROR_CODES.ASSESSMENT_SECTIONS_INCOMPLETE, 400, {
      sections: missingRequiredSections.length,
    });
  }

  // Recalculate totalScore from stored section results
  submission.totalScore = submission.sectionResults.reduce(
    (sum, r) => sum + r.sectionScore,
    0,
  );
  submission.status = SUBMISSION_STATUS.COMPLETED;
  submission.submittedAt = new Date();
  await submission.save();

  // Link to user
  await User.findByIdAndUpdate(userId, { assessment: submission._id });

  const plain = submission.toJSON();
  return language ? localizeContent(plain, language) : plain;
}

/**
 * Submit all sections at once (full-form submission).
 * Creates or replaces a completed submission.
 */
export async function submitAll(userId, formId, sectionsData, language = null) {
  const user = await User.findById(userId).lean();
  if (!user) throw createError(ERROR_CODES.USER_NOT_FOUND, 404);

  const form = await AssessmentForm.findOne({ isActive: true }).populate(
    "sections",
  );
  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  if (form._id.toString() !== formId.toString()) {
    throw createError(ERROR_CODES.ASSESSMENT_FORM_NOT_FOUND, 400);
  }

  // Load all sections in one query
  const visibleSections = form.sections.filter((section) =>
    isSectionVisibleForUser(section.toJSON(), user),
  );

  // Check all visible, non-optional form sections are covered.
  const requiredSectionIds = visibleSections
    .filter((section) => !section.isOptional)
    .map((section) => section._id.toString());
  const submittedSectionIds = new Set(
    sectionsData.map((s) => s.sectionId.toString()),
  );
  const missing = requiredSectionIds.filter(
    (id) => !submittedSectionIds.has(id),
  );
  if (missing.length > 0) {
    throw createError(ERROR_CODES.ASSESSMENT_INCOMPLETE_SUBMISSION, 400);
  }

  const sectionMap = new Map(visibleSections.map((s) => [s._id.toString(), s]));

  // Score each section
  const sectionResults = [];

  for (const item of sectionsData) {
    const section = sectionMap.get(item.sectionId.toString());
    if (!section) {
      throw createError(ERROR_CODES.ASSESSMENT_SECTION_NOT_FOUND, 404);
    }

    const result = scoreSectionResult(section, item.answers, language ?? "en");
    sectionResults.push(result);
  }

  // Only submitted, scored sections contribute to the average. This prevents
  // an omitted optional choice section from lowering the total score.
  const notTextSectionsCount = sectionsData.reduce((count, item) => {
    const section = sectionMap.get(item.sectionId.toString());
    return count + (section?.isText ? 0 : 1);
  }, 0);
  const totalScore =
    sectionResults.reduce((sum, r) => sum + r.sectionScore, 0) /
    (notTextSectionsCount || 1);

  // Upsert submission — one per user per form
  const submission = await AssessmentSubmission.findOneAndUpdate(
    { user: userId, form: form._id },
    {
      user: userId,
      form: form._id,
      status: SUBMISSION_STATUS.COMPLETED,
      totalScore,
      sectionResults,
      submittedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  // Link to user
  await User.findByIdAndUpdate(userId, { assessment: submission._id });

  const plain = submission.toJSON();
  return language ? localizeContent(plain, language) : plain;
}

export async function getOwnResult(
  userId,
  language = null,
  hasDetailedAccess = false,
) {
  const submission = await AssessmentSubmission.findOne({
    user: userId,
    status: SUBMISSION_STATUS.COMPLETED,
  }).populate("form", "title description");

  if (!submission) throw createError(ERROR_CODES.ASSESSMENT_NOT_FOUND, 404);

  const filteredResult = filterResultForAccess(
    submission.toJSON(),
    hasDetailedAccess,
  );
  return language
    ? localizeContent(filteredResult, language)
    : filteredResult;
}

export async function getProgress(userId, language = null) {
  const form = await AssessmentForm.findOne({ isActive: true });
  if (!form) throw createError(ERROR_CODES.NO_ACTIVE_ASSESSMENT_FORM, 404);

  const submission = await AssessmentSubmission.findOne({
    user: userId,
    form: form._id,
  });

  const allVisibleSections = [];
  const userObj = await User.findById(userId);
  for (const sectionId of form.sections) {
    const section = await AssessmentSection.findById(sectionId);
    if (section && isSectionVisibleForUser(section, userObj)) {
      allVisibleSections.push(section);
    }
  }

  const answeredIds = new Set(
    submission?.sectionResults.map((r) => r.section.toString()),
  );

  return {
    status: submission?.status || null,
    totalSections: allVisibleSections.length,
    answeredSections: answeredIds.size,
    sections: allVisibleSections.map((s) => ({
      id: s._id,
      title: language ? (s.title?.[language] ?? s.title?.en) : s.title,
      order: s.order,
      isOptional: s.isOptional,
      answered: answeredIds.has(s._id.toString()),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin / Specialist — Viewing Results
// ─────────────────────────────────────────────────────────────────────────────

export async function listSubmissions(
  page = 1,
  limit = 10,
  formId = null,
  dateFrom = null,
  dateTo = null,
) {
  const skip = (page - 1) * limit;
  const filter = { status: SUBMISSION_STATUS.COMPLETED };
  if (formId) filter.form = formId;
  if (dateFrom || dateTo) {
    filter.submittedAt = {};
    if (dateFrom) filter.submittedAt.$gte = new Date(dateFrom);
    if (dateTo) {
      // include the full dateTo day
      const end = new Date(dateTo);
      end.setUTCHours(23, 59, 59, 999);
      filter.submittedAt.$lte = end;
    }
  }

  const [submissions, total] = await Promise.all([
    AssessmentSubmission.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName email")
      .populate("form", "title"),
    AssessmentSubmission.countDocuments(filter),
  ]);

  return {
    data: serializeManyWithUserReferences(submissions),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getUserSubmission(targetUserId, requestingUser) {
  const submission = await AssessmentSubmission.findOne({
    user: targetUserId,
    status: SUBMISSION_STATUS.COMPLETED,
  }).populate("user", "firstName lastName email");

  if (!submission) throw createError(ERROR_CODES.ASSESSMENT_NOT_FOUND, 404);

  // Specialists can only view their assigned customers
  if (requestingUser.role === "specialist") {
    const targetUser = await User.findById(targetUserId).select("specialist");
    if (
      !targetUser ||
      !targetUser.specialist ||
      targetUser.specialist.toString() !== requestingUser.user_id.toString()
    ) {
      const err = new Error(
        translate(ERROR_CODES.INSUFFICIENT_PERMISSIONS, "en"),
      );
      err.status = 403;
      err.code = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
      throw err;
    }
  }

  return serializeWithUserReferences(submission);
}
