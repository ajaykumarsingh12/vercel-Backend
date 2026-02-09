const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["booking", "system", "payment", "unblock_request"],
    default: "system",
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can ref Booking, Hall, User, etc. optional
  },
  // Additional fields for unblock requests
  requestData: {
    userEmail: String,
    userName: String,
    userRole: String,
    requestedAt: Date,
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending"
    }
  }
});

// Index for user's notifications
NotificationSchema.index({ user: 1, createdAt: -1 });

// Index for unread notifications
NotificationSchema.index({ user: 1, isRead: 1 });

// Index for notification type
NotificationSchema.index({ type: 1 });

// Index for unblock requests
NotificationSchema.index({ type: 1, 'requestData.status': 1 });

// Compound index for user's unread notifications
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
