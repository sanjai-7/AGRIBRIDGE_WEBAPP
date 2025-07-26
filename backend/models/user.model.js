const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  role: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  receivedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  notifications: [
    {
      message: String,
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ["friend-request", "message", "friend-accepted", "friend-declined", "order", "friend-removed","rating"], default: "friend-request" },
      isRead: { type: Boolean, default: false },
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
