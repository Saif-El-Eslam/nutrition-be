import mongoose from "mongoose";
import env from "#config/env.js";
import User from "#models/user.js";
import Note from "#models/note.js";
import Category from "#models/category.js";
import Article from "#models/article.js";
import Recipe from "#models/recipe.js";
import Feedback from "#models/feedback.js";
import Subscription from "#models/subscription.js";
import UserSubscription from "#models/userSubscription.js";
import AssessmentForm from "#models/assessmentForm.js";
import AssessmentSection from "#models/assessmentSection.js";
import { assessmentFormSeed } from "./assessmentSeedData.js";

const DEFAULT_PASSWORD = env.defaultPassword || "123456";

async function connect() {
  const uri = env.dbUrl || process.env.MONGO_URI;
  const dbName = env.dbName || process.env.DB_NAME;
  if (!uri) throw new Error("No MONGO_URI provided in env");
  await mongoose.connect(uri, dbName ? { dbName } : {});
}

async function disconnect() {
  await mongoose.disconnect();
}

async function ensureUser({
  firstName,
  lastName,
  email,
  phone,
  role,
  specialistInfo,
  specialist,
}) {
  const existing = await User.findOne({ $or: [{ email }, { phone }] }).select(
    "_id firstName lastName",
  );
  if (existing) return existing;

  const u = new User({
    firstName,
    lastName,
    email,
    phone,
    passwordHash: DEFAULT_PASSWORD,
    role,
  });

  if (role === "specialist") {
    u.specialistInfo = specialistInfo || {
      specialization: "general",
      experienceYears: 1,
      status: "inactive",
    };
  }

  if (role === "customer" && specialist) {
    u.specialist = specialist;
  }

  await u.save();
  return u;
}

async function ensureNotes({ customers, specialists }) {
  // create some notes for each customer from their assigned specialist
  for (const customer of customers) {
    const randomSpec =
      specialists[Math.floor(Math.random() * specialists.length)];
    const existing = await Note.findOne({ customer: customer._id });
    if (!existing) {
      await Note.create({
        content: `Initial note for ${customer.firstName} from ${randomSpec.firstName}`,
        customer: customer._id,
        writer: randomSpec._id,
        attachments: [],
      });
    }
  }
}

async function ensureCategory({ name, displayName, type, isActive = true }) {
  const existing = await Category.findOne({ name });
  if (existing) return existing;
  return Category.create({ name, displayName, type, isActive });
}

async function ensureSubscription({
  name,
  displayName,
  durationInDays,
  price = 0,
  currency = "EGP",
  description = "",
  features = [],
  mostPopular = false,
  type = "subscription_plan",
  activeDays = [],
  responseTimeInHours = 1,
  planNote = "",
}) {
  const existing = await Subscription.findOne({ name });
  if (existing) return existing;
  return Subscription.create({
    name,
    displayName,
    durationInDays,
    price,
    currency,
    description,
    features,
    mostPopular,
    type,
    activeDays,
    responseTimeInHours,
    planNote,
  });
}

async function ensureAssessmentResultsPlan() {
  return ensureSubscription({
    name: "assessment_results",
    displayName: localized(
      "Nutrition Analysis Results",
      "نتائج التحليل الغذائي",
    ),
    price: 25,
    currency: "EGP",
    description: localized(
      "A one-time payment for permanent access to your nutrition assessment results and personalized recommendations.",
      "دفعة واحدة للوصول الدائم إلى نتائج تقييمك الغذائي وتوصياتك المخصصة.",
    ),
    features: [
      localized(
        "Full nutrition assessment results",
        "نتائج التقييم الغذائي كاملة",
      ),
      localized(
        "Personalized health and nutrition insights",
        "رؤى صحية وغذائية مخصصة",
      ),
      localized("Permanent access with one payment", "وصول دائم بدفعة واحدة"),
    ],
    type: "one_time_offer",
    responseTimeInHours: 0,
    planNote: localized(
      "Pay once and return to your results whenever you need them.",
      "ادفع مرة واحدة وارجع إلى نتائجك وقتما تشاء.",
    ),
  });
}

