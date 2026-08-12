import env from "#config/env.js";

const sendEmail = async ({ to, subject, html }) => {
  if (!env.resendApiKey || !env.mailFrom) {
    const error = new Error("Resend email delivery is not configured");
    error.code = "EMAIL_SEND_ERROR";
    error.status = 500;
    throw error;
  }

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "nutrition-be/1.0",
      },
      body: JSON.stringify({
        from: env.mailFrom,
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (cause) {
    const error = new Error("Could not reach Resend");
    error.code = "EMAIL_SEND_ERROR";
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.message || "Resend rejected the email");
    error.code = "EMAIL_SEND_ERROR";
    error.status = 502;
    throw error;
  }

  return result;
};

export default sendEmail;
