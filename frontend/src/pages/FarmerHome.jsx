import React, { useState, useEffect,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaPlusCircle, FaBell, FaUser, FaSearch, FaCog, FaClipboardList,  FaUserFriends, FaMicrophone } from "react-icons/fa";
import { MdChat } from "react-icons/md";
import ConfirmModal from '../components/ConfirmModal';
import { useTheme } from "../context/ThemeContext";
import { fetchOrders, fetchMultipleOrders, fetchFriends, fetchUnreadMessages, fetchUnreadMessagesPerFriend, fetchCrops } from "../utils/fetchService";
import { handleSearch, handleAcceptRequest, handleDeclineRequest, handleChange, handleCropSearch, handleSave, clearNotifications,
         handleSelectFriend, sendMessage, markAllAsRead, handleRemoveFriend, handleAddFriend} from "../utils/handleService";
import FriendsList from "../components/FriendsList";
import SearchView from "../components/SearchView";
import SettingsView from "../components/SettingsView"; // Adjust the path as needed
import NotificationsView from "../components/NotificationsView";
import ChatBox from "../components/chatBox";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";


const FarmerHome = () => {
  const { language, setLanguage } = useLanguage();  // Get current language
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [farmerName, setFarmerName] = useState("Farmer");
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [selectedVariety, setSelectedVariety] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [bestBeforeDate, setBestBeforeDate] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [description, setDescription] = useState("");
  const [productionDate, setProductionDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState(JSON.parse(localStorage.getItem("recentSearches")) || []);

  const [friendshipStatus, setFriendshipStatus] = useState("Add Friend");
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [showChat, setShowChat] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [chatNotifications, setChatNotifications] = useState(0);
  const [unreadMessagesPerFriend, setUnreadMessagesPerFriend] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [multipleOrders, setMultipleOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { darkMode, setDarkMode } = useTheme();
  const [crops, setCrops] = useState([]);
  const [cropSearchQuery, setCropSearchQuery] = useState("");
  const [cropSearchResults, setCropSearchResults] = useState([]);
  const [recentCropSearches, setRecentCropSearches] = useState(JSON.parse(localStorage.getItem("recentCropSearches")) || []);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [priceUnder, setPriceUnder] = useState("");
  const [priceOver, setPriceOver] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredMultipleOrders, setFilteredMultipleOrders] = useState([]);
  
  const [pendingOrders,setPendingOrders] = useState([]);
  const deliveredSingleOrders = orders.filter(order => order.status === "Completed");
  const deliveredMultipleOrders = multipleOrders.filter(order => order.status === "Completed");
  const deliveredOrders = [...deliveredSingleOrders, ...deliveredMultipleOrders];

  const [editCrop, setEditCrop] = useState(null);
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = useState("");
  const [cropToDelete, setCropToDelete] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);

  const [showCrops, setShowCrops] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [showPrediction, setShowPrediction] = useState(false);
  const [season, setSeason] = useState("");
  const [month, setMonth] = useState("");
  const [msp, setMsp] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(null);


  const getCropVariety = (variety) => {
    const index = translations.en.cropVarieties.indexOf(variety);
    return index !== -1 ? translations[language].cropVarieties[index] : variety;
  };
  
  const getCropName = (cropName) => {

    const cropCategories = ["vegetableOptions", "fruitOptions", "pulsesOptions", "cerealsOptions", "spicesOptions"];
  
    if (language === "ta") {
      for (const category of cropCategories) {
        const index = translations.en[category].indexOf(cropName);
        if (index !== -1) {
          return translations.ta[category][index]; // Return Tamil name if found
        }
      }
    }
    return cropName.toUpperCase(); // Default to English
  };

  const toCamelCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word, index) =>
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "en" ? "en-US" : "ta-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      console.log("You said:", speech);

      const logoutCommands = ["log out", "logout", "வெளியேறு"];
      const homeCommands = ["home", "go home", "phone", "முகப்பு", "ஹோம்", "ஃபோன்"];
      const searchCommands = ["search", "சர்ச்", "தேடு", "தேடவும்", "td"];
      const addCropCommands = ["add", "add crop", "பயிர் சேர்க்கவும்", "தயிர் சேர்க்கவும்"];
      const themeCommands = ["change team", "change teen", "team", "teen", "theme", "change theme","சேஞ்ஜ் தீம்","தீம்","டீம்","பையன் முறை"];

      // ✅ Logout commands
      if (logoutCommands.some(word => speech.includes(word))) {
        navigate("/login");

      // ✅ Home commands
      } else if (homeCommands.some(word => speech.includes(word)) || speech.includes("back")|| speech.includes("பின்பு")|| speech.includes("பின்செல்")|| speech.includes("இன்பு")|| speech.includes("ம்பு")) {
        navigate("/farmer-home"); setShowSearch(false); setShowNotifications(false); setShowProfile(false); setShowSettings(false); setShowAddCrop(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);

      // Total crops
      } else if (speech.includes("total crops listed") ||speech.includes("total crops") || speech.includes("மொத்த பயிர்கள்")|| speech.includes("முத்த பயிர்கள்")|| speech.includes("மட்ட பயிர்கள் பதிவு செய்யப்பட்டவை")) {
        setShowCrops(true);

      // Pending Orders
      } else if (speech.includes("pending orders") || speech.includes("நிலுவையிலுள்ள ஆர்டர்கள்")|| speech.includes("பெண்டிங் ஆர்டர்ஸ்")|| speech.includes("நிலுவையில் உள்ள ஆடுகள்")|| speech.includes("நிலுவையில் உள்ள ஆர்டர்கள்")|| speech.includes("நிலுவையிலுள்ள ஆடுகள்")) {
        setStatusFilter("Pending");setShowOrderStatus(true);

      // Delivered Orders
      } else if (speech.includes("delivered orders") || speech.includes("டெலிவர்டு ஆர்டர்ஸ்")|| speech.includes("வழங்கப்பட்ட ஆர்டர்கள்")|| speech.includes("வழங்கப்பட்ட ஆடுகளை")|| speech.includes("டிவோர்ஸ்")|| speech.includes("நிலுவையிலுள்ள ஆடுகள்")) {
        setStatusFilter("Completed");setShowFilters(false);setShowOrderStatus(true);

      // Total price earned
      } else if (speech.includes("total price earned") || speech.includes("total price year and")|| speech.includes("total price")|| speech.includes("டோட்டல் பிரைஸ்")|| speech.includes("டோட்டல் பிரைஸ் இரண்டு")|| speech.includes("சம்பாதிப்ப மொத்த விலை") || speech.includes("சம்பாதித்த மொத்த விலை")|| speech.includes("மொத்த விலை")) {
        setStatusFilter("");setShowOrderStatus(true);
        
      // Real time price
      } else if (speech.includes("real time price") || speech.includes("நிகழ்நேர விலை")|| speech.includes("ரியல் டைம் ஃப்ரீஸ்")|| speech.includes("market price")|| speech.includes("check now")|| speech.includes("சரி பார்க்கவும்")|| speech.includes("சரிபார்க்கவும்")|| speech.includes("சரி பார்க்க")|| speech.includes("சரிபார்க்க")) {
        window.open("https://www.agmarknet.gov.in/SearchCmmMkt.aspx", "_blank");

      // Predict price
      } else if (speech.includes("price prediction") || speech.includes("predict now")|| speech.includes("விலை கணிப்பு")|| speech.includes("கடிக்கவும்")|| speech.includes("கணிக்கவும்")|| speech.includes("பிரிஸ்கிரிப்ஷன்")) {
        setShowPrediction(true);

      // ✅ clear recent crop searches
      } else if (speech.includes("clear recent crop searches") || speech.includes("சமீபத்திய பயிர் தேடல்களை நீக்கவும்")|| speech.includes("பயிர் தேடல்களை நீக்கவும்")) {
        clearRecentCropSearches();

      // ✅ clear recent searches
      } else if (speech.includes("clear recent searches") || speech.includes("தேடல்களை நீக்கவும்")|| speech.includes("சமீபத்திய தேடல்களை நீக்கவும்")) {
        clearRecentSearches();

      // Search
      } else if (searchCommands.some(word => speech.includes(word))) {
        setShowSearch(true); setShowNotifications(false); setShowAddCrop(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);

      // Add crop
      } else if (addCropCommands.some(word => speech.includes(word))) {
        setShowAddCrop(true); setShowNotifications(false); setShowSearch(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);

      // Notifications
      } else if (speech.includes("notifications") || speech.includes("notification") || speech.includes("அறிவிப்புகள்")|| speech.includes("அறிவிப்பு")) {
        setShowNotifications(true); setShowSearch(false); setShowAddCrop(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);

      // Profile
      } else if (speech.includes("profile") || speech.includes("சுயவிவரம்") || speech.includes("ஃபைல்")) {
        setShowProfile(true); setShowSearch(false); setShowNotifications(false); setShowAddCrop(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);

      // Friends
      } else if (speech.includes("friend") || speech.includes("friends") || speech.includes("நண்பர்கள்")) {
        fetchFriends(setFriends, setAdmins); setShowFriends(true); setShowChat(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowOrderStatus(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false);
        
      // Orders
      } else if (speech.includes("orders") || speech.includes("crop orders")|| speech.includes("ஆர்டர்கள்") || speech.includes("பயிர் ஆர்டர்கள்")|| speech.includes("தயிர் ஆர்டர்கள்")|| speech.includes("பயிர் ஆண்டுகள்")|| speech.includes("பயிறு ஆண்டுகள்")) {
        setStatusFilter("");applyFilters();setShowOrderStatus(true); setShowFriends(false); setShowChat(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false);

      // Chat
      } else if (speech.includes("chat") || speech.includes("உரையாடு")) {
        setShowChat(true);fetchFriends(setFriends, setAdmins);  setShowFriends(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowOrderStatus(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false);

      // Settings
      } else if (speech.includes("setting") || speech.includes("settings") || speech.includes("அமைப்புகள்")|| speech.includes("அமைப்புகளில்")) {
        setShowSettings(true); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowFriends(false); setShowOrderStatus(false); setShowChat(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false);

      // ✅ Tamil language switch
      } else if (speech.includes("tamil") || speech.includes("தமிழ்")) {
        setLanguage("ta");
      // ✅ English language switch
      } else if (speech.includes("english") || speech.includes("இங்கிலிஷ்") || speech.includes("ஆங்கிலம்")) {
        setLanguage("en");
      // ✅ Light theme set
      } else if (speech.includes("light theme") || speech.includes("light mode") || speech.includes("ஒளி பயன்முறை")) {
        setDarkMode(false);
      // ✅ Dark theme set
      } else if (speech.includes("dark theme") || speech.includes("dark mode") || speech.includes("இருண்ட பயன்முறை") || speech.includes("இருந்த பயன்முறை")) {
        setDarkMode(true);
      // ✅ Toggle theme
      } else if (themeCommands.some(word => speech.includes(word))) {
        toggleTheme();
      // ✅ Unrecognized command
      } else {
        alert(`Unrecognized command: ${speech}`);
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.mobile) {
          setFarmer(parsedUser);
        } else {
          console.error("Invalid user data:", parsedUser);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      console.error("No user found in localStorage.");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch Farmer Profile
    axios.get("http://localhost:5000/farmer-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {setFarmerName(res.data.name);
        setProfile(res.data);
        setEditedProfile({ ...res.data }); // Ensure all fields are properly initialized
      })
      .catch(() => setFarmerName("Farmer"));

    axios.get("http://localhost:5000/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log("Fetched Notifications:", res.data); // Debugging
        setNotifications(res.data);
      })
      .catch(() => setNotifications([]));

    axios.get("http://localhost:5000/unread-messages", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => setChatNotifications(res.data.unreadCount))
      .catch(() => setChatNotifications(0));

    const container = document.getElementById("messages-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    fetchFriends(setFriends, setAdmins);
    fetchOrders(setOrders);
    fetchMultipleOrders(setMultipleOrders);
    fetchCrops(setCrops);
    fetchUnreadMessages(setChatNotifications);
    fetchUnreadMessagesPerFriend(setUnreadMessagesPerFriend);
  }, [refreshKey,messages]);

  useEffect(() => {
    if (!Array.isArray(orders) || !Array.isArray(multipleOrders)) return;
  
    // ✅ Filter orders and multipleOrders for pending status
    const filteredOrders = orders.filter(order => order.status === "Ordered" || order.status === "Packed");
    const filteredMultipleOrders = multipleOrders.filter(order => order.status === "Ordered" || order.status === "Packed");
  
    // ✅ Merge both lists
    const combinedOrders = [...filteredOrders, ...filteredMultipleOrders];
  
    setPendingOrders(combinedOrders); // ✅ Update state
  }, [orders, multipleOrders]);

  // ✅ Separate useEffect for sorting all orders initially
  useEffect(() => {
    if (!Array.isArray(orders) || !Array.isArray(multipleOrders)) return;

    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
    const sortedMultipleOrders = [...multipleOrders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

    setFilteredOrders(sortedOrders);
    setFilteredMultipleOrders(sortedMultipleOrders);
  }, [orders, multipleOrders]);

  useEffect(() => {
    const tempFilteredOrders = orders.filter(order => order.status === "Ordered" || order.status === "Packed");
    const tempFilteredMultipleOrders = multipleOrders.filter(order => order.status === "Ordered" || order.status === "Packed");
  
    if (statusFilter === "Pending") {
      const combinedOrders = [...tempFilteredOrders, ...tempFilteredMultipleOrders];
      setPendingOrders(combinedOrders);
      setFilteredOrders(tempFilteredOrders);
      setFilteredMultipleOrders(tempFilteredMultipleOrders);
    } else {
      applyFilters();
    }
  }, [statusFilter, orders, multipleOrders]);

  useEffect(() => {
    const triggerPrediction = async () => {
      if (!selectedCrop || !productionDate || !msp){
        setPricePerKg("");
      }
      if (selectedCrop && productionDate && season && month && msp) {
        try {
          const response = await fetch("http://localhost:5000/getPrediction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cropName: selectedCrop,
              date: productionDate,
              season,
              month,
              msp: parseFloat(msp),
            }),
          });
  
          const data = await response.json();
          console.log("Auto prediction data:", data);
  
          if (response.ok && data.farmerPrice !== undefined && data.marketPrice !== undefined) {
            setPredictedPrice({
              farmerPrice: data.farmerPrice,
              marketPrice: data.marketPrice,
            });
            setPricePerKg(data.marketPrice); // ✅ auto update pricePerKg
          } else {
            console.error("Unexpected response format:", data);
            // optionally show alert
          }
        } catch (error) {
          console.error("Error predicting price:", error);
          // optionally show alert
        }
      }
    };
    triggerPrediction();
  }, [selectedCrop, productionDate, season, month, msp]); // ✅ dependency array

  useEffect(() => {
    if (productionDate) {
      const date = new Date(productionDate);
      const monthName = date.toLocaleString("default", { month: "long" });
      const seasonName = getSeasonFromMonth(monthName);
      setMonth(monthName);
      setSeason(seasonName);
    }
  }, [productionDate]);

  // Filter single crop orders
  const farmerSingleOrders = orders.filter(order => order.farmerMobile === farmer.mobile);

  // Filter multiple crop orders (Only include orders where at least one crop belongs to the farmer)
  const farmerMultiOrders = multipleOrders.filter(order => order.farmerMobile === farmer.mobile);

  // Calculate earnings for single orders
  const singleOrderEarnings = farmerSingleOrders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);

  // Calculate earnings for multiple orders (Only sum crops that belong to the farmer)
  const multiOrderEarnings = farmerMultiOrders.reduce((sum, order) => sum + (order.totalOrderAmount ?? 0), 0);

  // Total Earnings (Single + Multiple Crop Orders)
  const totalEarnings = singleOrderEarnings + multiOrderEarnings;

  // Toggle handler
  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Separate Filtering for Orders and Multiple Orders
  const applyFilters = () => {
    let tempFilteredOrders = [...orders];
    let tempFilteredMultipleOrders = [...multipleOrders];

    if (statusFilter) {
      tempFilteredOrders = tempFilteredOrders.filter(order => order.status === statusFilter);
      tempFilteredMultipleOrders = tempFilteredMultipleOrders.filter(order => order.status === statusFilter);
    }

    if (priceUnder) {
      tempFilteredOrders = tempFilteredOrders.filter(order => order.totalPrice <= parseFloat(priceUnder));
      tempFilteredMultipleOrders = tempFilteredMultipleOrders.filter(order => order.totalOrderAmount <= parseFloat(priceUnder));
    }

    if (priceOver) {
      tempFilteredOrders = tempFilteredOrders.filter(order => order.totalPrice >= parseFloat(priceOver));
      tempFilteredMultipleOrders = tempFilteredMultipleOrders.filter(order => order.totalOrderAmount >= parseFloat(priceOver));
    }

    if (paymentFilter) {
      tempFilteredOrders = tempFilteredOrders.filter(order => order.paymentMethod === paymentFilter);
      tempFilteredMultipleOrders = tempFilteredMultipleOrders.filter(order => order.paymentMethod === paymentFilter);
    }

    // ✅ Update separate states
    setFilteredOrders(tempFilteredOrders);
    setFilteredMultipleOrders(tempFilteredMultipleOrders);
  };

  // ✅ Clear Filters
  const clearFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
    setPriceUnder("");
    setPriceOver("");

    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
    const sortedMultipleOrders = [...multipleOrders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

    setFilteredOrders(sortedOrders);
    setFilteredMultipleOrders(sortedMultipleOrders);
    setShowFilters(false);
  };

  const cropVarieties = ["Vegetables", "Fruits", "Grains", "Pulses", "Spices"];
  const vegetableOptions = ["Tomato", "Potato", "Onion", "Carrot", "Cabbage", "Cauliflower", "Brinjal", "Spinach", "Lettuce", "Radish", "Beetroot",
    "Pumpkin","Cucumber", "Peas", "Bitter Gourd", "Bottle Gourd", "Ladyfinger", "Mushroom", "Broccoli", "Capsicum", "Ginger", "Garlic", 
    "Spring Onion", "Celery", "Chilli", "Coriander", "Dill", "Fenugreek", "Mint", "Drumstick"];
  const fruitOptions = ["Apple", "Banana", "Mango", "Grapes", "Orange", "Pineapple", "Guava", "Papaya", "Strawberry"];
  const pulsesOptions = ["Chickpeas", "Lentils", "Black Gram", "Green Gram", "Pigeon Pea"];
  const cerealsOptions = ["Wheat", "Rice", "Barley", "Maize", "Millets"];
  const spicesOptions = ["Turmeric", "Pepper", "Cardamom", "Cumin", "Coriander Seeds"];

  const getCropOptions = () => {
    switch (selectedVariety) {
      case "Vegetables": return vegetableOptions;
      case "Fruits": return fruitOptions;
      case "Pulses": return pulsesOptions;
      case "Grains": return cerealsOptions;
      case "Spices": return spicesOptions;
      default: return [];
    }
  };

  const updateRecentSearches = (query) => {
    const updatedSearches = [query, ...recentSearches.filter(q => q !== query)].slice(0, 7);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const updateRecentCropSearches = (query) => {
    const updatedCropSearches = [query, ...recentCropSearches.filter(q => q !== query)].slice(0, 7);
    setRecentCropSearches(updatedCropSearches);
    localStorage.setItem("recentCropSearches", JSON.stringify(updatedCropSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const clearRecentCropSearches = () => {
    setRecentCropSearches([]);
    localStorage.removeItem("recentCropSearches");
  };

  const handleSearchClick = useCallback(() => {
    handleSearch(searchQuery, setSearchResults, setShowFriends,updateRecentSearches, setFriendshipStatus, farmerName );
  }, [searchQuery, updateRecentSearches, farmerName]);

  const handleAddFriendClick = () => {
    handleAddFriend(searchResults.name, friendshipStatus, setFriendshipStatus);
  };

  const handleCropSearchClick = useCallback(() => {
    handleCropSearch(
      cropSearchQuery,
      farmer,
      setCropSearchResults,
      updateRecentCropSearches,
      
    );
  }, [cropSearchQuery, farmer, setCropSearchResults, updateRecentCropSearches]);

  const handleAddCropSubmit = async () => {
    if (!selectedVariety || !selectedCrop || !availableQuantity || !bestBeforeDate || !pricePerKg || !productionDate) {
      alert("Please fill all required fields!");
      return;
    }
    if (!farmer || !farmer.mobile) {
      alert("Farmer details not found. Please login again.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/add-crop", {
        variety: selectedVariety,
        name: selectedCrop,
        totalQuantity: availableQuantity,  // Set total quantity
        availableQuantity: availableQuantity,  // Initially same as total
        productionDate,
        bestBefore: bestBeforeDate,
        price: pricePerKg,
        description,
        farmerMobile: farmer.mobile, 
      });

      alert("Crop added successfully!");
      window.location.reload();
    } catch (error) {
      alert("Failed to add crop. Please try again.");
    }
  };

  const handleStatusChange = async (cropName, buyerMobile, farmerMobile,buyerName, orderedAt, newStatus) => {
    try {
      const response = await fetch('http://localhost:5000/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ cropName, buyerMobile, farmerMobile,buyerName, orderedAt, status: newStatus }),
      });

      const result = await response.json();
      alert(result.message);

      // Update only the correct order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.cropName === cropName &&
          order.buyerMobile === buyerMobile &&
          order.farmerMobile === farmerMobile &&
          order.buyerName === buyerName &&
          order.orderedAt === orderedAt
            ? { ...order, status: newStatus }
            : order
        )
      );
      

    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleMultipleOrderStatusChange = async (buyerMobile, farmerMobile, buyerName, orderedAt, newStatus) => {
    try {
        const response = await fetch(`http://localhost:5000/api/update-multiple-order-status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ buyerMobile, farmerMobile, buyerName, orderedAt, status: newStatus }),
        });
  
        const result = await response.json();
  
        // Update only the correct order
        setMultipleOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.buyerMobile === buyerMobile &&
            order.farmerMobile === farmerMobile &&
            order.buyerName === buyerName &&
            order.orderedAt === orderedAt
              ? { ...order, status: newStatus } // ✅ Update the entire order's status
              : order
          )
        );
        alert(result.message);
        
  
    } catch (err) {
        console.error("Error updating multiple order status:", err);
    }
  };

  const handleChat = (friend) => {
    handleSelectFriend(friend, setSelectedFriend, setMessages, setRefreshKey);
    // setSelectedFriend(friend); // Set the friend for the chat
    setShowChat(true);
  };

  const confirmRemove = (friend) => {
    setSelectedFriend(friend); // Store the friend to be removed
    setShowModal(true); // Show the modal
  };

  const handleConfirm = () => {
    if (selectedFriend) {
      handleRemoveFriend(selectedFriend, setFriends, setFriendshipStatus)// Call the remove function
    }
    setShowModal(false); // Close the modal
  };

  const handleCancel = () => {
    setShowModal(false); // Just close the modal
    setSelectedFriend(null);
  };

  const handleEdit = (crop) => {
    setEditCrop(crop);
    setUpdatedPrice(crop.price);
    setUpdatedQuantity(crop.availableQuantity);
  };

  const handleSaveCrop = async (crop) => {
    try {
      const response = await fetch("http://localhost:5000/update-crop", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: crop.name,
          farmerName: crop.farmerName,
          productionDate: crop.productionDate,
          price: crop.price, // Current price for identification
          updatedPrice,
          updatedQuantity,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        // Update frontend state
        const updatedCrops = crops.map((c) =>
          c.name === crop.name &&
          c.farmerName === crop.farmerName &&
          c.productionDate === crop.productionDate &&
          c.price === crop.price
            ? { ...c, price: updatedPrice, availableQuantity: updatedQuantity }
            : c
        );
  
        setCrops(updatedCrops);
        setEditCrop(null);
        alert("Crop updated successfully!");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating crop:", error);
      alert("Failed to update crop. Please try again.");
    }
  };

  const handleDeleteClick = (crop) => {
    setCropToDelete(crop); // Open confirmation modal with selected crop
  };
  
  const handleConfirmDelete = async () => {
    if (!cropToDelete) return;
  
    try {
      const response = await fetch("http://localhost:5000/delete-crop", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cropToDelete.name,
          farmerName: cropToDelete.farmerName, // Ensure this field exists in your crop object
          productionDate: cropToDelete.productionDate,
          price: cropToDelete.price,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Remove from UI if successfully deleted in backend
        const updatedCrops = crops.filter(
          (c) => !(c.name === cropToDelete.name && c.productionDate === cropToDelete.productionDate)
        );
        setCrops(updatedCrops);
      } else {
        console.error("Error deleting crop:", data.message);
      }
    } catch (error) {
      console.error("Failed to delete crop:", error);
    }
  
    setCropToDelete(null); // Close modal
  };
  
  const handleCancelDelete = () => {
    setCropToDelete(null); // Close modal without deleting
  };

  const handleCancelClick = (order) => {
    setSelectedOrder({ id: order._id, farmerMobile: order.farmerMobile, buyerMobile: order.buyerMobile,
                       orderedAt: order.orderedAt, orderType: order.orderType });
    setShowCancelModal(true);
  }

  const handleConfirmCancel = () => {
    if (selectedOrder.orderType === 'Single') {
      handleCancelOrder(selectedOrder.buyerMobile, selectedOrder.farmerMobile, farmerName, selectedOrder.orderedAt);
    } else if (selectedOrder.orderType === 'Multiple'){
      handleCancelMultipleOrder(selectedOrder.buyerMobile, selectedOrder.farmerMobile, farmerName, selectedOrder.orderedAt);
    } else {
      console.log("Issue at handleConfirmCancel");
    }
  }

  const handleCancelCancel = () => {
    setSelectedOrder(null);
    setShowCancelModal(false);
  }

  const handlePredictPrice = async () => {

    if (!selectedCrop || !productionDate || !season || !month || !msp) {
      alert("Please fill all the required fields!");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/getPrediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: selectedCrop,
          date: productionDate, // <- change to 'date'
          season,
          month,
          msp: parseFloat(msp),
        }),
      });
  
      const data = await response.json();
      console.log("Prediction data:", data);
  
      if (response.ok && data.farmerPrice !== undefined && data.marketPrice !== undefined) {
        setPredictedPrice({
          farmerPrice: data.farmerPrice,
          marketPrice: data.marketPrice,
        });
      } else {
        console.error("Unexpected response format:", data);
        alert("Failed to predict price. Unexpected response format.");
      }
    } catch (error) {
      console.error("Error predicting price:", error);
      alert("Something went wrong.");
    }
  };

  const getSeasonFromMonth = (month) => {
    const seasons = {
      January: "Winter",
      February: "Winter",
      March: "Summer",
      April: "Summer",
      May: "Summer",
      June: "Monsoon",
      July: "Monsoon",
      August: "Monsoon",
      September: "Autumn",
      October: "Autumn",
      November: "Autumn",
      December: "Winter",
    };
    return seasons[month] || "Unknown";
  };

  const handleCancelOrder = async (buyerMobile, farmerMobile, farmerName, orderedAt) => {
    try {
      const res = await fetch('http://localhost:5000/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerMobile,
          farmerMobile,
          farmerName,
          orderedAt,
          orderType: 'Single',
          role: "farmer"
        })
      });
  
      const data = await res.json();
      alert(data.message);
      fetchOrders(setOrders);
      setShowCancelModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };

  const handleCancelMultipleOrder = async (buyerMobile, farmerMobile, farmerName, orderedAt) => {
    try {
      const res = await fetch('http://localhost:5000/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerMobile,
          farmerMobile,
          farmerName,
          orderedAt,
          orderType: 'Multiple',
          role: "farmer"
        })
      });
  
      const data = await res.json();
      alert(data.message);
      fetchMultipleOrders(setMultipleOrders);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };

  const handleReturnOrder = async (cropName, buyerMobile, farmerMobile, buyerName, orderedAt, orderType) => {
    try {
      const res = await fetch('http://localhost:5000/api/verify-return-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName,
          buyerMobile,
          farmerMobile,
          buyerName,
          orderedAt,
          orderType
        })
      });
      const data = await res.json();
      alert(data.message);
      fetchOrders(setOrders);
      fetchMultipleOrders(setMultipleOrders);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };

  const openSupportChat = (type) => {
    const admin = admins[0];
    setSelectedFriend(admin);
    setNewMessage(`"${type}!" - `);
    setShowSettings(false);
    setShowChat(true);
  };
  
  // Return Function

  return (

    <div className="farmer-home">

      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 w-full h-20 flex justify-between border-b items-center px-6 z-50 shadow-md 
        transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white" : "bg-white text-gray-800"}`}>
        
        <h1 className="text-xl font-bold tracking-wide">{translations[language].title}</h1>
        <div className="flex space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Friends"
              onClick={() => { fetchFriends(setFriends, setAdmins); setShowFriends(true); setShowChat(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowOrderStatus(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false); }}>
              <FaUserFriends className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Order Status"
              onClick={() => { setStatusFilter("");applyFilters();setShowOrderStatus(true); setShowFriends(false); setShowChat(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false); }}>
              <FaClipboardList className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Chat"
              onClick={() => { setShowChat(true);fetchFriends(setFriends, setAdmins);  setShowFriends(false); setShowSettings(false); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowOrderStatus(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false);}}>
              <MdChat className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Settings"
              onClick={() => { setShowSettings(true); setShowProfile(false); setShowSearch(false); setShowNotifications(false); setShowFriends(false); setShowOrderStatus(false); setShowChat(false);setShowAddCrop(false);setShowCrops(false);setShowPrediction(false); }}>
              <FaCog className="w-5 h-5" />
            </button>

          </div>
      </header>

      {/* CHAT FUNCTION */}
      {showChat && (
        <ChatBox
          showChat={showChat}
          darkMode={darkMode}
          friends={friends}
          admins={admins}
          selectedFriend={selectedFriend}
          setSelectedFriend={setSelectedFriend}
          messages={messages}
          setMessages={setMessages}
          chatNotifications={chatNotifications}
          unreadMessagesPerFriend={unreadMessagesPerFriend}
          sendMessage={sendMessage}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSelectFriend={handleSelectFriend}
          setRefreshKey={setRefreshKey}
        />
      )}

      {/* Friends List */}
      {showFriends && (
        <FriendsList
          showFriends={showFriends}
          friends={friends}
          darkMode={darkMode}
          handleChat={handleChat}
          confirmRemove={confirmRemove}
        />
      )}

      {/* Notifications */}
      {showNotifications && (
          <NotificationsView
          user={farmer}
          showNotifications={showNotifications}
          darkMode={darkMode}
          notifications={notifications}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
          markAllAsRead={markAllAsRead}
          clearNotifications={clearNotifications}
          setNotifications={setNotifications}
          setFriendshipStatus={setFriendshipStatus}
        />
      )}

      {/* Search Option */}
      {showSearch && (
        <SearchView 
          showSearch={showSearch}
          darkMode={darkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchClick={handleSearchClick}
          handleCropSearchClick={handleCropSearchClick}
          searchResults={searchResults}
          friendshipStatus={friendshipStatus}
          handleChat={handleChat}
          confirmRemove={confirmRemove}
          handleAddFriendClick={handleAddFriendClick}
          recentSearches={recentSearches}
          clearRecentSearches={clearRecentSearches}
          cropSearchQuery={cropSearchQuery}
          setCropSearchQuery={setCropSearchQuery}
          user={farmer}
          cropSearchResults={cropSearchResults}
          recentCropSearches={recentCropSearches}
          clearRecentCropSearches={clearRecentCropSearches}
          setSelectedCrop={setSelectedCrop}
        />
      )}

      {/* Settings Page Component */}
      {showSettings && (
        <SettingsView
          showSettings={showSettings}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          notifications={notifications}
          handleToggle={handleToggle} 
          openSupportChat={openSupportChat} 
        />
      )}

      {/* Confirm Modal */}
      {showModal && (
        <ConfirmModal
          message={translations[language].confirmRemoveFriend(selectedFriend?.name)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Confirm Modal */}
      {showCancelModal && (
        <ConfirmModal
          message={translations[language].removeOrder}
          onConfirm={handleConfirmCancel}
          onCancel={handleCancelCancel}
        />
      )}

      {/* Delete Crops */}
      {cropToDelete && (
        <ConfirmModal
          message={translations[language].confirmDeleteCrop(getCropName(cropToDelete.name))}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Add Crop Form */}
      {showAddCrop && (
        <div className={`fixed top-[4rem] left-0 w-full h-[calc(100vh-4rem-3.6rem)] flex justify-center items-center transition-colors duration-500 ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
          
          <div className={`w-full h-full p-8 overflow-y-auto rounded-none transition-colors duration-500`}>
            <h2 className="text-2xl font-bold mb-8 text-center w-full"> {translations[language].addCrop.title}</h2>

            <div className="space-y-2">
              {/* Crop Variety Selection */}
              <div className="w-full flex flex-col md:flex-row md:items-center md:space-x-8">
                <label className="w-full md:w-1/4 text-sm font-bold">
                  {translations[language].addCrop.cropVariety}
                </label>
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className={`w-full p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                >
                  <option value="">
                    {translations[language].addCrop.select} {translations[language].addCrop.cropVariety}
                  </option>
                  {cropVarieties.map((variety, i) => (
                    <option key={i} value={variety}>
                      {translations[language].cropVarieties[i]} {/* Show Tamil text */}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Name Selection */}
              <div className="w-full flex flex-col md:flex-row md:items-center md:space-x-8">
                <label className="w-full md:w-1/4 text-sm font-bold">
                  {translations[language].addCrop.cropName}
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className={`w-full p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                >
                  <option value="">
                    {translations[language].addCrop.select} {translations[language].addCrop.cropName}
                  </option>
                  {selectedVariety &&
                    getCropOptions().map((crop, i) => {
                      // **Get English variety name from selectedVariety**
                      const varietyIndex = cropVarieties.indexOf(selectedVariety);
                      const englishVariety = ["vegetableOptions", "fruitOptions", "cerealsOptions", "pulsesOptions", "spicesOptions"][varietyIndex];

                      // **Get Tamil translation using the correct key**
                      const translatedCrop = translations[language][englishVariety][i];

                      return (
                        <option key={i} value={crop}>
                          {translatedCrop} {/* Show Tamil text */}
                        </option>
                      );
                    })}
                </select>
              </div>

              {[
                // { label: translations[language].addCrop.cropVariety, value: selectedVariety, onChange: setSelectedVariety, options: cropVarieties },
                // { label: translations[language].addCrop.cropName, value: selectedCrop, onChange: setSelectedCrop, options: selectedVariety ? getCropOptions() : [] },
                { label: translations[language].addCrop.availableQuantity, value: availableQuantity, onChange: setAvailableQuantity, type: "number" },
                { label: translations[language].addCrop.productionDate, value: productionDate, onChange: setProductionDate, type: "date" },
                { label: translations[language].addCrop.bestBeforeDate, value: bestBeforeDate, onChange: setBestBeforeDate, type: "date", min: new Date().toISOString().split("T")[0] },
                { label: translations[language].cropPrediction.msp, value: msp, onChange: setMsp, type: "number" },
                { label: translations[language].addCrop.pricePerKg, value: pricePerKg, onChange: setPricePerKg, type: "number" },
              ].map((field, index) => (
                <div key={index} className="w-full flex flex-col md:flex-row md:items-center md:space-x-8">
                  <label className="w-full md:w-1/4 text-sm font-bold">{field.label}</label>
                  {field.options ? (
                    <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}>
                      <option value="">{translations[language].addCrop.select} {field.label}</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)} min={field.min || ""} className={`w-full p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`} />
                  )}
                </div>
              ))}

              <div className="w-full flex flex-col md:flex-row md:items-center md:space-x-8">
                <label className="w-full md:w-1/4 text-sm font-bold">{translations[language].addCrop.description}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className={`w-full p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`} />
              </div>

              <div className="w-full flex flex-col md:flex-row md:justify-end justify-start md:items-center gap-4 mt-12">
                {/* Predict Price Button */}
                <button onClick={() => setShowPrediction(true)} className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium transition 
                  ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
                  {translations[language].addCrop.predictPrice}
                </button>

                {/* Submit Button */}
                <button onClick={handleAddCropSubmit} className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium transition 
                  ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}>
                  {translations[language].addCrop.submit}
                </button>

                {/* Cancel Button */}
                <button onClick={() => setShowAddCrop(false)} className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium transition 
                  ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}>
                  {translations[language].addCrop.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Ordered Crops */}
      {showOrderStatus && (
        <div className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] flex justify-center items-center border-t transition-colors duration-500 ${
          darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>

          <div className="w-full h-full p-8 overflow-y-auto rounded-none transition-colors duration-500">
            
            {/* Title and Filter Button */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">{translations[language].yourcrops.cropOrders}</h2>

              <button onClick={showFilters ? clearFilters : () => setShowFilters(true)}
                  className="px-5 py-2 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition">
                  {showFilters ? translations[language].yourcrops.hideFilters : translations[language].yourcrops.filter}
                </button>
            </div>
      
            {/* Filter Options Panel */}
            {showFilters && (
              <div className="p-6 mb-8 rounded-md shadow-md border transition-colors duration-500 space-y-4">
                <h3 className="text-xl font-bold mb-4">{translations[language].yourcrops.filter}</h3>

                <div className="flex flex-wrap gap-4">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{translations[language].orderStatus.all}</option>
                    <option value="Ordered">{translations[language].orderStatus.ordered}</option>
                    <option value="Packed">{translations[language].orderStatus.packed}</option>
                    <option value="Shipped">{translations[language].orderStatus.shipped}</option>
                    <option value="Out for Delivery">{translations[language].orderStatus.outfordelivery}</option>
                    <option value="Delivered">{translations[language].orderStatus.delivered}</option>
                    <option value="Completed">{translations[language].orderStatus.completed}</option>
                    <option value="Cancelled">{translations[language].orderStatus.cancelled}</option>
                    <option value="Returned">{translations[language].orderStatus.returned}</option>
                  </select>

                  {/* Price Range Under */}
                  <input
                    type="number"
                    placeholder={translations[language].yourcrops.priceUnder}
                    value={priceUnder}
                    onChange={(e) => setPriceUnder(e.target.value)}
                    className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  />

                  {/* Price Range Over */}
                  <input
                    type="number"
                    placeholder={translations[language].yourcrops.priceOver}
                    value={priceOver}
                    onChange={(e) => setPriceOver(e.target.value)}
                    className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  />

                  {/* Payment Type Filter */}
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{translations[language].yourcrops.allPayments}</option>
                    <option value="Cash on Delivery">{translations[language].yourcrops.cashOnDelivery}</option>
                    <option value="Net Banking">{translations[language].yourcrops.netBanking}</option>
                    <option value="UPI">{translations[language].yourcrops.upi}</option>
                    <option value="Credit/Debit Card">{translations[language].yourcrops.creditDebitCard}</option>
                  </select>
                </div>

                {/* Apply Filters Button */}
                <button
                  onClick={applyFilters}
                  className="mt-4 px-6 py-2 text-sm rounded-md font-medium bg-green-500 text-white hover:bg-green-600 transition"
                >
                  {translations[language].yourcrops.applyFilters}
                </button>
              </div>
            )}
            {/* Combine and Sort Orders */}
            {(() => {
              const allOrders = [
                ...filteredOrders.map((order) => ({ ...order, orderType: "Single" })), // Mark single orders
                ...filteredMultipleOrders.map((order) => ({ ...order, orderType: "Multiple" })), // Mark multiple orders
              ].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)); // Sort by latest order first

              return allOrders.length > 0 ? (
                <ul className="space-y-6">
                  {allOrders.map((order, index) => (
                    <li
                      key={index}
                      className={`p-6 border-l-4 rounded-md shadow-md transition-colors duration-500 flex justify-between items-center ${
                        darkMode
                          ? order.orderType === "Single"
                            ? "bg-gray-800 text-white border-blue-500"
                            : "bg-gray-800 text-white border-green-500"
                          : order.orderType === "Single"
                          ? "bg-gray-100 text-gray-900 border-blue-500"
                          : "bg-gray-100 text-gray-900 border-green-500"
                      }`}
                    >
                      {/* Single Order UI */}
                      {order.orderType === "Single" ? (
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{getCropName(order.cropName)}</h3>
                          <p className="text-sm mb-1">
                            <span className="font-medium">{translations[language].yourcrops.buyer} :</span> {order.buyerName} ({order.buyerMobile})
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">{translations[language].yourcrops.quantity} :</span> {order.quantityOrdered} {translations[language].kg_Lang}
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">{translations[language].yourcrops.price} :</span> ₹{order.totalPrice}
                          </p>
                          <p className="text-sm mb-1">
                            <span className="font-medium">{translations[language].yourcrops.paymentType} : {translations[language].yourcrops?.[toCamelCase(order.paymentMethod)]}</span> 
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">{translations[language].yourcrops.status} : </span>{" "}
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === "Ordered"
                                  ? "bg-yellow-500 text-white"
                                  : order.status === "Packed"
                                  ? "bg-blue-500 text-white"
                                  : order.status === "Shipped"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                              }`}
                            >
                              {translations[language].orderStatus[toCamelCase(order.status)]}
                            </span>
                          </p>
                        </div>
                      ) : (
                        // Multi-Crop Order UI
                        <div>
                          <h3 className="text-xl font-bold mb-2">👤 {order.buyerName} ({order.buyerMobile})</h3>

                          {/* Crops List */}
                          <div className="space-y-2 mb-2">
                            {order.crops.map((crop, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <p>
                                  <span className="font-medium">{getCropName(crop.cropName)}: </span> {crop.orderedKg} {translations[language].kg_Lang} -(₹{crop.totalPrice})
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Total Amount & Payment Type */}
                          <p className="text-sm font-medium mt-2">
                            <span>{translations[language].yourcrops.totalAmount}: </span> ₹{order.totalOrderAmount}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">{translations[language].yourcrops.paymentType}: </span> {translations[language].yourcrops?.[toCamelCase(order.paymentMethod)]}
                          </p>

                          {/* Status */}
                          <p className="text-sm">
                            <span className="font-medium">{translations[language].yourcrops.status}: </span>{" "}
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === "Ordered"
                                  ? "bg-yellow-500 text-white"
                                  : order.status === "Packed"
                                  ? "bg-blue-500 text-white"
                                  : order.status === "Shipped"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                              }`}
                            >
                              {translations[language].orderStatus[toCamelCase(order.status)]}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Status Change Buttons (Right-Aligned for Both Types) */}
                      <div className="flex flex-col gap-4">
                        {order.status === "Ordered" && (
                          <button
                            onClick={() =>
                              order.orderType === "Single"
                                ? handleStatusChange(
                                    order.cropName,
                                    order.buyerMobile,
                                    order.farmerMobile,
                                    order.buyerName,
                                    order.orderedAt,
                                    "Packed"
                                  )
                                : handleMultipleOrderStatusChange(
                                    order.buyerMobile,
                                    order.farmerMobile,
                                    order.buyerName,
                                    order.orderedAt,
                                    "Packed"
                                  )
                            }
                            className="px-5 py-2 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                          >
                            {translations[language].yourcrops.markAsPacked}
                          </button>
                        )}
                        {order.status === "Packed" && (
                          <button
                            onClick={() =>
                              order.orderType === "Single"
                                ? handleStatusChange(
                                    order.cropName,
                                    order.buyerMobile,
                                    order.farmerMobile,
                                    order.buyerName,
                                    order.orderedAt,
                                    "Shipped"
                                  )
                                : handleMultipleOrderStatusChange(
                                    order.buyerMobile,
                                    order.farmerMobile,
                                    order.buyerName,
                                    order.orderedAt,
                                    "Shipped"
                                  )
                            }
                            className="px-5 py-2 text-sm rounded-md font-medium bg-green-500 text-white hover:bg-green-600 transition"
                          >
                            {translations[language].yourcrops.markAsShipped}
                          </button>
                        )}
                        {order.status !== "Completed" && order.status !== "Cancelled" && order.status !== "Returned" &&(
                          <button
                            onClick={() => handleCancelClick(order)}
                            className="px-5 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition"
                          >
                            {translations[language].yourcrops.cancelOrder}
                          </button>
                        )}

                        {order.status === "Returned" && order.returnStatus === "Returning" && (  
                          <button
                            onClick={() =>
                              order.orderType === "Single"
                                ? handleReturnOrder(
                                    order.cropName,
                                    order.buyerMobile,
                                    order.farmerMobile,
                                    order.buyerName,
                                    order.orderedAt,
                                    "Single"
                                  )
                                : handleReturnOrder(
                                  "",
                                  order.buyerMobile,
                                  order.farmerMobile,
                                  order.buyerName,
                                  order.orderedAt,
                                  "Multiple"
                                )
                            }
                            className="px-5 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition"
                          >
                            {translations[language].adminPage.verifyReturn}
                          </button>
                        )}
                        {order.status === "Returned" && order.returnStatus === "Returned" && (
                            <p className="text-center text-base md:text-lg font-semibold italic text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mx-auto max-w-md shadow-sm" >{order.returnReason} </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-lg font-medium mt-8">{translations[language].yourcrops.noOrders}</p>
              );
            })()}
          </div>
        </div>
      )}

      {/* Show Crops */}
      {showCrops && (
        <div className={`fixed top-[5rem] bottom-[3.6rem] left-0 w-full p-6 z-50 rounded-lg shadow-lg transition-colors duration-500 ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
          
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-bold">{translations[language].yourCrops}</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowFilters(!showFilters)}
                className="px-5 py-2 text-sm rounded-md font-medium bg-gray-500 text-white hover:bg-gray-600 transition">
                {showFilters ? translations[language].hideFilters : translations[language].filter}
              </button>
              <button onClick={() => setShowCrops(false)}
                className="px-5 py-2 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition">
                {translations[language].back}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="p-6 mt-4 mb-8 rounded-md shadow-md border transition-colors duration-500 space-y-4">
              <h3 className="text-md font-bold mb-2">{translations[language].filterOptions}</h3>
              <div className="flex flex-wrap gap-4">
                <input type="number" placeholder={translations[language].priceUnder} value={priceUnder} onChange={(e) => setPriceUnder(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white" />
                <input type="number" placeholder={translations[language].priceOver} value={priceOver} onChange={(e) => setPriceOver(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white" />
                <button onClick={applyFilters}
                  className="px-5 py-2 text-sm rounded-md font-medium bg-green-500 text-white hover:bg-green-600 transition">
                  {translations[language].applyFilters}
                </button>
              </div>
            </div>
          )}

          {/* Crops List */}
          <div className="mt-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
            <ul className="space-y-4">
              {crops.map((crop) => (
                <li key={`${crop.name}-${crop.productionDate}`}
                  className={`p-4 border-b rounded-lg shadow-sm transition-colors duration-500 flex justify-between items-center ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                  
                  <div>
                    <h4 className="text-xl font-semibold">{getCropName(crop.name)} ({getCropVariety(crop.variety)})</h4>
                    <p><span className="font-medium">{translations[language].totalQuantity}:</span> {crop.totalQuantity} kg</p>
                    <p><span className="font-medium">{translations[language].availableQuantity}:</span> {crop.availableQuantity} kg</p>
                    <p><span className="font-medium">{translations[language].productionDate}:</span> {new Date(crop.productionDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">{translations[language].bestBefore}:</span> {new Date(crop.bestBefore).toLocaleDateString()}</p>
                    <p><span className="font-medium">{translations[language].price}:</span> ₹{crop.price} {translations[language].per_kg}</p>
                    <p><span className="font-medium">{translations[language].rating}: </span> {crop.averageRating ? `${crop.averageRating}⭐` : translations[language].noRatingYet} ({crop.ratingCount} {translations[language].rating})</p>
                  </div>

                  {/* Edit Mode */}
                  {editCrop?.name === crop.name && editCrop?.productionDate === crop.productionDate ? (
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? "text-white" : "text-black"}`}>
                        {translations[language].price} (₹)
                      </label>
                      <input type="number" value={updatedPrice} onChange={(e) => setUpdatedPrice(e.target.value)}
                        className="w-full p-2 border rounded-md text-black" />
                      <label className={`block text-sm font-medium mt-2 ${darkMode ? "text-white" : "text-black"}`}>
                        {translations[language].availableQuantity} (kg)
                      </label>
                      <input type="number" value={updatedQuantity} onChange={(e) => setUpdatedQuantity(e.target.value)}
                        className="w-full p-2 border rounded-md text-black" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleSaveCrop(crop)}
                          className="px-4 py-2 rounded-md font-medium bg-green-500 text-white hover:bg-green-600 transition">
                          {translations[language].save}
                        </button>
                        <button onClick={() => setEditCrop(null)}
                          className="px-4 py-2 rounded-md font-medium bg-gray-500 text-white hover:bg-gray-600 transition">
                          {translations[language].cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleEdit(crop)}
                      className="px-4 py-2 text-sm rounded-md font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition">
                      {translations[language].update}
                    </button>
                    <button onClick={() => handleDeleteClick(crop)}
                      className="px-4 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition">
                      {translations[language].delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 🔮 Crop Price Prediction Section */}
      {showPrediction && (
        <section
          className={`fixed top-[5rem] bottom-18 left-0 right-0 h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 rounded-lg mb-4 transition-colors duration-500
          ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900 shadow-md"}
          mx-auto w-auto`}
        >
          <h3 className="text-2xl font-semibold mb-4 text-center">
            🔮 {translations[language].cropPrediction.title}
          </h3>

          {/* 🌾 Crop Variety & Name Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crop Variety Dropdown */}
            <div>
              <label className="block text-lg font-medium">
                🌱 {translations[language].cropPrediction.selectVariety}
              </label>
              <select
                value={selectedVariety}
                onChange={(e) => {
                  setSelectedVariety(e.target.value);
                  setSelectedCrop(""); // Reset crop selection when variety changes
                }}
                className="w-full p-2 border rounded-md outline-none bg-white text-black"
              >
                <option value="">
                  -- {translations[language].cropPrediction.selectVariety} --
                </option>
                {cropVarieties.map((variety, i) => (
                  <option key={variety} value={variety}>
                    {translations[language].cropVarieties[i]}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Name Dropdown */}
            <div>
              <label className="block text-lg font-medium">
                🌾 {translations[language].cropPrediction.selectCrop}
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2 border rounded-md outline-none bg-white text-black"
                disabled={!selectedVariety} // Disable if no variety is selected
              >
                <option value="">
                  -- {translations[language].cropPrediction.selectCrop} --
                </option>
                {selectedVariety &&
                  getCropOptions().map((crop, i) => {
                    const varietyIndex = cropVarieties.indexOf(selectedVariety);
                    const varietyKey = [
                      "vegetableOptions",
                      "fruitOptions",
                      "cerealsOptions",
                      "pulsesOptions",
                      "spicesOptions",
                    ][varietyIndex];

                    const translatedCrop = translations[language][varietyKey][i];

                    return (
                      <option key={crop} value={crop}>
                        {translatedCrop}
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          {/* 📅 Date, Season & Month (Aligned in Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {/* Production Date */}
            <div>
              <label className="block text-lg font-medium">
                📅 {translations[language].cropPrediction.productionDate}
              </label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full p-2 border rounded-md outline-none text-black"
              />
            </div>

            {/* Season (Auto-filled) */}
            <div>
              <label className="block text-lg font-medium">
                🌦️ {translations[language].cropPrediction.season}
              </label>
              <input
                type="text"
                value={translations[language].seasons[season]}
                disabled
                className="w-full p-2 border rounded-md bg-gray-200 cursor-not-allowed text-black"
              />
            </div>

            {/* Month (Auto-filled) */}
            <div>
              <label className="block text-lg font-medium">
                📆 {translations[language].cropPrediction.month}
              </label>
              <input
                type="text"
                value={translations[language].months[month]}
                disabled
                className="w-full p-2 border rounded-md bg-gray-200 cursor-not-allowed text-black"
              />
            </div>
          </div>

          {/* 💰 MSP Input */}
          <div className="mt-4">
            <label className="block text-lg font-medium">
              💰 {translations[language].cropPrediction.msp}
            </label>
            <input
              type="number"
              value={msp}
              onChange={(e) => setMsp(e.target.value)}
              className="w-full p-2 border rounded-md outline-none text-black"
              placeholder={translations[language].cropPrediction.mspPlaceholder}
            />
          </div>

          {/* Buttons: Predict & Clear */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {/* 🔍 Predict Button */}
            <button
              onClick={handlePredictPrice}
              className={`w-full md:w-1/2 py-2 rounded-md font-medium
              ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            >
              🔍 {translations[language].cropPrediction.predict}
            </button>

            {/* 🧹 Clear Button */}
            <button
              onClick={() => {
                setSelectedVariety("");
                setSelectedCrop("");
                setProductionDate("");
                setMsp("");
                setMonth("");
                setSeason("");
                setPredictedPrice(null);
              }}
              className={`w-full md:w-1/2 py-2 rounded-md font-medium
              ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white`}
            >
              🧹 {translations[language].cropPrediction.clear}
            </button>
          </div>

          {/* Output Section */}
          {predictedPrice && (
            <div className="mt-4 p-4 rounded-md text-center text-black text-lg font-bold border border-gray-300 bg-gray-50">
              <p>
                {translations[language].cropPrediction.farmerPrice}: ₹{predictedPrice.farmerPrice}/{translations[language].kg_Lang}
              </p>
              <p>
                {translations[language].cropPrediction.marketPrice}: ₹{predictedPrice.marketPrice}/{translations[language].kg_Lang}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Profile Page */}
      {showProfile && (
        <div
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] flex justify-center items-center p-4 z-50 transition-colors duration-500 ${
            darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
          }`}
        >
          <div
            className={`w-full max-w-2xl rounded-xl shadow-lg p-8 space-y-6 border transition-all duration-500 ${
              darkMode ? "bg-[#1e293b] border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-3xl font-semibold flex items-center space-x-2">
                👤 <span>{translations[language].profile.titleFarmer}</span>
              </h1>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              {[
                { label: translations[language].profile.name, value: profile.name, editable: false },
                { label: translations[language].profile.mobile, value: profile.mobile, editable: false },
                { label: translations[language].profile.email, value: profile.email || translations[language].profile.notProvided, editable: true, type: "email", name: "email" },
                { label: translations[language].profile.village, value: profile.village, editable: true, type: "text", name: "village" },
                { label: translations[language].profile.district, value: profile.district, editable: true, type: "text", name: "district" },
                { label: translations[language].profile.state, value: profile.state, editable: true, type: "text", name: "state" },
                { label: translations[language].profile.pincode, value: profile.pincode, editable: true, type: "text", name: "pincode" },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-3">
                  <label className="font-medium text-lg">{item.label}:</label>
                  {editMode && item.editable ? (
                    <input
                      type={item.type}
                      name={item.name}
                      value={editedProfile[item.name]}
                      onChange={(e) => handleChange(e, setEditedProfile)}
                      className={`w-[60%] p-2 rounded-lg border focus:ring-2 transition-all ${
                        darkMode ? "bg-gray-700 border-gray-600 focus:ring-blue-500" : "bg-gray-100 border-gray-300 focus:ring-indigo-500"
                      }`}
                    />
                  ) : (
                    <p className="text-md font-medium">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              {editMode ? (
                <>
                  <button
                    onClick={() => handleSave(editedProfile, setProfile, setEditMode)}
                    className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition duration-300 shadow-md"
                  >
                    💾 {translations[language].buttons.save}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 transition duration-300 shadow-md"
                  >
                    ❌ {translations[language].buttons.cancel}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition duration-300 shadow-md"
                  >
                    ✏️ {translations[language].buttons.edit}
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition duration-300 shadow-md"
                  >
                    🚪 {translations[language].buttons.logout}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Home Dashboard */}
      {!showCrops && !showNotifications && !showSearch && !showAddCrop && !showProfile && !showSettings && !showFriends && !showChat && !showOrderStatus && !showPrediction &&(
        <div className={`fixed top-[5rem] bottom-18 left-0 right-0 h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 rounded-lg transition-colors duration-500 
            ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-black"}`}>
          <h1 className="text-4xl font-bold mb-8">📊 {translations[language].farmerDashboard}</h1>

          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Crops */}
            <div
              className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
              onClick={() => setShowCrops(true)}
            >
              <h2 className="text-xl font-bold mb-2">🌾 {translations[language].totalCropsList}</h2>
              <p className="text-4xl font-extrabold">{crops.length}</p>
            </div>

            {/* Pending Orders and Delivered Orders */}
            <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
              onClick={() => {setStatusFilter("Pending");setShowOrderStatus(true);}}
            >
              <h2 className="text-xl font-bold mb-2">📦 {translations[language].pendingOrdersLang}</h2>
              <p className="text-4xl font-extrabold">{pendingOrders.length}</p>
              {/* <h2 className="text-xl font-bold mb-2">📦 Pending Orders: {pendingOrders.length}</h2>
              <h2 className="text-xl font-bold mb-2">✅ Delivered Orders: {deliveredOrders.length}</h2> */}
            </div>
   
            <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
              darkMode ? "bg-gray-800" : "bg-gray-100"}`} 
              onClick={() => {setStatusFilter("Completed");setShowFilters(false);setShowOrderStatus(true);}}>
              <h2 className="text-xl font-bold mb-2">✅ {translations[language].deliveredOrdersLang}</h2>
              <p className="text-4xl font-extrabold">{deliveredOrders.length}</p>
            </div>

            {/* Total Price Earned */}
            <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
                darkMode ? "bg-gray-800" : "bg-gray-100"}`} onClick={() => {setStatusFilter("");setShowOrderStatus(true);}}>
              <h2 className="text-xl font-bold mb-2">💰 {translations[language].totalPriceEarned}</h2>
              <p className="text-4xl font-extrabold">₹{totalEarnings}</p>
            </div>
            
            <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
              darkMode ? "bg-gray-800" : "bg-gray-100"}`} 
              onClick={() => window.open("https://www.agmarknet.gov.in/SearchCmmMkt.aspx", "_blank")}>
              <h2 className="text-xl font-bold mb-2">📈 {translations[language].realTimePrice}</h2>
              <h1 className="text-xl font-bold mb-2">{translations[language].checkNow}</h1>          
            </div>

            <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105 ${
              darkMode ? "bg-gray-800" : "bg-gray-100"}`} 
              onClick={() => setShowPrediction(true)}>
              <h2 className="text-xl font-bold mb-2">📈 {translations[language].pricePrediction}</h2>
              <h1 className="text-xl font-bold mb-2">{translations[language].predictNow}</h1>          
            </div>
          </div>
          
          {/* Recent Orders Section */}
          <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">📜 {translations[language].recentOrders}</h2>

            {orders.length === 0 && multipleOrders.length === 0 ? (
              <p className="text-lg">{translations[language].noRecentOrders}</p>
            ) : (
              <ul className="space-y-4">
                {([...orders, ...multipleOrders] // Combine single & multi orders
                  .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)) // Sort by latest first
                  .slice(0, 5) // Show only 5 recent orders
                ).map((order, index) => (
                  <li key={index} className={`p-4 rounded-lg shadow-md flex justify-between ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                    <div>
                      <p className="text-lg font-bold">
                      {order.cropName ? getCropName(order.cropName) : ""}
                      </p>

                      {order.cropName ? (
                        <>
                          <p className="text-lg">{translations[language].buyerLang} - {order.buyerName}</p>
                          <p className="text-sm">{translations[language].quantityLang}: {order.quantityOrdered} {translations[language].kg_Lang}</p>
                          <p className="text-sm">{translations[language].priceLang}: ₹{order.totalPrice}</p>
                        </>
                      ) : (
                        <>
                          {/* Display multiple crops */}
                          <p className="text-sm font-semibold">{translations[language].cropsLang}</p>
                          <ul className="ml-4 text-sm">
                            {order.crops.map((crop, idx) => (
                              <li key={idx} className="list-disc">
                                {getCropName(crop.cropName)}: {crop.orderedKg} {translations[language].kg_Lang} - ₹{crop.totalPrice}
                              </li>
                            ))}
                          </ul>
                          <p className="text-lg">{translations[language].buyerLang} - {order.buyerName}</p>
                          <p className="text-sm font-semibold mt-2">{translations[language].totalPriceLang}: ₹{order.totalOrderAmount}</p>
                        </>
                      )}
                    </div>
                    <p className="text-lg font-extrabold">{translations[language].orderStatus[order.status.toLowerCase().replace(/\s/g, "")] || order.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>
      )}

      {/* Bottom Taskbar (Always Visible) */}
      <nav className={`fixed bottom-0 left-0 w-full h-18 flex justify-around items-center p-4 border-t z-50 transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white border-gray-700" : "bg-white text-gray-800 border-gray-300"}`}>

        <FaHome className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { navigate("/farmer-home"); setShowSearch(false); setShowNotifications(false); setShowProfile(false); setShowSettings(false); setShowAddCrop(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false); }} />

        <FaSearch className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { setShowSearch(true); setShowNotifications(false); setShowAddCrop(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false);}} />
        {/* To remove after clicking search icon --- """setCropSearchQuery("");setSearchQuery("");setCropSearchResults([]); setSearchResults(null);""""  */}

        <FaPlusCircle className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { setShowAddCrop(true); setShowNotifications(false); setShowSearch(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false); }} />

        <FaBell className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { setShowNotifications(true); setShowSearch(false); setShowAddCrop(false); setShowProfile(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false); }} />

        <FaUser className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { setShowProfile(true); setShowSearch(false); setShowNotifications(false); setShowAddCrop(false); setShowSettings(false); setShowFriends(false); setShowChat(false); setShowOrderStatus(false);setShowCrops(false);setShowPrediction(false); }} />

        {/* Voice Assistant Button */}
        <FaMicrophone 
          onClick={startVoiceRecognition}
          className={`w-6 h-6 cursor-pointer hover:scale-110 transition ${listening ? "bg-green-500 animate-pulse rounded-full text-white" : ""}`}
        />
      
      </nav>
    </div>
  );
};


export default FarmerHome;