async function createArticlesRecipesFeedbacks(users, categories) {
  // create a few articles
  const author = users.admin;
  const articleCategory = categories.article;

  const articlesData = [
    {
      title: "Healthy Eating Basics",
      description: "Intro to healthy eating",
      content: "Eat vegetables and fruits...",
      author: author._id,
      category: articleCategory._id,
      tags: ["health", "basics"],
    },
    {
      title: "Protein Myths",
      description: "Clearing common myths about protein",
      content: "Protein is important...",
      author: author._id,
      category: articleCategory._id,
      tags: ["protein", "myths"],
    },
  ];

  for (const a of articlesData) {
    const exists = await Article.findOne({ title: a.title });
    if (!exists) await Article.create(a);
  }

  // recipes
  const recipeCategory = categories.recipe;
  const recipesData = [
    {
      title: "Simple Oatmeal",
      description: "A quick oatmeal recipe",
      content: "Cook oats with water...",
      author: author._id,
      category: recipeCategory._id,
      ingredients: [
        { name: "Oats", quantity: "1", unit: "cup" },
        { name: "Milk", quantity: "1", unit: "cup" },
      ],
      instructions: [
        { step: 1, description: "Combine ingredients" },
        { step: 2, description: "Cook for 5 minutes" },
      ],
      tags: ["breakfast", "quick"],
    },
  ];

  for (const r of recipesData) {
    const exists = await Recipe.findOne({ title: r.title });
    if (!exists) await Recipe.create(r);
  }

  // feedbacks from random customers
  const customerIds = users.customers.map((c) => c._id);
  const feedbackSamples = [
    { title: "Great app", content: "Loved the recipes", rating: 5 },
    { title: "Good service", content: "Specialist helped a lot", rating: 4 },
  ];

  for (let i = 0; i < feedbackSamples.length; i++) {
    const f = feedbackSamples[i];
    const exists = await Feedback.findOne({ title: f.title });
    if (!exists) {
      await Feedback.create({
        ...f,
        user: customerIds[i % customerIds.length],
      });
    }
  }
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function createSubscriptionsAndUserSubscriptions(users) {
  const subs = [];
  subs.push(
    await ensureSubscription({
      name: "basic",
      displayName: localized("Basic Package", "الباقة الأساسية"),
      durationInDays: 30,
      price: 450,
      currency: "EGP",
      description: localized(
        "This plan includes a personalized diet plan and recipes to help you achieve your goals. It also offers WhatsApp support twice a week to answer your questions and provide guidance.",
        "تتضمن هذه الخطة نظامًا غذائيًا مخصصًا ووصفات تساعدك على تحقيق أهدافك. كما توفر دعمًا عبر واتساب مرتين أسبوعيًا للإجابة على استفساراتك وتقديم التوجيه.",
      ),
      features: [
        localized(
          "A diet plan suitable for your goal",
          "نظام غذائي مناسب لهدفك",
        ),
        localized(
          "Recipes that help you feel full and control hunger",
          "وصفات تساعدك على الشعور بالشبع والسيطرة على الجوع",
        ),
        localized(
          "Weekly follow-up to review your progress",
          "متابعة أسبوعية لمراجعة تقدمك",
        ),
        localized(
          "WhatsApp support twice a week",
          "دعم عبر واتساب مرتين أسبوعيًا",
        ),
      ],
      mostPopular: false,
      activeDays: ["sunday", "wednesday"],
      responseTimeInHours: 1,
      planNote: localized(
        "This package is suitable if you need guidance and organization, but the main execution will be on you.",
        "هذه الباقة مناسبة إذا كنت تحتاج إلى التوجيه والتنظيم، ولكن سيكون التنفيذ الأساسي عليك.",
      ),
    }),
  );
  subs.push(
    await ensureSubscription({
      name: "standard",
      displayName: localized("Standard Package", "الباقة القياسية"),
      durationInDays: 30,
      price: 850,
      currency: "EGP",
      description: localized(
        "This plan includes all Basic features plus a practical recipe booklet to make adherence easier, cardio exercises suitable for your level, organized follow-up to minimize confusion, and continuous adjustments based on your body’s response. WhatsApp support is available 4 times a week.",
        "تتضمن هذه الخطة جميع ميزات القاعدة بالإضافة إلى كتيب وصفات عملية لتسهيل الالتزام، تمارين قلبية مناسبة لمستوى الخاص بك، متابعة منظمة لتقليل الالتباس، وتعديلات مستمرة بناءً على استجابة جسمك. دعم واتساب متاح 4 مرات في الأسبوع.",
      ),
      features: [
        localized("Personalized diet plan", "نظام غذائي مخصص"),
        localized(
          "Practical recipe booklet to make adherence easier",
          "كتيب وصفات عملية لتسهيل الالتزام",
        ),
        localized(
          "Cardio exercises suitable for your level",
          "تمارين قلبية مناسبة لمستوى الخاص بك",
        ),
        localized(
          "Organized follow-up to minimize confusion",
          "متابعة منظمة لتقليل الالتباس",
        ),
        localized(
          "Continuous adjustments based on your body’s response",
          "تعديلات مستمرة بناءً على استجابة جسمك",
        ),
        localized(
          "WhatsApp support 4 times a week",
          "دعم واتساب 4 مرات في الأسبوع",
        ),
      ],
      mostPopular: true,
      activeDays: ["sunday", "monday", "wednesday"],
      responseTimeInHours: 2,
      planNote: localized(
        "Most of our clients choose this package because it gives enough support to help you continue without feeling alone.",
        "يختار معظم عملائنا هذه الباقة لأنها توفر الدعم الكافي لمساعدتك على الاستمرار دون الشعور بالوحدة.",
      ),
    }),
  );
  subs.push(
    await ensureSubscription({
      name: "premium",
      displayName: localized("Premium Package", "الباقة المميزة"),
      durationInDays: 30,
      price: 1350,
      currency: "EGP",
      description: localized(
        "This plan is designed for those who want the highest level of support and guidance. It includes all Standard features plus closer follow-up with faster adjustments, and daily WhatsApp support to ensure you never feel alone in your journey.",
        "هذه الخطة مصممة لمن يرغب في أعلى مستوى من الدعم والتوجيه. تشمل جميع ميزات الباقة القياسية بالإضافة إلى متابعة أقرب مع تعديلات أسرع، ودعم واتساب يومي لضمان عدم شعورك بالوحدة في رحلتك.",
      ),
      features: [
        localized(
          "All features of the Standard package",
          "جميع ميزات الباقة القياسية",
        ),
        localized(
          "Closer follow-up and faster adjustments",
          "متابعة أقرب وتعديلات أسرع",
        ),
        localized("Daily WhatsApp support", "دعم واتساب يومي"),
      ],
      mostPopular: false,
      activeDays: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      responseTimeInHours: 8,
      planNote: localized(
        "If you like having daily support during the execution and want closer guidance.",
        "إذا أعجبك الحصول على الدعم اليومي أثناء التنفيذ وتريد توجيهًا أقرب.",
      ),
    }),
  );

  await ensureAssessmentResultsPlan();

  // assign subscriptions to some customers: half active, half expired
  const customers = users.customers;
  const now = new Date();

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const plan = subs[i % subs.length];
    const isExpired = i >= Math.floor(customers.length / 2);

    const startDate = isExpired ? addDays(now, -plan.durationInDays - 5) : now;
    const expiryDate = isExpired
      ? addDays(startDate, plan.durationInDays)
      : addDays(now, plan.durationInDays);

    const existing = await UserSubscription.findOne({ user: customer._id });
    if (existing) {
      // update expiry/status if needed
      existing.subscription = plan._id;
      existing.startDate = startDate;
      existing.expiryDate = expiryDate;
      existing.status = expiryDate < new Date() ? "expired" : "active";
      await existing.save();
    } else {
      await UserSubscription.create({
        user: customer._id,
        subscription: plan._id,
        startDate,
        expiryDate,
        status: expiryDate < new Date() ? "expired" : "active",
      });
    }
  }
}

