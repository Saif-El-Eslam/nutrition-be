import dotenv from "dotenv";

dotenv.config();

const env = {
  environment: process.env.ENVIRONMENT || "development",
  port: process.env.PORT || 5000,
  host: process.env.HOST || "127.0.0.1",
  dbUrl: process.env.MONGO_URI,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,

  // Comma-separated so web, Android, and iOS clients can share this backend.
  // Every accepted client ID must belong to this application.
  googleClientIds: (process.env.GOOGLE_CLIENT_IDS || "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean),

  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.RESEND_FROM || process.env.BUSINESS_EMAIL,
  contactUsEmail: process.env.BUSINESS_EMAIL,

  paymobApiKey: process.env.PAYMOB_API_KEY,
  paymobSecretKey: process.env.PAYMOB_SECRET_KEY,
  paymobPublicKey: process.env.PAYMOB_PUBLIC_KEY,
  paymobIframeId: process.env.PAYMOB_IFRAME_ID,
  paymobPaymentIntegrationId: Number(process.env.PAYMOB_PAYMENT_INTEGRATION_ID),
  paymobWebhookSecret: process.env.PAYMOB_WEBHOOK_SECRET,

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,
  allowedOrigins: process.env.ALLOWED_ORIGINS,

  defaultPassword: process.env.DEFAULT_PASSWORD,

  // allowedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
};

env.allowedOrigins = [
  ...new Set(
    [
      ...(env.allowedOrigins
        ? env.allowedOrigins
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        : []),

      env.frontendUrl,
      "http://localhost:3000",
      "http://localhost:3005",
    ].filter(Boolean),
  ),
];

export default env;
