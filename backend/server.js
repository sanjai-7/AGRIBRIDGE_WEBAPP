const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const axios = require('axios');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "agribridge", // Ensures it connects to agribridge DB
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

let i = 0;
let j = 0;
let n=5;
for(i=0;i<n;i++){
  for(j=0;j<i;j++){
    console.log(j+1);
  }
  console.log("\n");
}

const SECRET_KEY = "SANJAI1234";

const User = require("./models/user.model");
const Crop = require("./models/crop.model");
const Chat = require("./models/chat.model");
const Order = require("./models/order.model");
const MultipleOrder = require("./models/multipleOrder.model");
const Cart = require("./models/cart.model");

// Store OTPs temporarily
const otpStore = {};

// Send OTP Route
app.post("/send-otp", (req, res) => {
  const { mobile } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[mobile] = otp;
  console.log(`OTP for ${mobile}: ${otp}`); // Replace with SMS service in production
  res.json({ message: "OTP sent successfully!" });
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { mobile, otp } = req.body;

  if (otpStore[mobile] && otpStore[mobile] === parseInt(otp)) {
    delete otpStore[mobile];
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Incorrect OTP!" });
  }
});

// Register Route (Handles all roles)
app.post("/register", async (req, res) => {

  const { name, mobile, otp, password, email, village, district, state, pincode, role, latitude, longitude  } = req.body;

  // OTP validation
  if (!otp || otpStore[mobile] !== parseInt(otp)) {
    return res.status(400).json({ message: "Invalid OTP!" });
  }

  try {
    // Check if the mobile number or name is already registered
    const existingUser = await User.findOne({ mobile });
    const existingUserName = await User.findOne({ name });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists! Try with another mobile number." });
    }
    if (existingUserName) {
      return res.status(400).json({ message: "User already exists! Try with another name." });
    }

    // Ensure location is provided if the user is a farmer
    if ((!latitude || !longitude)) {
      return res.status(400).json({ message: "Location (latitude & longitude) is required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({ name, mobile, password: hashedPassword, email, village, district, state, pincode, role, 
      friends: [],sentRequests: [],receivedRequests: [],notifications:[], location: { type: "Point", coordinates: [longitude, latitude] }});
    

    // Save to DB
    await newUser.save();
    delete otpStore[mobile]; // Remove OTP after successful registration

    res.json({ message: "Registration successful!" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Registration failed!", error: error.message });
  }
});

// Login Route with JWT
app.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: "Incorrect Mobile Number or Password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect Mobile Number or Password" });
    }

    // Generate JWT token
    const token = jwt.sign({ mobile: user.mobile }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      message: "Login successful",
      user: { name: user.name, mobile: user.mobile, role: user.role, village: user.village,
        district: user.district, state: user.state, pincode: user.pincode,}, token, // Send token to the frontend
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Middleware to verify token and extract mobile number
const authenticateUser = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.mobile = decoded.mobile;
    req.user = await User.findOne({ mobile: decoded.mobile }); // Attach user object
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Forgot Password - Check if User Exists and Send OTP
app.post("/forgot-password", async (req, res) => {
  const { mobile } = req.body;

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[mobile] = otp;

    console.log(`OTP for ${mobile}: ${otp}`); // Replace with SMS API
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate({ mobile }, { password: hashedPassword });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
});

// Fetch logged-in farmer profile
app.get("/farmer-profile", authenticateUser, async (req, res) => {
  try {
    const farmer = await User.findOne({ mobile: req.mobile }).select("-password -friends -friendRequests");

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    res.json(farmer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update farmer's profile
app.put("/update-farmer-profile", authenticateUser, async (req, res) => {
  try {
    const { name, email, village, district, state, pincode, latitude, longitude } = req.body;

    const updatedFarmer = await User.findOneAndUpdate(
      { mobile: req.mobile }, // Find by mobile
      { name, email, village, district, state, pincode, latitude, longitude }, // Update fields
      { new: true } // Return updated user
    );

    if (!updatedFarmer) {
      return res.status(404).json({ message: "Farmer not found!" });
    }

    res.json({ message: "Profile updated successfully!", user: updatedFarmer });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Get Buyer Profile
app.get("/buyer-profile", authenticateUser, async (req, res) => {
  try {
    const buyer = await User.findOne({ mobile: req.mobile });
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found!" });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update Buyer Profile
app.put("/update-buyer-profile", authenticateUser, async (req, res) => {
  try {
    const { name, email, village, district, state,pincode } = req.body;

    const updatedBuyer = await User.findOneAndUpdate(
      { mobile: req.mobile },
      { name, email, village, district, state,pincode },
      { new: true }
    );

    if (!updatedBuyer) {
      return res.status(404).json({ message: "Buyer not found!" });
    }

    res.json({ message: "Profile updated successfully!", user: updatedBuyer });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Fetch Admin Profile
app.get("/admin-profile", authenticateUser, async (req, res) => {
  try {
    const admin = await User.findOne({ mobile: req.mobile });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: "Error fetching admin profile" });
  }
});

// Update Admin Profile
app.put("/update-admin-profile", authenticateUser, async (req, res) => {
  try {
    const { name, email, village, district, state,pincode } = req.body;
    const admin = await User.findOne({ mobile: req.mobile });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.name = name;
    admin.email = email;
    admin.village = village;
    admin.district = district;
    admin.state = state;
    admin.pincode = pincode;

    await admin.save();
    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error updating admin profile" });
  }
});

// Search User
app.get("/search-user", authenticateUser, async (req, res) => {
  const { name } = req.query;
  const currentUser = await User.findOne({ mobile: req.user.mobile }).populate("friends");
  const user = await User.findOne({ name: new RegExp(`^${name}$`, "i") });

  if (user && currentUser.id !== user.id) {
    const isFriend = currentUser.friends.some((friend) => friend.id === user.id);
    const hasSentRequest = user.receivedRequests.includes(currentUser.id);

    res.json({
      success: true,
      user,
      isFriend,
      hasSentRequest,
    });
  } else {
    res.json({ success: false });
  }
});

app.post("/send-friend-request", authenticateUser, async (req, res) => {
  try {
    const { friendId } = req.body; // Friend's name

    // Find the logged-in user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the friend by name
    const friend = await User.findOne({ name: friendId });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Check if they are already friends
    if (currentUser.friends.includes(friend._id)) {
      return res.status(400).json({ message: "You are already friends!" });
    }

    // Check if request was already sent
    if (currentUser.sentRequests.includes(friend._id)) {
      return res.status(400).json({ message: "Friend request already sent!" });
    }

    // Add friend request
    currentUser.sentRequests.push(friend._id); // Add to sender's sentRequests
    friend.receivedRequests.push(currentUser._id); // Add to receiver's receivedRequests

    // Add a notification for the receiver
    friend.notifications.push({
      message: `${currentUser.name} sent you a friend request!`,
      type: "friend-request",
    });

    // Save both users
    await currentUser.save();
    await friend.save();

    res.status(200).json({ message: "Friend request sent successfully!" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/notifications", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("receivedRequests", "name _id"); // Fetch friend request details

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format friend request notifications (no timestamps yet, adding Date.now for consistency)
    const friendRequestNotifications = user.receivedRequests.map(request => ({
      message: `${request.name} sent you a friend request.`,
      senderId: request._id,
      type: "friend-request",
      isRead: false,
      timestamp: new Date() // Using current time since friend requests don’t have a timestamp field
    }));

    // Format general notifications with timestamps
    const generalNotifications = user.notifications.map((notif) => ({
      message: notif.message,
      type: notif.type,
      isRead: notif.isRead,
      timestamp: notif.timestamp
    }));

    // Merge and sort notifications by timestamp (latest first)
    const allNotifications = [...friendRequestNotifications, ...generalNotifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json(allNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/accept-friend-request", authenticateUser, async (req, res) => {
  try {
    const { senderId } = req.body;
    console.log("Sender ID received in backend:", senderId); // Debugging

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Accept friend request
    currentUser.friends.push(senderId);
    sender.friends.push(currentUser._id);

    // Remove from requests
    currentUser.receivedRequests = currentUser.receivedRequests.filter(id => id.toString() !== senderId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== currentUser._id.toString());

    // Remove friend request notification from receiver's list
    currentUser.notifications = currentUser.notifications.filter(notif => notif.senderId !== senderId);

    // ✅ Send notification to sender
    sender.notifications.push({
      message: `${currentUser.name} accepted your friend request.`,
      type: "friend-accepted",
      isRead: false
    });

    await currentUser.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/decline-friend-request", authenticateUser, async (req, res) => {
  try {
    const { senderId } = req.body;

    // Find the logged-in user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Remove the sender from receivedRequests
    currentUser.receivedRequests = currentUser.receivedRequests.filter(id => id.toString() !== senderId);

    // Remove the notification from receiver's list
    currentUser.notifications = currentUser.notifications.filter(notif => notif.type !== "friend-request" || notif.senderId !== senderId);

    // ✅ Send notification to sender
    sender.notifications.push({
      message: `${currentUser.name} declined your friend request.`,
      type: "friend-declined",
      isRead: false
    });

    await currentUser.save();
    await sender.save();

    res.status(200).json({ message: "Friend request declined!" });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/friends", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "name email mobile village district state role"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ friends: user.friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/get-chat", authenticateUser, async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user._id;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, friendId] },
    }).populate("messages.sender", "name");

    if (!chat) {
      chat = await Chat.create({ participants: [userId, friendId], messages: [] });
    }

    // Mark only the friend's messages as read
    chat.messages.forEach((msg) => {
      if (msg.sender.toString() === friendId.toString()) {
        msg.receiverRead = true; // Correct field name
      }
    });

    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error("Error getting chat:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/send-message", authenticateUser, async (req, res) => {
  const { friendId, text } = req.body;
  const userId = req.user._id;

  try {
    const chat = await Chat.findOneAndUpdate(
      { participants: { $all: [userId, friendId] } },
      { $push: { messages: { sender: userId, text, read: false } } },
      { new: true }
    ).populate("messages.sender", "name");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Fetch sender details
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Save a new notification for the receiver (PREPEND instead of append)
    const receiver = await User.findById(friendId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    receiver.notifications.unshift({ // 🆕 Add to the beginning
      message: `${sender.name} sent you a message.`,
      type: "message",
      isRead: false,
    });

    await receiver.save();

    res.json(chat);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/unread-messages", authenticateUser, async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({ participants: userId });

    let unreadCount = 0;
    chats.forEach((chat) => {
      unreadCount += chat.messages.filter(
        (msg) =>
          !msg.receiverRead && msg.sender.toString() !== userId.toString() // Only count messages sent by others
      ).length;
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/unread-messages-per-friend", authenticateUser, async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({ participants: userId });

    const unreadMessagesPerFriend = {};

    chats.forEach((chat) => {
      const friendId = chat.participants.find(
        (p) => p && p.toString() !== userId.toString() // Ensure 'p' is not null
      );

      if (friendId) {
        const unreadCount = chat.messages.filter(
          (msg) =>
            !msg.receiverRead && msg.sender.toString() !== userId.toString() // Count only their messages
        ).length;

        unreadMessagesPerFriend[friendId] = unreadCount;
      }
    });

    res.json({ unreadMessagesPerFriend });
  } catch (error) {
    console.error("Error fetching unread messages per friend:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/mark-as-read", authenticateUser, async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user._id;

  try {
    const chat = await Chat.findOne({ participants: { $all: [userId, friendId] } });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.messages.forEach((msg) => {
      if (msg.sender.toString() === friendId && !msg.receiverRead) {
        msg.receiverRead = true; // Only mark messages from the friend as read
      }
    });

    await chat.save();
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/mark-all-notifications-read", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update all notifications to read
    user.notifications.forEach((notification) => {
      notification.isRead = true;
    });

    await user.save();
    res.status(200).json({ message: "All notifications marked as read." });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Clear All Notifications for a User
app.delete("/clear-notifications", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Clear all notifications
    user.notifications = [];
    await user.save();

    res.status(200).json({ message: "All notifications cleared successfully" });

  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/getPrediction', async (req, res) => {
  console.log("Request received at /getPrediction:", req.body);

  const { cropName, msp, date } = req.body;

  try {
    const response = await axios.post('http://localhost:5001/predict', {
      cropName,
      msp,
      date,
    });

    console.log("Prediction response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching prediction:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/add-crop", async (req, res) => {
  try {
    const { variety, name, totalQuantity, productionDate, bestBefore, price, description, farmerMobile } = req.body;
    const farmer = await User.findOne({ mobile: farmerMobile, role: "farmer" });

    // Ensure Best Before date is not in the past
    if (new Date(bestBefore) < new Date()) {
      return res.status(400).json({ message: "Best before date must be today or in the future!" });
    }

    const newCrop = new Crop({
      variety,
      name,
      totalQuantity,
      availableQuantity: totalQuantity,
      productionDate,
      bestBefore,
      price,
      description,
      farmerMobile: farmer.mobile,
      farmerName: farmer.name,
      farmerVillage: farmer.village,
      farmerDistrict: farmer.district,
      farmerState: farmer.state,
      farmerPincode: farmer.pincode,
    });

    await newCrop.save();
    res.status(201).json({ message: "Crop added successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/farmer-crops", authenticateUser, async (req, res) => {
  try {
    const farmerName = req.user.name; // Get farmer's name from authenticated user
    const crops = await Crop.find({ farmerName });

    if (!crops.length) {
      return res.status(404).json({ message: "No crops found for this farmer" });
    }

    res.json(crops);
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Haversine formula to calculate distance
const calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Crop search route with distance calculation for both admin and buyers
app.get("/api/crops", async (req, res) => {
  try {
    const { query, userName } = req.query;

    if (!query || !userName) {
      return res.status(400).json({ error: "Query and userName are required!" });
    }

    // Find user (either admin or buyer) by name
    const user = await User.findOne({ name: userName });
    if (!user || !user.location || !user.location.coordinates) {
      return res.status(404).json({ error: "User not found or location not set!" });
    }

    const userLocation = user.location.coordinates; // [longitude, latitude]

    // Find crops matching variety or name with available quantity > 0
    const crops = await Crop.find({
      $or: [{ variety: new RegExp(query, "i") }, { name: new RegExp(query, "i") }],
      availableQuantity: { $gt: 0 },
    });

    // Get farmer details for the crops
    const farmerMobiles = crops.map((crop) => crop.farmerMobile);
    const farmers = await User.find({ mobile: { $in: farmerMobiles } });

    

    // Enrich crops with distance info
    const enrichedCrops = crops.map((crop) => {
      const farmer = farmers.find((f) => f.mobile === crop.farmerMobile);
      const distance = farmer && farmer.location
        ? calculateDistance(userLocation, farmer.location.coordinates)
        : null;

      return {
        ...crop._doc,
        farmerDistance: distance ? distance.toFixed(2) : "N/A",
        farmerName: farmer ? farmer.name : "Unknown",
        farmerMobile: crop.farmerMobile,
      };
    });

    // Sort by distance (nearest first)
    const sortedCrops = enrichedCrops.sort((a, b) => a.farmerDistance - b.farmerDistance);

    res.json(sortedCrops);
  } catch (err) {
    console.error("Error fetching crops:", err);
    res.status(500).json({ error: "Server error!" });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const { cropName, orderedKg, totalPrice, paymentMethod, buyerName, buyerMobile, farmerName, farmerMobile, productionDate, orderType } = req.body;

    if (!cropName || !orderedKg || !totalPrice || !paymentMethod || !buyerName || !buyerMobile || !farmerName || !farmerMobile) {
      return res.status(400).json({ error: 'All fields are required!' });
    }

    const crop = await Crop.findOne({ name: cropName, farmerMobile, productionDate });
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found!' });
    }

    if (typeof crop.availableQuantity !== 'number' || crop.availableQuantity < 0) {
      return res.status(400).json({ error: 'Invalid crop quantity!' });
    }

    if (orderedKg > crop.availableQuantity) {
      return res.status(400).json({ error: 'Insufficient crop quantity!' });
    }

    const buyer = await User.findOne({ name: buyerName });
    const farmer = await User.findOne({ name: farmerName });

    if (!buyer || !farmer || !buyer.location || !farmer.location) {
      return res.status(404).json({ error: 'Buyer or farmer location not found!' });
    }

    // Calculate farmer to buyer distance
    const buyerDistance = calculateDistance(buyer.location.coordinates, farmer.location.coordinates);

    // Find all delivery partners
    const deliveryPartners = await User.find({ role: 'deliveryPartner', location: { $exists: true } });

    let bestPartner = null;
    let minDeliveryDistance = Infinity;

    // Loop through all delivery partners to find the one with shortest total delivery distance
    deliveryPartners.forEach(partner => {
      if (!partner.location || !partner.location.coordinates) return;

      const dpToFarmer = calculateDistance(partner.location.coordinates, farmer.location.coordinates);
      const farmerToBuyer = buyerDistance;
      const buyerToHome = calculateDistance(partner.location.coordinates, buyer.location.coordinates);

      const totalDistance = dpToFarmer + farmerToBuyer + buyerToHome;

      if (totalDistance < minDeliveryDistance) {
        minDeliveryDistance = totalDistance;
        bestPartner = partner;
      }
    });

    const deliveryDistance = minDeliveryDistance.toFixed(2);

    const newOrder = new Order({
      buyerName,
      buyerMobile,
      farmerName,
      farmerMobile,
      cropName,
      quantityOrdered: orderedKg,
      distance: buyerDistance.toFixed(2),
      deliveryDistance,
      status: 'Ordered',
      totalPrice: parseFloat(totalPrice),
      paymentMethod,
      productionDate,
      orderType,
      rating: null,
      assignedDeliveryPartner: bestPartner ? bestPartner.name : null, // Optional: store assigned partner
    });

    await newOrder.save();

    crop.availableQuantity = Math.max(crop.availableQuantity - orderedKg, 0);
    await Crop.updateOne(
      { _id: crop._id },
      { $set: { availableQuantity: crop.availableQuantity } },
      { runValidators: false }
    );

    // Notify farmer
    const farmerNotification = `${buyerName} ordered ${orderedKg} kg of ${cropName} via ${paymentMethod}. Total: ₹${totalPrice}`;
    farmer.notifications.push({
      message: farmerNotification,
      type: 'order',
      isRead: false,
    });
    await farmer.save();

    // Notify selected delivery partner
    if (bestPartner) {
      const dpNotification = `New delivery request: ${orderedKg} kg of ${cropName} from ${farmerName} to ${buyerName}. Total delivery distance: ${deliveryDistance} km.`;
      bestPartner.notifications.push({
        message: dpNotification,
        type: 'order',
        isRead: false,
      });
      await bestPartner.save();
    }

    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });

  } catch (err) {
    console.error('Error processing order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users for admin (excluding the current admin)
app.get("/admin/users", authenticateUser, async (req, res) => {
  try {
    const currentAdminMobile = req.user.mobile; // Get admin's mobile from token

    // Fetch all users except the current admin
    const users = await User.find(
      { mobile: { $ne: currentAdminMobile } }, 
      "name role mobile village district"
    );

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Count farmers and buyers
    const farmersCount = users.filter(user => user.role === "farmer").length;
    const buyersCount = users.filter(user => user.role === "buyer").length;

    res.status(200).json({ users, farmersCount, buyersCount });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all admins
app.get("/admins", authenticateUser, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, "name mobile");
    res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/orders", authenticateUser, async (req, res) => {
  try {
    const orders = await Order.find().select(
      "buyerName buyerMobile farmerName farmerMobile cropName quantityOrdered distance status orderType orderedAt returnStatus"
    ).sort({ orderedAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/multiCropOrders", authenticateUser, async (req, res) => {
  try {
    const multiCropOrders = await MultipleOrder.find().select(
      "buyerName buyerMobile farmerName farmerMobile crops totalOrderAmount paymentMethod distance status orderType orderedAt returnStatus"
    ).sort({ orderedAt: -1 });
    res.status(200).json({ multiCropOrders });
  } catch (error) {
    console.error("Error fetching multiple crop orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/activeListings", authenticateUser, async (req, res) => {
  try {
    const activeListings = await Crop.countDocuments();
    const crops = await Crop.find().select("name variety availableQuantity farmerName farmerMobile price bestBefore productionDate ratingCount averageRating");

    res.status(200).json({ activeListings, crops });
  } catch (error) {
    console.error("Error fetching active listings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/buyer/orders", authenticateUser, async (req, res) => {
  try {
    const buyerMobile = req.user.mobile; // Ensure req.user contains the correct buyer info
    if (!buyerMobile) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({ buyerMobile }).select(
      "cropName buyerMobile farmerMobile farmerName quantityOrdered totalPrice status orderType orderedAt rating"
    );

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/farmer-orders', authenticateUser, async (req, res) => {
  try {
    const farmerMobile = req.user.mobile;

    const orders = await Order.find({ farmerMobile });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching farmer orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/update-order-status', async (req, res) => {
  console.log('Received data:', req.body);

  try {
    const { cropName, buyerMobile, farmerMobile, buyerName, orderedAt, status } = req.body;

    if (!cropName || !buyerMobile || !farmerMobile || !orderedAt || !status) {
      return res.status(400).json({ message: 'Missing required fields!' });
    }

    const farmer = await User.findOne({ mobile: farmerMobile });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found!' });
    }

    // Update the order status
    const order = await Order.findOneAndUpdate(
      { cropName, buyerMobile, farmerMobile, orderedAt },
      { status },
      { new: true }
    );

    if (!order) {
      console.log('Order not found with:', { cropName, buyerMobile, farmerMobile, orderedAt });
      return res.status(404).json({ message: 'Order not found!' });
    }

    // Send notification to the assigned delivery partner if status is "Shipped"
    if (status === "Shipped") {
      const deliveryPartnerName = order.assignedDeliveryPartner;

      if (deliveryPartnerName) {
        const deliveryPartner = await User.findOne({ name: deliveryPartnerName });

        if (deliveryPartner) {
          const dpNotification = {
            message: `Order for ${cropName} by ${buyerName} has been shipped by ${farmer.name}. Please prepare for pickup.`,
            type: "order",
            isRead: false,
            timestamp: new Date(),
          };

          deliveryPartner.notifications.push(dpNotification);
          await deliveryPartner.save();

          console.log(`✅ Notification sent to delivery partner: ${deliveryPartnerName}`);
        } else {
          console.warn(`⚠️ Delivery partner (${deliveryPartnerName}) not found.`);
        }
      } else {
        console.warn("⚠️ No delivery partner assigned to this order.");
      }
    }

    res.json({ message: `Order status updated to ${status}!`, order });

  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/buyer/confirm-delivery', authenticateUser, async (req, res) => {
  try {
    const { cropName, buyerName, buyerMobile, farmerMobile, orderedAt, status, message } = req.body;

    if (!cropName || !buyerMobile || !farmerMobile || !orderedAt || !status) {
      return res.status(400).json({ message: 'Missing required fields!' });
    }

    // First, find the order (to access assignedDeliveryPartner)
    const order = await Order.findOne({ cropName, buyerMobile, farmerMobile, orderedAt });
    const buyer = await User.findOne({ mobile: buyerMobile });


    if (!order) {
      console.log('Order not found for confirmation:', { cropName, buyerMobile, farmerMobile, orderedAt });
      return res.status(404).json({ message: 'Order not found!' });
    }

    // 📨 Notify the delivery partner if assigned
    const deliveryPartnerName = order.assignedDeliveryPartner;
    if (deliveryPartnerName) {
      const deliveryPartner = await User.findOne({ name: deliveryPartnerName, role: 'deliveryPartner' });

      if (deliveryPartner) {
        const dpNotification = {
          message: message || `${buyer.name} reported an issue with their order of ${cropName}.`,
          type: 'order',
          timestamp: new Date(),
          isRead: false,
        };

        deliveryPartner.notifications.push(dpNotification);
        await deliveryPartner.save();

        console.log(`✅ Notification sent to delivery partner: ${deliveryPartnerName}`);
      } else {
        console.warn(`⚠️ Delivery partner '${deliveryPartnerName}' not found.`);
      }
    }

    // ✅ Update order status now
    const updatedOrder = await Order.findOneAndUpdate(
      { cropName, buyerMobile, farmerMobile, orderedAt },
      { status },
      { new: true }
    );

    // Notify the farmer
    const farmer = await User.findOneAndUpdate(
      { mobile: farmerMobile },
      {
        $push: {
          notifications: {
            message: message || `${buyerName} reported an issue with their order of ${cropName}.`,
            type: 'order',
            timestamp: new Date(),
            isRead: false
          },
        },
      }
    );

    if (!farmer) {
      console.warn('Farmer not found for notification:', farmerMobile);
    }


    res.status(200).json({ message: `Order status updated to ${status}!`, order: updatedOrder });
  } catch (err) {
    console.error('Error confirming delivery:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post("/remove-friend", authenticateUser, async (req, res) => {
  try {
    const { friendName } = req.body;

    // Find both users by name
    const currentUser = await User.findOne({ name: req.user.name });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const friend = await User.findOne({ name: friendName });
    if (!friend) return res.status(404).json({ message: "Friend not found" });

    // Remove each other by ObjectId
    await User.updateOne(
      { _id: currentUser._id },
      { $pull: { friends: friend._id } }
    );

    await User.updateOne(
      { _id: friend._id },
      { $pull: { friends: currentUser._id } }
    );

    // Mark unread messages as "read" in the chat between the two users
    await Chat.updateMany(
      { participants: { $all: [currentUser._id, friend._id] } },
      { $set: { "messages.$[].receiverRead": true } } // Mark all messages as read
    );

    // Add a notification for the friend
    friend.notifications.push({
      message: `${currentUser.name} has removed you from their friends list.`,
      type: "friend-removed",
      isRead: false,
    });

    await friend.save();

    res.status(200).json({ message: "Friend removed successfully!" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/cancel-friend-request", authenticateUser, async (req, res) => {
  try {
    const { friendId } = req.body; // Friend's name, not ObjectId

    // Find the logged-in user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the friend by name
    const friend = await User.findOne({ name: friendId });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Remove friendId (friend's ObjectId) from current user's sentRequests
    currentUser.sentRequests = currentUser.sentRequests.filter(
      (id) => id.toString() !== friend._id.toString()
    );

    // Remove current user's ID from friend's receivedRequests
    friend.receivedRequests = friend.receivedRequests.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    // Remove the notification from friend's notifications
    friend.notifications = friend.notifications.filter(
      (notif) =>
        notif.type !== "friend-request" ||
        notif.message !== `${currentUser.name} sent you a friend request!`
    );

    // Save changes to both users
    await currentUser.save();
    await friend.save();

    res.status(200).json({ message: "Friend request canceled successfully!" });
  } catch (error) {
    console.error("Error canceling friend request:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/update-crop", async (req, res) => {
  try {
    const { name, farmerName, productionDate, price, updatedPrice, updatedQuantity } = req.body;

    // Find and update the crop
    const updatedCrop = await Crop.findOneAndUpdate(
      { name, farmerName, productionDate, price },
      { $set: { price: updatedPrice, availableQuantity: updatedQuantity } },
      { new: true }
    );

    if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found!" });
    }

    res.status(200).json({ message: "Crop updated successfully!", crop: updatedCrop });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.delete("/delete-crop", async (req, res) => {
  try {
    const { name, farmerName, productionDate, price } = req.body;

    const deletedCrop = await Crop.findOneAndDelete({
      name,
      farmerName,
      productionDate,
      price,
    });

    if (!deletedCrop) {
      return res.status(404).json({ message: "Crop not found!" });
    }

    res.status(200).json({ message: "Crop deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/api/friend-crops", authenticateUser, async (req, res) => {
  try {
    const buyerId = req.user._id;
    const user = await User.findById(buyerId).populate("friends");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const farmerFriends = user.friends.map(friend => friend.name);

    const crops = await Crop.find({ farmerName: { $in: farmerFriends } }).sort({ createdAt: -1 });

    // 👉 Fetch all crops
    const allCrops = await Crop.find().sort({ createdAt: -1 });

    res.json({crops,allCrops});
  } catch (error) {
    console.error("Error fetching friend's crops:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//   try {
//     const { query, userName, farmerName } = req.query;

//     if (farmerName) {
//       // Fetch crops uploaded by the specific farmer
//       const farmerCrops = await Crop.find({
//         farmerName: farmerName,
//         availableQuantity: { $gt: 0 }, // Only fetch crops with available stock
//       });

//       return res.json(farmerCrops);
//     }

//     if (!query || !userName) {
//       return res.status(400).json({ error: "Query and userName are required!" });
//     }

//     // Find user (either admin or buyer) by name
//     const user = await User.findOne({ name: userName });
//     if (!user || !user.location || !user.location.coordinates) {
//       return res.status(404).json({ error: "User not found or location not set!" });
//     }

//     const userLocation = user.location.coordinates; // [longitude, latitude]

//     // Find crops matching variety or name with available quantity > 0
//     const crops = await Crop.find({
//       $or: [{ variety: new RegExp(query, "i") }, { name: new RegExp(query, "i") }],
//       availableQuantity: { $gt: 0 },
//     });

//     // Get farmer details for the crops
//     const farmerMobiles = crops.map((crop) => crop.farmerMobile);
//     const farmers = await User.find({ mobile: { $in: farmerMobiles } });

//     // Enrich crops with distance info
//     const enrichedCrops = crops.map((crop) => {
//       const farmer = farmers.find((f) => f.mobile === crop.farmerMobile);
//       const distance =
//         farmer && farmer.location
//           ? calculateDistance(userLocation, farmer.location.coordinates)
//           : null;

//       return {
//         ...crop._doc,
//         farmerDistance: distance ? distance.toFixed(2) : "N/A",
//         farmerName: farmer ? farmer.name : "Unknown",
//         farmerMobile: crop.farmerMobile,
//       };
//     });

//     // Sort by distance (nearest first)
//     const sortedCrops = enrichedCrops.sort((a, b) => a.farmerDistance - b.farmerDistance);

//     res.json(sortedCrops);
//   } catch (err) {
//     console.error("Error fetching crops:", err);
//     res.status(500).json({ error: "Server error!" });
//   }
// });

// 🛒 Add item to cart
app.post("/api/add-to-cart", async (req, res) => {
  try {
    const { buyerName, buyerMobile, farmerName, farmerMobile, cropName, quantityOrdered, totalPrice, paymentMethod, productionDate } = req.body;
    console.log("Received data:", req.body);
    // Create a new cart entry

    // Find buyer and farmer by name
    const buyer = await User.findOne({ name: buyerName });
    const farmer = await User.findOne({ name: farmerName });

    if (!buyer || !farmer || !buyer.location || !farmer.location) {
      return res.status(404).json({ error: 'Buyer or farmer location not found!' });
    }

    // Calculate distance between buyer and farmer
    const distance = calculateDistance(buyer.location.coordinates, farmer.location.coordinates);
    
    const newCartItem = new Cart({
      buyerName,
      buyerMobile,
      farmerName,
      farmerMobile,
      cropName,
      quantityOrdered,
      totalPrice,
      paymentMethod,
      distance,
      productionDate,
    });

    await newCartItem.save();
    res.status(200).json({ message: "Added to cart successfully!" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🛒 Get all cart items
app.get("/api/cart", async (req, res) => {
  try {
    const { buyerMobile } = req.query; // Get from query params

    if (!buyerMobile) {
      return res.status(400).json({ message: "Buyer mobile number is required" });
    }

    const cartItems = await Cart.find({ buyerMobile });

    if (!cartItems) {
      console.log("NOTHIN HERE!");
      return res.status(404).json({ message: "No cart items found for this buyer." });
    }

    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/multipleOrder", async (req, res) => {
  try {
    console.log("Received Order Data:", req.body);

    const { crops, buyerName, buyerMobile, farmerName, farmerMobile, orderType, totalOrderAmount, paymentMethod } = req.body;

    if (!crops || crops.length === 0) {
      return res.status(400).json({ error: "Crops array is required." });
    }

    if (!buyerName || !buyerMobile || !farmerName || !farmerMobile || !orderType || !totalOrderAmount || !paymentMethod) {
      return res.status(400).json({ error: "Missing required order fields." });
    }

    // Find buyer and farmer
    const buyer = await User.findOne({ name: buyerName });
    const farmer = await User.findOne({ name: farmerName });

    if (!buyer || !farmer || !buyer.location || !farmer.location) {
      return res.status(404).json({ error: "Buyer or farmer location not found!" });
    }

    // Ensure all crops belong to the same farmer
    const farmerNames = new Set(crops.map((crop) => crop.farmerName));
    if (farmerNames.size > 1) {
      return res.status(400).json({ error: "All crops in a multiple order must belong to the same farmer." });
    }

    let notificationMessage = `${buyerName} ordered:\n`;
    let successfullyProcessedCrops = [];
    let missingCrops = [];

    for (const crop of crops) {
      const cropRecord = await Crop.findOne({ name: crop.cropName, farmerMobile, productionDate: crop.productionDate });

      if (!cropRecord) {
        console.warn(`🚨 Crop not found: ${crop.cropName}`);
        missingCrops.push(crop.cropName);
        continue;
      }

      if (cropRecord.availableQuantity < crop.orderedKg) {
        console.warn(`⚠️ Insufficient quantity for ${crop.cropName}`);
        return res.status(400).json({ error: `Insufficient quantity for ${crop.cropName}` });
      }

      cropRecord.availableQuantity -= crop.orderedKg;
      await cropRecord.save();

      successfullyProcessedCrops.push({
        cropName: crop.cropName,
        orderedKg: crop.orderedKg,
        totalPrice: crop.totalPrice,
        productionDate: crop.productionDate,
      });

      notificationMessage += `- ${crop.orderedKg} kg of ${crop.cropName} (₹${crop.totalPrice})\n`;
    }

    // Calculate buyer-to-farmer distance
    const buyerDistance = calculateDistance(buyer.location.coordinates, farmer.location.coordinates);

    if (successfullyProcessedCrops.length === 0) {
      return res.status(400).json({ error: "No crops were processed. Please check availability." });
    }

    // Find the best delivery partner
    const deliveryPartners = await User.find({ role: "deliveryPartner", location: { $exists: true } });

    let bestPartner = null;
    let minDeliveryDistance = Infinity;

    deliveryPartners.forEach((partner) => {
      if (!partner.location || !partner.location.coordinates) return;

      const dpToFarmer = calculateDistance(partner.location.coordinates, farmer.location.coordinates);
      const totalDistance = dpToFarmer + buyerDistance;

      if (totalDistance < minDeliveryDistance) {
        minDeliveryDistance = totalDistance;
        bestPartner = partner;
      }
    });

    const deliveryDistance = minDeliveryDistance.toFixed(2);

    // Save the order
    const newOrder = new MultipleOrder({
      crops: successfullyProcessedCrops,
      buyerName,
      buyerMobile,
      farmerName,
      farmerMobile,
      orderType,
      totalOrderAmount,
      paymentMethod,
      distance: buyerDistance.toFixed(2),
      deliveryDistance,
      status: "Ordered",
      assignedDeliveryPartner: bestPartner ? bestPartner.name : null,
    });

    await newOrder.save();

    notificationMessage += `Total Amount: ₹${totalOrderAmount}\n`;
    notificationMessage += `Payment: ${paymentMethod}`;

    console.log("✅ Order saved successfully with total:", totalOrderAmount);

    // Notify the farmer
    farmer.notifications.push({
      message: notificationMessage,
      type: "order",
      isRead: false,
    });
    await farmer.save();
    console.log(`✅ Notification sent to ${farmerName}`);

    // Notify the delivery partner
    if (bestPartner) {
      const dpNotification = `New delivery request: ${successfullyProcessedCrops.length} crops from ${farmerName} to ${buyerName}. Total delivery distance: ${deliveryDistance} km.`;
      bestPartner.notifications.push({
        message: dpNotification,
        type: "order",
        isRead: false,
      });
      await bestPartner.save();
      console.log(`✅ Notification sent to Delivery Partner: ${bestPartner.name}`);
    }

    if (missingCrops.length > 0) {
      return res.status(207).json({
        message: `Order placed successfully, but the following crops were not found: ${missingCrops.join(", ")}`,
        order: newOrder,
      });
    }

    res.status(201).json({ message: "Order placed successfully!", order: newOrder });

  } catch (error) {
    console.error("🔥 Error placing order:", error);
    res.status(500).json({ error: "Failed to place order.", details: error.message });
  }
});

app.post("/api/removeCartItem", async (req, res) => {
  try {
      const { cropName, farmerName, buyerName, productionDate, addedAt, distance } = req.body;

      const deletedItem = await Cart.findOneAndDelete({
          cropName,
          farmerName,
          buyerName,
          productionDate,
          addedAt,
          distance,
      });

      if (!deletedItem) {
          return res.status(404).json({ error: "Cart item not found" });
      }

      res.json({ message: "Cart item removed successfully" });
  } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/buyer/multiple-orders", authenticateUser, async (req, res) => {
  try {
    const buyerMobile = req.user.mobile;
    if (!buyerMobile) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const multipleOrders = await MultipleOrder.find({ buyerMobile }).select(
      "_id crops buyerName buyerMobile farmerName farmerMobile orderedAt orderType totalOrderAmount status"
    );

    res.status(200).json({ multipleOrders }); // ✅ Send correct key
  } catch (error) {
    console.error("Error fetching multiple buyer orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/buyer/confirm-multiple-delivery", authenticateUser, async (req, res) => {
  try {
    const { orderId, status, message } = req.body;

    // 🔍 First, find the order using orderId
    const order = await MultipleOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 📦 Extract delivery partner info
    const deliveryPartnerName = order.assignedDeliveryPartner;
    if (deliveryPartnerName) {
      const deliveryPartner = await User.findOne({ name: deliveryPartnerName, role: 'deliveryPartner' });

      if (deliveryPartner) {
        // 📨 Send notification
        const dpNotification = {
          message:  message || `Order by ${order.buyerName} has been marked as ${status}`,
          type: "order",
          isRead: false,
          timestamp: new Date(),
        };

        deliveryPartner.notifications.push(dpNotification);
        await deliveryPartner.save();

        console.log(`✅ Notification sent to delivery partner: ${deliveryPartnerName}`);
      } else {
        console.warn(`⚠️ Delivery partner '${deliveryPartnerName}' not found.`);
      }
    } else {
      console.warn("⚠️ No delivery partner assigned to this order.");
    }

    // ✅ Now update the order
    const updatedOrder = await MultipleOrder.findByIdAndUpdate(
      orderId,
      { status, message },
      { new: true }
    );

    // Notify the farmer
    const farmer = await User.findOneAndUpdate(
      { mobile: order.farmerMobile },
      {
        $push: {
          notifications: {
            message: message || `${buyerName} reported an issue with their order of ${cropName}.`,
            type: 'order',
            timestamp: new Date(),
            isRead: false
          },
        },
      }
    );
    if (!farmer) {
      console.warn('Farmer not found for notification:', farmerMobile);
    }

    res.status(200).json({
      message: "Order status updated successfully.",
      updatedOrder,
    });
  } catch (error) {
    console.error("Error confirming multiple order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/farmer-multiple-orders", authenticateUser, async (req, res) => {
  try {
    const farmerMobile = req.user.mobile;

    const multipleOrders = await MultipleOrder.find({ farmerMobile });
    res.status(200).json(multipleOrders);
  } catch (err) {
    console.error("Error fetching multiple orders:", err);
    res.status(500).json({ error: "Failed to fetch multiple orders" });
  }
});

app.post("/api/update-multiple-order-status", authenticateUser, async (req, res) => {
  console.log("Received data:", req.body); // Log incoming data

  try {
    const { buyerMobile, farmerMobile, buyerName, orderedAt, status } = req.body;

    if (!buyerMobile || !farmerMobile || !orderedAt || !status) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const farmer = await User.findOne({mobile: farmerMobile});

    // Update the multiple order status
    const updatedOrder = await MultipleOrder.findOneAndUpdate(
      { buyerMobile, farmerMobile, buyerName, orderedAt },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      console.log("Order not found with:", { buyerMobile, farmerMobile, buyerName, orderedAt });
      return res.status(404).json({ message: "Order not found!" });
    }

    
    // Send notification to the assigned delivery partner if status is "Shipped"
    if (status === "Shipped") {
      const deliveryPartnerName = updatedOrder.assignedDeliveryPartner;

      if (deliveryPartnerName) {
        const deliveryPartner = await User.findOne({ name: deliveryPartnerName });

        if (deliveryPartner) {
          const dpNotification = {
            message: `Multiple order by ${buyerName} has been shipped by ${farmer.name}. Please prepare for pickup.`,
            type: "order",
            isRead: false,
            timestamp: new Date(),
          };

          deliveryPartner.notifications.push(dpNotification);
          await deliveryPartner.save();

          console.log(`✅ Notification sent to delivery partner: ${deliveryPartnerName}`);
        } else {
          console.warn(`⚠️ Delivery partner (${deliveryPartnerName}) not found.`);
        }
      } else {
        console.warn("⚠️ No delivery partner assigned to this order.");
      }
    }

    res.json({ message: `Order status updated to ${status}!`, updatedOrder });
  } catch (err) {
    console.error("Error updating multiple order status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/rate-order", authenticateUser, async (req, res) => {
  try {
    const { orderId, rating } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5!" });
    }

    

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found!" });
    }
    // Previous rating (if exists)
    const previousRating = order.rating;

    // Update order rating
    order.rating = rating;
    await order.save();

    // Find the crop and update its rating
    const crop = await Crop.findOne({ name: order.cropName, farmerMobile: order.farmerMobile, productionDate: order.productionDate });
    if (!crop) {
      return res.status(404).json({ message: "Crop not found!" });
    }

    if (crop) {
      // Ensure default values to prevent NaN errors
      if (!crop.averageRating) crop.averageRating = 0;
      if (!crop.ratingCount) crop.ratingCount = 0;
    
      if (previousRating) {
        // ✅ If user is updating their rating, adjust the total rating sum but keep ratingCount the same
        const totalRatingSum = crop.averageRating * crop.ratingCount - previousRating + rating;
        crop.averageRating = crop.ratingCount > 0 ? totalRatingSum / crop.ratingCount : rating; // Prevent NaN
      } else {
        // ✅ If it's a new rating, increase the total count
        crop.ratingCount += 1;
        crop.averageRating = ((crop.averageRating * (crop.ratingCount - 1)) + rating) / crop.ratingCount;
      }
    
      await crop.save();
    }
    

    // Notify the farmer
    const farmer = await User.findOne({ mobile: order.farmerMobile, role: "farmer" });
    if (farmer) {
      await User.findByIdAndUpdate(farmer._id, {
        $push: {
          notifications: {
            message: `Your crop ${order.cropName} received a ${rating}-star rating!`,
            type: "rating",
            isRead: false,
            timestamp: new Date(),
          },
        },
      });
    }

    res.json({ message: "Rating submitted successfully!", updatedCrop: crop });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/rate-multiple-order", authenticateUser, async (req, res) => {
  try {
    const { orderId, ratings } = req.body; // Array of { cropName, rating, productionDate }

    if (!orderId || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ message: "Invalid request data!" });
    }

    // Find the order
    const order = await MultipleOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found!" });
    }

    let updatedCrops = [];

    // Iterate over each crop rating
    for (let { cropName, rating, productionDate } of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5!" });
      }

      // Find the crop inside the order
      const cropInOrder = order.crops.find(
        (c) => c.cropName === cropName && c.productionDate.toISOString() === new Date(productionDate).toISOString()
      );

      if (!cropInOrder) continue; // If crop not found, skip

      // Store previous rating before updating
      const previousRating = cropInOrder.rating;

      // Update the crop rating in the order
      cropInOrder.rating = rating;

      // Find the corresponding crop in the `Crop` collection
      const crop = await Crop.findOne({ name: cropName, farmerMobile: order.farmerMobile, productionDate });

      if (crop) {
        // Ensure default values
        if (!crop.averageRating) crop.averageRating = 0;
        if (!crop.ratingCount) crop.ratingCount = 0;

        if (previousRating) {
          // ✅ If user is updating their rating, adjust the total rating sum but keep ratingCount the same
          const totalRatingSum = crop.averageRating * crop.ratingCount - previousRating + rating;
          crop.averageRating = crop.ratingCount > 0 ? totalRatingSum / crop.ratingCount : rating;
        } else {
          // ✅ If it's a new rating, increase the total count
          crop.ratingCount += 1;
          crop.averageRating = ((crop.averageRating * (crop.ratingCount - 1)) + rating) / crop.ratingCount;
        }

        await crop.save();
        updatedCrops.push(crop);
      }

      // Notify the farmer about the rating update
      const farmer = await User.findOne({ mobile: order.farmerMobile, role: "farmer" });
      if (farmer) {
        await User.findByIdAndUpdate(farmer._id, {
          $push: {
            notifications: {
              message: `Your crop ${cropName} received a ${rating}-star rating!`,
              type: "rating",
              isRead: false,
              timestamp: new Date(),
            },
          },
        });
      }
    }

    // Save the updated order with new ratings
    await order.save();

    res.json({ message: "Ratings submitted successfully!", updatedCrops });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/cancel-order', async (req, res) => {
  const { buyerMobile, farmerMobile, buyerName, orderedAt, orderType, role } = req.body;

  try {
    let order;

    // 1️⃣ Find the order
    if (orderType === 'Single') {
      order = await Order.findOne({ buyerMobile, farmerMobile, orderedAt, orderType });
    } else if (orderType === 'Multiple') {
      order = await MultipleOrder.findOne({ buyerMobile, farmerMobile, orderedAt, orderType });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 2️⃣ Update availableQuantity back
    if (orderType === 'Single') {
      await Crop.updateOne(
        { name: order.cropName, farmerMobile: order.farmerMobile, productionDate: order.productionDate },
        { $inc: { availableQuantity: order.quantityOrdered } }
      );
      await Order.updateOne(
        { cropName: order.cropName, buyerMobile: order.buyerMobile, farmerMobile: order.farmerMobile, orderedAt: order.orderedAt },
        { $set: { status: "Cancelled" } }
      );
    } else if (orderType === 'Multiple' && order.crops && Array.isArray(order.crops)) {
      for (const crop of order.crops) {
        await Crop.updateOne(
          { name: crop.cropName, farmerMobile: order.farmerMobile, productionDate: crop.productionDate },
          { $inc: { availableQuantity: crop.orderedKg } }
        );
      }
      await MultipleOrder.updateOne(
        { buyerMobile: order.buyerMobile, farmerMobile: order.farmerMobile, orderedAt: order.orderedAt },
        { $set: { status: "Cancelled" } }
      );
    }

    // 3️⃣ Prepare users
    const buyer = await User.findOne({ mobile: buyerMobile });
    const farmer = await User.findOne({ mobile: farmerMobile });

    const notifications = [];

    // 4️⃣ Build notification based on role
    if (role === 'farmer') {
      // Farmer cancelled → notify buyer + delivery partner
      if (buyer) {
        buyer.notifications.push({
          message: orderType === 'Single'
            ? `Your order for ${order.cropName} was cancelled by the ${farmer.name}.`
            : `Your multi-crop order was cancelled by the ${farmer.name}.`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await buyer.save();
      }

      if (order.assignedDeliveryPartner) {
        const deliveryPartner = await User.findOne({ name: order.assignedDeliveryPartner });
        if (deliveryPartner) {
          deliveryPartner.notifications.push({
            message: orderType === 'Single'
              ? `Order for ${order.cropName} was cancelled by the ${farmer.name}.`
              : `Multi-crop order was cancelled by the ${farmer.name}.`,
            type: 'order',
            isRead: false,
            createdAt: new Date()
          });
          await deliveryPartner.save();
        }
      }
    } else if (role === 'buyer') {
      // Buyer cancelled → notify farmer + delivery partner
      if (farmer) {
        farmer.notifications.push({
          message: orderType === 'Single'
            ? `Order for ${order.cropName} was cancelled by the ${order.buyerName}.`
            : `Multi-crop order was cancelled by the ${order.buyerName}.`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await farmer.save();
      }

      if (order.assignedDeliveryPartner) {
        const deliveryPartner = await User.findOne({ name: order.assignedDeliveryPartner });
        if (deliveryPartner) {
          deliveryPartner.notifications.push({
            message: orderType === 'Single'
              ? `Order for ${order.cropName} was cancelled by the ${order.buyerName}.`
              : `Multi-crop order was cancelled by the ${order.buyerName}.`,
            type: 'order',
            isRead: false,
            createdAt: new Date()
          });
          await deliveryPartner.save();
        }
      }
    }

    res.json({ message: 'Order cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post("/api/return-order", async (req, res) => {
  try {
    const { orderId, farmerMobile, buyerMobile, orderType, orderedAt, returnReason } = req.body;

    let order;

    if(orderType === "Single"){
      order = await Order.findOne({ _id: orderId, buyerMobile, farmerMobile, orderedAt });
    } else {
      order = await MultipleOrder.findOne({ _id: orderId, buyerMobile, farmerMobile, orderedAt });
      
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found!" });
    }

    if (order.returnStatus !== "Not Requested") {
      return res.status(400).json({ message: "Return already requested or processed." });
    }

    const farmer = await User.findOne({ mobile: farmerMobile });

    // Update return status
    order.returnReason = returnReason;
    order.returnStatus = "Requested";
    order.status = "Returned";
    await order.save();

    if (farmer) {
      farmer.notifications.push({
        message: orderType === 'Single'
          ? ` ${order.buyerName} requested return for the order of ${order.cropName}. Reason was "${returnReason}".`
          : `${order.buyerName} requested return for the Multi-crop order. Reason was "${returnReason}".`,
        type: 'order',
        isRead: false,
        createdAt: new Date()
      });
      await farmer.save();
    }

    if (order.assignedDeliveryPartner) {
      const deliveryPartner = await User.findOne({ name: order.assignedDeliveryPartner });
      if (deliveryPartner) {
        deliveryPartner.notifications.push({
          message: orderType === 'Single'
            ? `${order.buyerName} requested return for the order of ${order.cropName}. Reason was "${returnReason}".`
            : `${order.buyerName} requested return for the Multi-crop order. Reason was "${returnReason}".`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await deliveryPartner.save();
      }
    }

    return res.json({ message: "Return request submitted successfully." });

  } catch (error) {
    console.error("Return order error:", error);
    return res.status(500).json({ message: "Server error while processing return." });
  }
});

app.post("/api/verify-return", async (req, res) => {
  try {
    const { cropName, buyerMobile, farmerMobile, orderedAt, orderType, bool } = req.body;

    let order;

    if(orderType === "Single") {
      order = await Order.findOne({ cropName, buyerMobile, farmerMobile, orderedAt: orderedAt });
    } else {
      order = await MultipleOrder.findOne({ buyerMobile, farmerMobile, orderedAt });
    }
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.returnStatus !== "Requested") {
      return res.status(400).json({ message: "Return not requested or already processed." });
    }

    if(bool){
      order.returnStatus = "Returning";
      await order.save();

      const farmer = await User.findOne({ mobile: order.farmerMobile });
      const buyer = await User.findOne({ mobile: order.buyerMobile });
      
      if (farmer) {
        farmer.notifications.push({
          message: orderType === 'Single'
            ? `Order for ${order.cropName} was returning from the ${order.buyerName}.`
            : `Multi-crop order was returning from the ${order.buyerName}.`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await farmer.save();
      }
      if (buyer) {
        buyer.notifications.push({
          message: orderType === 'Single'
            ? `Order for ${order.cropName} was returning from you.`
            : `Multi-crop order was returning from you.`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await buyer.save();
      }

      res.json({ message: "Return aproved successfully." });
    } else {

      order.returnStatus = "Not Requested"
      order.status = "Completed";
      await order.save();

      const farmer = await User.findOne({ mobile: order.farmerMobile });
      
      if (farmer) {
        farmer.notifications.push({
          message: orderType === 'Single'
            ? `Order for "${order.cropName}" returning was rejected by the ${order.assignedDeliveryPartner}.`
            : `Multi-crop order returning was rejected by the ${order.assignedDeliveryPartner}.`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
        await farmer.save();
      }

      res.json({ message: "Return rejected successfully." });
    }

  } catch (error) {
    console.error("Verify return error:", error);
    res.status(500).json({ message: "Server error verifying return." });
  }
});

app.post("/api/verify-return-order", async (req, res) => {
  try {
    const { cropName, buyerMobile, farmerMobile, buyerName, orderedAt, orderType } = req.body;

    let order;

    if (orderType === "Single") {
      order = await Order.findOne({
        cropName,
        buyerMobile,
        farmerMobile,
        orderedAt
      });
    } else {
      order = await MultipleOrder.findOne({
        buyerMobile,
        farmerMobile,
        orderedAt
      });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Returned") {
      // ✅ Set return status
      order.returnStatus = "Returned";
      await order.save();
    }

    

    // ✅ Notify buyer
    const farmer = await User.findOne({ mobile: farmerMobile });
    const buyer = await User.findOne({ mobile: buyerMobile });

    if (orderType === "Single") {
      if (buyer) { 
        buyer.notifications.push({
          message: `Your crop return "${cropName}" to ${farmer.name} has been completed.`,
          type: "order",
          isRead: false,
          createdAt: new Date(),
        });
        await buyer.save();
      }
    } else {
      if (buyer) { 
        buyer.notifications.push({
          message: `Your multi crop return to ${farmer.name} has been completed.`,
          type: "order",
          isRead: false,
          createdAt: new Date(),
        });
        await buyer.save();
      }
    }
    

    res.json({ message: "Return request submitted successfully." });

  } catch (err) {
    console.error("Error verifying return order:", err);
    res.status(500).json({ message: "Server error processing return request." });
  }
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));