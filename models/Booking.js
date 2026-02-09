const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    totalHours: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    specialRequests: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


// Index for user's bookings
bookingSchema.index({ user: 1, createdAt: -1 });

// Index for hall's bookings (hall owner dashboard)
bookingSchema.index({ hall: 1, bookingDate: -1 });

// Index for status queries
bookingSchema.index({ status: 1 });

// Index for payment status
bookingSchema.index({ paymentStatus: 1 });

// Compound index for availability checks (prevents double booking)
bookingSchema.index({ hall: 1, bookingDate: 1, status: 1 });

// Index for date range queries
bookingSchema.index({ bookingDate: 1 });

// Compound index for hall owner to see bookings
bookingSchema.index({ hall: 1, status: 1, bookingDate: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