async function createAssessmentForm(createdBy) {
  const titleEn = assessmentFormSeed.title.en;
  let form = await AssessmentForm.findOne({ "title.en": titleEn });
  if (form) return form;

  form = new AssessmentForm({
    title: assessmentFormSeed.title,
    description: assessmentFormSeed.description,
    isActive: true,
    createdBy: createdBy._id,
    sections: [],
  });

  await form.save();

  const sections = [];
  for (const sectionData of assessmentFormSeed.sections) {
    const section = await AssessmentSection.create({
      form: form._id,
      title: sectionData.title,
      description: sectionData.description,
      order: sectionData.order,
      questions: sectionData.questions,
      visibilityCondition: sectionData.visibilityCondition,
      resultRanges: sectionData.resultRanges,
      isText: sectionData.isText || false,
    });
    sections.push(section._id);
  }

  form.sections = sections;
  await form.save();

  return form;
}

// helper: create localized field
const localized = (en, ar) => ({ en, ar });

export const prodSeed = async () => {
  // Minimal, idempotent production seed: admin, subscriptions, assessment
  const admin = await ensureUser({
    firstName: "Admin",
    lastName: "User",
    email: "support@diet-n-wellness.com",
    phone: "01097170211",
    role: "admin",
  });

  await ensureSubscription({
    name: "basic",
    displayName: localized("Basic Package", "الباقة الأساسية"),
    durationInDays: 30,
    price: 450,
    currency: "EGP",
    description: localized(
      "This plan includes a personalized diet plan and recipes to help you achieve your goals. It also offers WhatsApp support twice a week to answer your questions and provide guidance.",
      "تتضمن هذه الخطة نظامًا غذائيًا مخصصًا ووصفات تساعدك على تحقيق أهدافك. كما توفر دعمًا عبر واتساب مرتين أسبوعيًا للإجابة على استفساراتك وتقديم التوجيه.",
    ),
    features: [
      localized("A diet plan suitable for your goal", "نظام غذائي مناسب لهدفك"),
      localized(
        "Recipes that help you feel full and control hunger",
        "وصفات تساعدك على الشعور بالشبع والسيطرة على الجوع",
      ),
      localized(
        "Weekly follow-up to review your progress",
        "متابعة أسبوعية لمراجعة تقدمك",
      ),
      localized(
        "WhatsApp support twice a week",
        "دعم عبر واتساب مرتين أسبوعيًا",
      ),
    ],
    mostPopular: false,
    activeDays: ["sunday", "wednesday"],
    responseTimeInHours: 1,
    planNote: localized(
      "This package is suitable if you need guidance and organization, but the main execution will be on you.",
      "هذه الباقة مناسبة إذا كنت تحتاج إلى التوجيه والتنظيم، ولكن سيكون التنفيذ الأساسي عليك.",
    ),
  });
  await ensureSubscription({
    name: "standard",
    displayName: localized("Standard Package", "الباقة القياسية"),
    durationInDays: 30,
    price: 850,
    currency: "EGP",
    description: localized(
      "This plan includes all Basic features plus a practical recipe booklet to make adherence easier, cardio exercises suitable for your level, organized follow-up to minimize confusion, and continuous adjustments based on your body’s response. WhatsApp support is available 4 times a week.",
      "تتضمن هذه الخطة جميع ميزات القاعدة بالإضافة إلى كتيب وصفات عملية لتسهيل الالتزام، تمارين قلبية مناسبة لمستوى الخاص بك، متابعة منظمة لتقليل الالتباس، وتعديلات مستمرة بناءً على استجابة جسمك. دعم واتساب متاح 4 مرات في الأسبوع.",
    ),
    features: [
      localized("Personalized diet plan", "نظام غذائي مخصص"),
      localized(
        "Practical recipe booklet to make adherence easier",
        "كتيب وصفات عملية لتسهيل الالتزام",
      ),
      localized(
        "Cardio exercises suitable for your level",
        "تمارين قلبية مناسبة لمستوى الخاص بك",
      ),
      localized(
        "Organized follow-up to minimize confusion",
        "متابعة منظمة لتقليل الالتباس",
      ),
      localized(
        "Continuous adjustments based on your body’s response",
        "تعديلات مستمرة بناءً على استجابة جسمك",
      ),
      localized(
        "WhatsApp support 4 times a week",
        "دعم واتساب 4 مرات في الأسبوع",
      ),
    ],
    mostPopular: true,
    activeDays: ["sunday", "monday", "wednesday"],
    responseTimeInHours: 2,
    planNote: localized(
      "Most of our clients choose this package because it gives enough support to help you continue without feeling alone.",
      "يختار معظم عملائنا هذه الباقة لأنها توفر الدعم الكافي لمساعدتك على الاستمرار دون الشعور بالوحدة.",
    ),
  });
  await ensureSubscription({
    name: "premium",
    displayName: localized("Premium Package", "الباقة المميزة"),
    durationInDays: 30,
    price: 1350,
    currency: "EGP",
    description: localized(
      "This plan is designed for those who want the highest level of support and guidance. It includes all Standard features plus closer follow-up with faster adjustments, and daily WhatsApp support to ensure you never feel alone in your journey.",
      "هذه الخطة مصممة لمن يرغب في أعلى مستوى من الدعم والتوجيه. تشمل جميع ميزات الباقة القياسية بالإضافة إلى متابعة أقرب مع تعديلات أسرع، ودعم واتساب يومي لضمان عدم شعورك بالوحدة في رحلتك.",
    ),
    features: [
      localized(
        "All features of the Standard package",
        "جميع ميزات الباقة القياسية",
      ),
      localized(
        "Closer follow-up and faster adjustments",
        "متابعة أقرب وتعديلات أسرع",
      ),
      localized("Daily WhatsApp support", "دعم واتساب يومي"),
    ],
    mostPopular: false,
    activeDays: [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ],
    responseTimeInHours: 8,
    planNote: localized(
      "If you like having daily support during the execution and want closer guidance.",
      "إذا أعجبك الحصول على الدعم اليومي أثناء التنفيذ وتريد توجيهًا أقرب.",
    ),
  });

  await ensureAssessmentResultsPlan();

  await createAssessmentForm(admin);
};

