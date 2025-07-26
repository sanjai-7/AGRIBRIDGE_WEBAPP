const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
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
  productionDate: { type: Date, required: true }, // ✅ Added productionDate
  addedAT: { type: Date, default: Date.now },
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
