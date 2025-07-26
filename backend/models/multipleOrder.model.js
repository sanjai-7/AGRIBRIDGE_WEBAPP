const mongoose = require("mongoose");

const multipleOrderSchema = new mongoose.Schema({
  buyerName: { type: String, required: true },
  buyerMobile: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerMobile: { type: String, required: true },
  crops: [
    {
      cropName: String,
      orderedKg: Number,
      totalPrice: Number,
      productionDate: Date,
      rating: { type: Number, min: 1, max: 5, default: null },
    },
  ],
  totalOrderAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["Cash on Delivery", "Net Banking", "UPI", "Credit/Debit Card"],
    required: true,
  },
  distance: { type: Number, required: true },
  deliveryDistance: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered","Completed","Cancelled","Returned"],
    default: "Ordered",
  },
  orderedAt: {
    type: Date,
    default: Date.now,
  },
  orderType: {
    type: String,
    enum: ["Single", "Multiple"],
    required: true,
  },
  assignedDeliveryPartner: { type: String, required: true },
  returnStatus: {
    type: String,
    enum: ["Not Requested", "Requested", "Returning", "Returned"],
    default: "Not Requested",
  },
  returnReason: {
    type: String,
  },
  
});

const MultipleOrder = mongoose.model("MultipleOrder", multipleOrderSchema);
module.exports = MultipleOrder;
