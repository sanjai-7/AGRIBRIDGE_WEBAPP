const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  variety: { type: String, required: true },
  name: { type: String, required: true },
  totalQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  productionDate: { type: Date, required: true },
  bestBefore: { 
    type: Date, 
    required: true,
  },
  price: { type: Number, required: true },
  description: { type: String },
  farmerMobile: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerVillage: { type: String, required: true },
  farmerDistrict: { type: String, required: true },
  farmerState: { type: String, required: true },
  farmerPincode: { type: String, required: true },
  ratingCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
});

const Crop = mongoose.model("Crop", cropSchema);
module.exports = Crop;