export const devSeed = async () => {
  // Users
  const admin = await ensureUser({
    firstName: "Admin",
    lastName: "User",
    email: "admin@diet-wellness.com",
    phone: "01000000000",
    role: "admin",
  });

  const specialists = [];
  for (let i = 1; i <= 3; i++) {
    const spec = await ensureUser({
      firstName: `Spec${i}`,
      lastName: "User",
      email: `specialist${i}@diet-wellness.com`,
      phone: `0100000001${i}`,
      role: "specialist",
      specialistInfo: {
        specialization: i === 1 ? "dietitian" : "nutrition",
        experienceYears: 3 + i,
        status: i === 1 ? "active" : "inactive",
      },
    });
    specialists.push(spec);
  }

  const customers = [];
  for (let i = 1; i <= 20; i++) {
    const c = await ensureUser({
      firstName: `Customer${i}`,
      lastName: "User",
      email: `customer${i}@diet-wellness.com`,
      phone: `010000000${10 + i}`,
      role: "customer",
      specialist: specialists[i % specialists.length]._id,
    });
    customers.push(c);
  }

  const users = { admin, specialists, customers };

  // note
  await ensureNotes({ customers, specialists });

  // Categories
  const articleCat = await ensureCategory({
    name: "general-articles",
    displayName: "General Articles",
    type: "article",
  });
  const recipeCat = await ensureCategory({
    name: "general-recipes",
    displayName: "General Recipes",
    type: "recipe",
  });
  const categories = { article: articleCat, recipe: recipeCat };

  // Content
  await createArticlesRecipesFeedbacks(
    { admin, specialists, customers },
    categories,
  );

  // Subscriptions
  await createSubscriptionsAndUserSubscriptions({ customers });

  // Assessment form
  await createAssessmentForm(admin);
};

export async function runSeed({ envName = "development" } = {}) {
  await connect();

  const isProduction = envName === "production"; //|| process.env.NODE_ENV === "production";

  if (isProduction) {
    await prodSeed();
  } else {
    await devSeed();
  }

  await disconnect();
}

export default { runSeed };
