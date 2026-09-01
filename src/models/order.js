import mongoose from "mongoose";
import { ORDER_STATUS } from "#modules/subscriptions/subscriptions.constants.js";

// Order Model - Tracks all subscription orders and payment history
// This serves as an audit trail and enables subscription history tracking
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    // Stable entitlement snapshot. It remains valid if the plan is later
    // deactivated or its metadata changes.
    entitlement: {
      type: String,
      enum: ["assessment_results"],
    },
    // A one-time results purchase unlocks only the assessment result that was
    // current when the order was created.
    assessmentSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubmission",
    },
    assessmentResultVersion: {
      type: Number,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "EGP",
    },
    // Paymob integration fields
    paymobIntentionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymobOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymobTransactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // Payment status tracking
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: "pending",
      index: true,
    },
    // Additional payment details
    paymentMethod: {
      type: String,
      enum: ["card"],
    },
    failureReason: {
      type: String,
    },
    // Webhook callback tracking
    webhookReceived: {
      type: Boolean,
      default: false,
    },
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

// Compound index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, entitlement: 1, status: 1 });
orderSchema.index({
  user: 1,
  entitlement: 1,
  assessmentSubmission: 1,
  assessmentResultVersion: 1,
  status: 1,
});

orderSchema.methods.toJSON = function () {
  const order = this.toObject();

  // Remove sensitive fields
  delete order.__v;

  delete order.webhookData; // Do not expose raw webhook data in API responses

  // Rename fields
  order.id = order._id;
  delete order._id;

  // Include subscription details if populated
  if (order.subscription && typeof order.subscription === "object") {
    order.subscription = {
      id: order.subscription._id,
      name: order.subscription.name,
      displayName: order.subscription.displayName,
      price: order.subscription.price,
      durationInDays: order.subscription.durationInDays,
      description: order.subscription.description,
    };
  }

  return order;
};

export default mongoose.model("Order", orderSchema);
