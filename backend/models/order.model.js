const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyerName: { type: String, required: true },
  buyerMobile: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerMobile: { type: String, required: true },
  cropName: { type: String, required: true },
  quantityOrdered: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["Cash on Delivery", "Net Banking", "UPI", "Credit/Debit Card"],
    required: true,
  },
  distance: { type: Number, required: true },
  deliveryDistance: { type: Number, required: true },
  productionDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Ordered", "Packed", "Shipped", "Out of Delivery", "Delivered","Completed","Cancelled","Returned"],
    default: "Ordered",
  },
  orderedAt: { type: Date, default: Date.now },
  orderType: {
    type: String,
    enum: ["Single", "Multiple"],
    required: true,
  },
  rating: { type: Number, min: 1, max: 5, default: null },
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

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
