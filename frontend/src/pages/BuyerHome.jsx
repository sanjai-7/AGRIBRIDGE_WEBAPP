import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBox,  FaUser, FaSearch, FaBell, FaCog, FaUserFriends, FaShoppingCart,  FaMicrophone  } from "react-icons/fa";
import { MdChat } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import ConfirmModal from '../components/ConfirmModal';
import { fetchFriends, fetchUnreadMessages, fetchUnreadMessagesPerFriend } from "../utils/fetchService";
import { handleSearch, handleAcceptRequest, handleDeclineRequest, handleChange, handleCropSearch, handleSave, clearNotifications,
         handleSelectFriend, sendMessage, markAllAsRead, handleRemoveFriend, handleAddFriend} from "../utils/handleService";
import SettingsView from "../components/SettingsView"; // Adjust the path as needed
import NotificationsView from "../components/NotificationsView";
import FriendsList from "../components/FriendsList";
import SearchView from "../components/SearchView";
import ChatBox from "../components/chatBox";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";

const BuyerHome = () => {
  const { language, setLanguage } = useLanguage();  // Get current language

  const [buyer, setBuyer] = useState(null);
  const [buyerName, setBuyerName] = useState("Buyer");

  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState(JSON.parse(localStorage.getItem("recentSearches")) || []);
  const [cropSearchQuery, setCropSearchQuery] = useState("");
  const [cropSearchResults, setCropSearchResults] = useState([]);
  const [recentCropSearches, setRecentCropSearches] = useState(JSON.parse(localStorage.getItem("recentCropSearches")) || []);

  const [friendshipStatus, setFriendshipStatus] = useState("Add Friend");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  const [showChat, setShowChat] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [chatNotifications, setChatNotifications] = useState(0);
  const [unreadMessagesPerFriend, setUnreadMessagesPerFriend] = useState({});
  
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [multipleOrders, setMultipleOrders] = useState([]);  // ✅ Always an array
  const [showOrders, setShowOrders] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState("");

  const [friendCrops, setFriendCrops] = useState([]);
  const [showCrops, setShowCrops] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { darkMode, setDarkMode } = useTheme();

  const [refreshKey, setRefreshKey] = useState(0);

  const [allCrops, setAllCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterVariety, setFilterVariety] = useState("");
  const [filterFarmerName, setFilterFarmerName] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterBestBefore, setFilterBestBefore] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]); // Store added items in cart
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [rating, setRating] = useState({});

  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState("");
  const [selectedCropP, setSelectedCropP] = useState("");

  const [season, setSeason] = useState("");
  const [month, setMonth] = useState("");
  const [msp, setMsp] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [productionDate, setProductionDate] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [listening, setListening] = useState(false);

  const cropVarieties = ["Vegetables", "Fruits", "Grains", "Pulses", "Spices"];
  const vegetableOptions = ["Tomato", "Potato", "Onion", "Carrot", "Cabbage", "Cauliflower", "Brinjal", "Spinach", "Lettuce", "Radish", "Beetroot",
    "Pumpkin","Cucumber", "Peas", "Bitter Gourd", "Bottle Gourd", "Ladyfinger", "Mushroom", "Broccoli", "Capsicum", "Ginger", "Garlic", 
    "Spring Onion", "Celery", "Chilli", "Coriander", "Dill", "Fenugreek", "Mint", "Drumstick"];
  const fruitOptions = ["Apple", "Banana", "Mango", "Grapes", "Orange", "Pineapple", "Guava", "Papaya", "Strawberry"];
  const pulsesOptions = ["Chickpeas", "Lentils", "Black Gram", "Green Gram", "Pigeon Pea"];
  const cerealsOptions = ["Wheat", "Rice", "Barley", "Maize", "Millets"];
  const spicesOptions = ["Turmeric", "Pepper", "Cardamom", "Cumin", "Coriander Seeds"];

  const navigate = useNavigate();

  // Toggle handler for notification preferences
  const handleToggle = (preference) => {
    setNotifications((prev) => ({
      ...prev,
      [preference]: !prev[preference],
    }));
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

  const getCropVariety = (variety) => {
    const index = translations.en.cropVarieties.indexOf(variety);
    return index !== -1 ? translations[language].cropVarieties[index] : variety;
  };
  
  const getCropName = (cropName) => {
    // if (!cropName) return language === "ta" ? "பல பயிர்கள்" : "Multiple Crops"; // Default text
    // All crop categories
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
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
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
      const homeCommands = ["home", "go home", "phone", "முகப்பு", "ஹோம்", "ஃபோன்", "horn", "corn"];
      const searchCommands = ["search", "சர்ச்", "தேடு", "தேடவும்", "td"];
      const buyerOrderCommands = ["orders", "your orders", "ஆர்டர்கள்", "உங்கள் ஆர்டர்கள்"];
      const themeCommands = ["change team", "change teen", "team", "teen", "theme", "change theme","சேஞ்ஜ் தீம்","தீம்","டீம்","பையன் முறை"];

      // ✅ Logout commands
      if (logoutCommands.some(word => speech.includes(word))) {
        navigate("/login");

      // ✅ Home commands
      } else if (homeCommands.some(word => speech.includes(word)) || speech.includes("back")|| speech.includes("பின்பு")|| speech.includes("பின்செல்")|| speech.includes("இன்பு")|| speech.includes("ம்பு")) {
        navigate("/buyer-home");setShowSearch(false);setShowNotifications(false);setShowProfile(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);setShowPrediction(false);

      // Farmer Friends
      } else if (speech.includes("friends") || speech.includes("farmer friends") || speech.includes("former friends") || speech.includes("நண்பர்கள்")) {
        setShowFriends(true);setShowSearch(false);setShowNotifications(false);setShowProfile(false);setShowChat(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);setShowPrediction(false);

      // Friends crops
      } else if (speech.includes("view listings") || speech.includes("available crops")|| speech.includes("friends crops")|| speech.includes("பயிர்களைப் பார்க்கவும்")|| speech.includes("பட்டியல்களை காண்க")|| speech.includes("நண்பர்களின் பயிர்கள்")|| speech.includes("கிடைக்கும் பயிர்கள்")|| speech.includes("கிடைக்கும் பயிர்களை பார்க்கவும்")|| speech.includes("பயிர்களை பார்க்கவும்")) {
        setShowCrops(true); handleViewListings();

      // Your Orders
      } else if (speech.includes("your orders") || speech.includes("orders")|| speech.includes("உங்கள் ஆர்டர்கள்")|| speech.includes("ஆர்டர்களை பார்க்கவும்")|| speech.includes("டிவோர்ஸ்")|| speech.includes("நிலுவையிலுள்ள ஆடுகள்")) {
        fetchBuyerOrders();fetchMultipleOrders();setShowOrders(true);setShowNotifications(false);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowCrops(false);setShowCart(false);

      // Real time price
      } else if (speech.includes("real time price") || speech.includes("நிகழ்நேர விலை")|| speech.includes("ரியல் டைம் ஃப்ரீஸ்")|| speech.includes("market price")|| speech.includes("check now")|| speech.includes("சரி பார்க்கவும்")|| speech.includes("சரிபார்க்கவும்")|| speech.includes("இப்போது சரி பார்க்கவும்")|| speech.includes("இப்போது சரிபார்க்கவும்")) {
        window.open("https://www.agmarknet.gov.in/SearchCmmMkt.aspx", "_blank");

      // Predict price
      } else if (speech.includes("price prediction") || speech.includes("predict now")|| speech.includes("பயிர் விலை கணிப்பு")|| speech.includes("இப்போது கடிக்கவும்")|| speech.includes("கணிக்கவும்")|| speech.includes("பிரிஸ்கிரிப்ஷன்")|| speech.includes("இப்போது கணிக்கவும்")) {
        setShowPrediction(true);

      // ✅ clear recent crop searches
      } else if (speech.includes("clear recent crop searches") || speech.includes("சமீபத்திய பயிர் தேடல்களை நீக்கவும்")|| speech.includes("பயிர் தேடல்களை நீக்கவும்")) {
        clearRecentCropSearches();

      // ✅ clear recent searches
      } else if (speech.includes("clear recent searches") || speech.includes("தேடல்களை நீக்கவும்")|| speech.includes("சமீபத்திய தேடல்களை நீக்கவும்")) {
        clearRecentSearches();

      // Search
      } else if (searchCommands.some(word => speech.includes(word))) {
        setShowSearch(true);setShowProfile(false);setShowNotifications(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);setShowPrediction(false);

      // Buyer orders
      } else if (buyerOrderCommands.some(word => speech.includes(word))) {
        fetchBuyerOrders();fetchMultipleOrders();setShowOrders(true);setShowNotifications(false);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowCrops(false);setShowCart(false);

        // Notifications
      } else if (speech.includes("notifications") || speech.includes("notification") || speech.includes("அறிவிப்புகள்")|| speech.includes("அறிவிப்பு")) {
        setShowNotifications(true);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);

      // Profile
      } else if (speech.includes("profile") || speech.includes("சுயவிவரம்") || speech.includes("ஃபைல்")) {
        setShowProfile(true);setShowSearch(false);setShowNotifications(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);

      // Friends
      } else if (speech.includes("friend") || speech.includes("friends") || speech.includes("நண்பர்கள்")) {
        fetchFriends(setFriends, setAdmins);setShowFriends(true);setShowChat(false);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowOrders(false);setShowCrops(false);setShowCart(false);

      // Cart
      } else if (speech.includes("cart") || speech.includes("கூடை")|| speech.includes("கூடி")) {
        setShowCart(true);setShowFriends(false);setShowChat(false);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowOrders(false);setShowCrops(false);

      // Chat
      } else if (speech.includes("chat") || speech.includes("உரையாடு")) {
        setShowChat(true);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowFriends(false);setShowOrders(false);setShowCrops(false);setShowCart(false);

      // Settings
      } else if (speech.includes("setting") || speech.includes("settings") || speech.includes("அமைப்புகள்")|| speech.includes("அமைப்புகளில்")) {
        setShowSettings(true);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowFriends(false);setShowOrders(false);setShowChat(false);setShowCrops(false);setShowCart(false);

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
    const token = localStorage.getItem("token");

    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.mobile) {
          setBuyer(parsedUser);
        } else {
          console.error("Invalid user data:", parsedUser);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      console.error("No user found in localStorage.");
    }
    
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch Buyer Profile
    axios.get("http://localhost:5000/buyer-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {setBuyerName(res.data.name);
        setProfile(res.data);
        setEditedProfile({ ...res.data }); // Ensure all fields are properly initialized
      })
      .catch(() => setBuyerName("Buyer"));

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


    fetchUnreadMessages(setChatNotifications);
    fetchUnreadMessagesPerFriend(setUnreadMessagesPerFriend);
    fetchFriends(setFriends, setAdmins);
    fetchBuyerOrders();
    fetchMultipleOrders();
    const container = document.querySelector("#messages-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [refreshKey,messages]);

  useEffect(() => {
    if (filterFarmerName) {
      applyFilters();
    }
  }, [filterFarmerName]); // ✅ Runs whenever filterFarmerName changes

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.mobile) {
          console.error("User data not found in localStorage!");
          return;
        }
        const response = await fetch(`http://localhost:5000/api/cart?buyerMobile=${user.mobile}`);
  
        if (!response.ok) throw new Error("Failed to fetch cart");
  
        const data = await response.json();
        setCartItems(data);
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };
  
    fetchCart();
  }, [buyer]);

  // useEffect(() => {
  //   if (showSearch) {
  //     handleViewListings(); // Fetch crops when search is opened
  //   }
  // }, [showSearch]); // Runs when showSearch changes
  
  useEffect(() => {
    handleViewListings();
  },[]);

  useEffect(() => {
    if (productionDate) {
      const date = new Date(productionDate);
      const monthName = date.toLocaleString("default", { month: "long" });
      const seasonName = getSeasonFromMonth(monthName);
  
      setMonth(monthName);
      setSeason(seasonName);
    }
  }, [productionDate]);

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
  };

  // Close modal
  const closeOrderModal = () => {
    setSelectedCrop(null);
    // setShowSearch(true);
    setOrderQuantity('');
    setErrorMessage('');
    handleViewListings();
    resetFilters();
  };

  // Handle order submission
  const handleOrderSubmit = async (SelectedCrop) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));

      const response = await fetch('http://localhost:5000/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: SelectedCrop.name || SelectedCrop.cropName,
          orderedKg: orderQuantity || SelectedCrop.quantityOrdered,
          totalPrice: Number(SelectedCrop.totalPrice || (orderQuantity * SelectedCrop.price)).toFixed(2),
          paymentMethod: paymentMethod ||SelectedCrop.paymentMethod  ,
          buyerName: user.name,
          buyerMobile: user.mobile,
          farmerName: SelectedCrop.farmerName,
          farmerMobile: SelectedCrop.farmerMobile,
          productionDate: SelectedCrop.productionDate,
          orderType:"Single",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order.');
      }

      alert('Order placed successfully!');

      if (SelectedCrop.cropName && !SelectedCrop.name) {
        await handleRemoveFromCart(
          SelectedCrop.cropName,
          SelectedCrop.farmerName,
          buyer.name,
          SelectedCrop.productionDate,
          SelectedCrop.addedAt,
          SelectedCrop.distance
        );
      }
      
      if (result.warning) {
        alert(result.warning); // Show warning if crop is expired
      }

      closeOrderModal();
    } catch (err) {
      console.error('Error placing order:', err.message);
      alert(err.message);
    }
  };

  const handleMultipleOrderSubmit = async () => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        const selectedCartItems = cartItems.filter((crop) => 
            selectedItems.has(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`)
        );

        if (selectedCartItems.length === 0) {
            alert("No items selected for ordering!");
            return;
        }

        // 🔥 Ensure all selected items belong to the same farmer
        const farmerNames = new Set(selectedCartItems.map((crop) => crop.farmerName));
        if (farmerNames.size > 1) {
            alert("All crops in a multiple order must belong to the same farmer!");
            return;
        }

         // 🔥 Ensure all selected items have the same payment method
         const paymentMethods = new Set(selectedCartItems.map((crop) => crop.paymentMethod));
         if (paymentMethods.size > 1) {
             alert("All crops in a multiple order must have the same payment method!");
             return;
         }

        // Calculate total order amount
        const totalOrderAmount = selectedCartItems.reduce((sum, crop) => sum + (crop.totalPrice ?? 0), 0);

        // Get the payment method (Assuming all items use the same method)
        const paymentMethod = selectedCartItems[0].paymentMethod;

        const orderData = {
            crops: selectedCartItems.map((crop) => ({
                cropName: crop.cropName,
                orderedKg: crop.quantityOrdered,
                totalPrice: Number(crop.totalPrice).toFixed(2),
                productionDate: crop.productionDate,
            })),
            buyerName: user.name,
            buyerMobile: user.mobile,
            farmerName: selectedCartItems[0].farmerName,
            farmerMobile: selectedCartItems[0].farmerMobile,
            orderType: "Multiple",
            totalOrderAmount, // ✅ Include total order price
            paymentMethod, // ✅ Payment method at order level
        };

        const response = await fetch("http://localhost:5000/api/multipleOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
        });

        const result = await response.json();

        if (response.ok) {
            alert("Order placed successfully!");

            // ✅ Remove ordered items from cart
            setCartItems((prevCart) =>
                prevCart.filter(
                    (crop) =>
                        !selectedCartItems.some(
                            (selected) =>
                                selected.cropName === crop.cropName &&
                                selected.farmerName === crop.farmerName &&
                                selected.productionDate === crop.productionDate
                        )
                )
            );
            // 🔥 Call backend API to remove these items from the database cart
            await Promise.all(
              selectedCartItems.map((crop) =>
                  handleRemoveFromCart(
                      crop.cropName,
                      crop.farmerName,
                      user.name,
                      crop.productionDate,
                      crop.addedAt,
                      crop.distance
                  )
              )
          );

            setSelectedItems(new Set());
        } else {
            alert(result.error);
        }
    } catch (err) {
        console.error("Error placing multiple orders:", err.message);
        alert("Failed to place orders. Please try again.");
    }
  };

  const fetchBuyerOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/buyer/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setBuyerOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching buyer orders:", error);
    }
  };

  const fetchMultipleOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/buyer/multiple-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Fetched Multiple Orders:", response.data.multipleOrders);
      setMultipleOrders(response.data.multipleOrders || []); // ✅ Ensure correct data usage
    } catch (error) {
      console.error("Error fetching multiple orders:", error);
      setMultipleOrders([]); // ✅ Prevent undefined errors
    }
  };

  const handleBuyerConfirmation = async (cropName, buyerMobile, buyerName, farmerMobile, orderedAt, isConfirmed) => {
    const status = isConfirmed ? "Completed" : "Out for Delivery";
    const message = isConfirmed
      ? `Your order of ${cropName} has been confirmed by ${buyerName}.`
      : `${buyerName} reported an issue with their order of ${cropName}.`;
    try {
      const response = await fetch('http://localhost:5000/api/buyer/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ cropName, buyerName, buyerMobile, farmerMobile, orderedAt, status, message }),
      });
  
      const result = await response.json();
      alert(result.message);
  
      // Instantly update the order status in the UI
      setBuyerOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.cropName === cropName &&
          order.buyerMobile === buyerMobile &&
          order.farmerMobile === farmerMobile &&
          order.orderedAt === orderedAt
            ? { ...order, status, confirmed: true }
            : order
        )
      );
      } catch (err) {
        console.error('Error confirming order:', err);
      }
  };

  const handleMultipleOrderConfirmation = async (orderId, buyerName, isConfirmed) => {
    const status = isConfirmed ? "Completed" : "Out for Delivery";
    const message = isConfirmed
      ? `Your multiple order has been confirmed by ${buyerName}.`
      : `${buyerName} reported an issue with their multiple order.`;
  
    try {
      const response = await fetch("http://localhost:5000/api/buyer/confirm-multiple-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ orderId, status, message }),
      });
  
      const result = await response.json();
      alert(result.message);
  
      if (response.ok) {
        // ✅ Update the order status instantly in multipleOrders
        setMultipleOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status, confirmed: true } : order
          )
        );
      }
    } catch (err) {
      console.error("Error confirming multiple order:", err);
    }
  };

  const handleChat = (friend) => {
    handleSelectFriend(friend,setSelectedFriend, setMessages, setRefreshKey);
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

  const handleSearchClick = useCallback(() => {
    handleSearch(searchQuery, setSearchResults, setShowFriends,updateRecentSearches, setFriendshipStatus, buyerName );
  }, [searchQuery, updateRecentSearches, buyerName]);

  const handleCropSearchClick = useCallback(() => {
    handleCropSearch(cropSearchQuery, buyer, setCropSearchResults, updateRecentCropSearches,);
  }, [cropSearchQuery, buyer, setCropSearchResults, updateRecentCropSearches]);

  const handleAddFriendClick = () => {
    handleAddFriend(searchResults.name, friendshipStatus, setFriendshipStatus);
  };

  const cropsToDisplay = (!filterFarmerName) ? friendCrops : filteredCrops;

  // Apply Filters
  const applyFilters = () => {
    let filtered = [...allCrops];
    
    if (filterName) {
      filtered = filtered.filter((crop) => 
        crop.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    if (filterVariety) {
      filtered = filtered.filter((crop) => 
        crop.variety.toLowerCase().includes(filterVariety.toLowerCase())
      );
    }
    if(filterFarmerName){
      filtered = filtered.filter((crop) => 
        crop.farmerName.toLowerCase().includes(filterFarmerName.toLowerCase())
      );
    }
    if (filterPrice) {
      filtered = filtered.filter((crop) => crop.price <= filterPrice);
    }
    if (filterBestBefore) {
      filtered = filtered.filter((crop) => 
        new Date(crop.bestBefore) >= new Date(filterBestBefore)
      );
    }

    // Sort by latest uploaded crop (assuming each crop has an "uploadedAt" timestamp)
    filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    setFilteredCrops(filtered);
  };

  // Function to reset filters and show all crops
  const resetFilters = () => {
    setFilterName("");
    setFilterVariety("");
    setFilterFarmerName("");
    setFilterPrice("");
    setFilterBestBefore("");
    setShowFilters(false);

    // Show all crops sorted by latest upload
    handleViewListings();
    setFilteredCrops([...filteredCrops].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
  };

  // Fetch Friend Crops
  const handleViewListings = async () => {
    try {
      const token = localStorage.getItem("token"); // Get auth token if required
      const response = await fetch("http://localhost:5000/api/friend-crops", {
        headers: {
          Authorization: `Bearer ${token}`, // Send auth token if needed
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched Friend Crops:", data);

      setFriendCrops(data.crops);
      setAllCrops(data.allCrops);
      setFilteredCrops(data.allCrops); // Initialize filtered crops
      
    } catch (error) {
      console.error("Error fetching friend's crops:", error);
    }
  };

  // Toggle crop selection
  const handleSelectCrop = (cropKey) => {
    setSelectedItems((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(cropKey)) {
        newSelected.delete(cropKey);
      } else {
        newSelected.add(cropKey);
      }
      return newSelected;
    });
  };

  const handleAddToCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
  
      const cartItem = {
        cropName: selectedCrop.name,
        quantityOrdered: orderQuantity,
        totalPrice: (orderQuantity * selectedCrop.price).toFixed(2),
        paymentMethod,
        buyerName: user.name,
        buyerMobile: user.mobile,
        farmerName: selectedCrop.farmerName,
        farmerMobile: selectedCrop.farmerMobile,
        distance: selectedCrop.distance,
        productionDate: selectedCrop.productionDate,
      };
  
      const response = await fetch("http://localhost:5000/api/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to add to cart.");
      }
  
      alert("Item added to cart successfully!");
      
      if (result.warning) {
        alert(result.warning); // Show warning if needed
      }
  
      // Update cart items state
      setCartItems([...cartItems, cartItem]);
  
      window.location.reload();
      closeOrderModal();
      setShowCrops(true);
    } catch (err) {
      console.error("Error adding to cart:", err.message);
      alert(err.message);
    }
  };

  const handleRemoveFromCart = async (cropName, farmerName, buyerName, productionDate, addedAt, distance) => {
    try {
      const response = await fetch("http://localhost:5000/api/removeCartItem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({cropName, farmerName, buyerName, productionDate, addedAt, distance}),
      });
  
      if (response.ok) {
        setCartItems((prevCart) =>
          prevCart.filter((crop) =>
            !(
              crop.cropName === cropName &&
              crop.farmerName === farmerName &&
              crop.buyerName === buyerName &&
              crop.productionDate === productionDate &&
              crop.addedAt === addedAt &&
              crop.distance === distance
            )
          )
        );
      } else {
          console.error("Failed to remove cart item:", await response.json());
      }
    } catch (error) {
        console.error("Error removing cart item:", error.message);
    }
  };

  // Function to handle rating submission
  const handleRating = async (orderId, newRating) => {
    try {
      const response = await fetch("http://localhost:5000/api/rate-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ orderId, rating: newRating }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      alert("Thank you for your rating!");
      setRating((prev) => ({ ...prev, [orderId]: newRating }));
      fetchBuyerOrders();
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert(err.message);
    }
  };

  const handleMultipleRatings = async (orderId, cropName, productionDate, newRating) => {
    try {
      const response = await fetch("http://localhost:5000/api/rate-multiple-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          orderId,
          ratings: [{ cropName, rating: newRating, productionDate }],
        }),
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
  
      alert("Thank you for your rating!");
      fetchMultipleOrders(); // Refresh the order list
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert(err.message);
    }
  };

  const handlePredictPrice = async () => {
  
    if (!selectedCropP || !productionDate || !season || !month || !msp) {
      alert("Please fill all the required fields!");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/getPrediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: selectedCropP,
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

  const handleCancelOrder = async (buyerMobile, farmerMobile, buyerName, orderedAt) => {
    try {
      const res = await fetch('http://localhost:5000/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerMobile,
          farmerMobile,
          buyerName,
          orderedAt,
          orderType: 'Single',
          role: "buyer"
        })
      });
  
      const data = await res.json();
      alert(data.message);
      fetchBuyerOrders();
      fetchMultipleOrders(); // Refresh the order list
      closeCancelModal();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };
  
  const handleCancelMultipleOrder = async (buyerMobile, farmerMobile, buyerName, orderedAt) => {
    try {
      const res = await fetch('http://localhost:5000/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerMobile,
          farmerMobile,
          buyerName,
          orderedAt,
          orderType: 'Multiple',
          role: "buyer"
        })
      });
  
      const data = await res.json();
      alert(data.message);
      // Optionally refresh orders here
      fetchBuyerOrders();
      fetchMultipleOrders(); // Refresh the order list
      closeCancelModal();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };

  const handleReturnOrder = async (orderId, farmerMobile, buyerMobile, orderedAt, orderType, returnReason) => {
    try {
      const response = await fetch("http://localhost:5000/api/return-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          farmerMobile,
          buyerMobile,
          orderedAt,
          orderType, // can be "Single" or "Multiple"
          returnReason
        }),
      });
  
      const data = await response.json();
      alert(data.message);
      fetchBuyerOrders();
      fetchMultipleOrders(); // Refresh the order list
  
    } catch (error) {
      console.error("Error returning order:", error);
      alert("Failed to return order");
    }
  };

  const handleConfirmCancel = () => {
    if (selectedOrder.orderType === 'Single') {
      handleCancelOrder(selectedOrder.buyerMobile, selectedOrder.farmerMobile, buyerName, selectedOrder.orderedAt);
    } else if (selectedOrder.orderType === 'Multiple'){
      handleCancelMultipleOrder(selectedOrder.buyerMobile, selectedOrder.farmerMobile, buyerName, selectedOrder.orderedAt);
    } else {
      console.log("Issue at handleConfirmCancel");
    }
  }

  const openCancelModal = (order) => {
    console.log("Found Order at open cancel model:", order);
    setSelectedOrder({id: order._id, farmerMobile: order.farmerMobile, buyerMobile: order.buyerMobile,
      orderedAt: order.orderedAt, orderType: order.orderType }); // Store the order details to pass to the modal
    // console.log("SelectedOrder name:", selectedOrder.cropName);
    setShowCancelModal(true); // Open the modal
  }
  
  const closeCancelModal = () => {
    setSelectedOrder(null);
    setShowCancelModal(false); // Close the modal
  };

  const openSupportChat = (type) => {
    const admin = admins[0];  // or choose any admin logic
    setSelectedFriend(admin);
    setNewMessage(`"${type}!" - `);
    setShowSettings(false);
    setShowChat(true);
  };
  

  // Return Function

  return (

    <div className="min-h-screen bg-gray-100 dark:bg-[#000c20] text-gray-800 dark:text-white">

      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 w-full h-20 flex justify-between border-b items-center px-6 z-50 shadow-md 
        transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white" : "bg-white text-gray-800"}`}>
        <h1 className="text-xl font-bold tracking-wide">{translations[language].title}</h1>
    
        {/* Icons Section */}
        <div className="flex space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Friends"
            onClick={() => {fetchFriends(setFriends, setAdmins);setShowFriends(true);setShowChat(false);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowOrders(false);setShowCrops(false);setShowCart(false);}}>
            <FaUserFriends className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Friends"
            onClick={() => {setShowCart(true);setShowFriends(false);setShowChat(false);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowOrders(false);setShowCrops(false);}}>
            <FaShoppingCart className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Chat"
            onClick={() => {setShowChat(true);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowFriends(false);setShowOrders(false);setShowCrops(false);setShowCart(false);}}>
            <MdChat className="w-5 h-5" />
          </button>
    
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Settings"
            onClick={() => {setShowSettings(true);setShowProfile(false);setShowSearch(false);setShowNotifications(false);setShowFriends(false);setShowOrders(false);setShowChat(false);setShowCrops(false);setShowCart(false);}}>
            <FaCog className="w-5 h-5" />
          </button>
        </div>
      </header>

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
          user={buyer}
          cropSearchResults={cropSearchResults}
          recentCropSearches={recentCropSearches}
          clearRecentCropSearches={clearRecentCropSearches}
          setSelectedCrop={setSelectedCrop}
          setFilterFarmerName={setFilterFarmerName}
          applyFilters={applyFilters} 
          setShowCrops={setShowCrops}
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

      {showNotifications && (
        <NotificationsView
          user={buyer}
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

      {/* Settings Page */}
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
          message={translations[language].removeFriend1.replace("{name}", selectedFriend?.name)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {showCancelModal && (
        <ConfirmModal
          message={translations[language].removeOrder}
          onConfirm={handleConfirmCancel}
          onCancel={closeCancelModal}
        />
      )}

      {selectedCrop  && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-lg transition-colors duration-500 ${
                          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">{translations[language].ordermodel.title}</h2>
            
            <p className="mb-2"><strong>{translations[language].ordermodel.crop}:</strong> {getCropName(selectedCrop.name)} </p>
            <p className="mb-2"><strong>{translations[language].ordermodel.variety}:</strong> {getCropVariety(selectedCrop.variety)}</p>
            <p className="mb-2"><strong>{translations[language].ordermodel.price}:</strong> ₹{selectedCrop.price}/{translations[language].kg_Lang}</p>
            <p className="mb-4"><strong>{translations[language].ordermodel.availableQuantity}:</strong> {selectedCrop.availableQuantity} {translations[language].kg_Lang}</p>
            <p className="mb-4"><strong>{translations[language].ordermodel.bestBefore}:</strong> {new Date(selectedCrop.bestBefore).toLocaleDateString("en-GB")}</p>


            {/* Quantity input */}
            <label htmlFor="quantity" className="block font-medium mb-2">
            {translations[language].ordermodel.enterQuantity}
            </label>
            <input
              id="quantity"
              type="number"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value)}
              placeholder={translations[language].ordermodel.enterQuantity}
              className={`w-full p-2 rounded-lg border outline-none mb-4 ${
                darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
              }`}
              min="1"
              max={selectedCrop.availableQuantity}
            />

            {/* Price Calculation */}
            {orderQuantity > 0 && (
              <p className="mb-4 text-lg">
                <strong>{translations[language].ordermodel.totalPrice}:</strong> ₹{(orderQuantity * selectedCrop.price).toFixed(2)}
              </p>
            )}

            {/* Payment options */}
            <label htmlFor="payment" className="block font-medium mb-2">
            {translations[language].ordermodel.choosePayment}
            </label>
            <select
              id="payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={`w-full p-2 rounded-lg border outline-none mb-4 ${
                darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              <option value="">{translations[language].ordermodel.paymentOptions.select}</option>
              <option value="Cash on Delivery">{translations[language].ordermodel.paymentOptions.cash}</option>
              <option value="Net Banking">{translations[language].ordermodel.paymentOptions.netBanking}</option>
              <option value="UPI">{translations[language].ordermodel.paymentOptions.upi}</option>
              <option value="Credit/Debit Card">{translations[language].ordermodel.paymentOptions.card}</option>
            </select>


            {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => handleOrderSubmit(selectedCrop)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode
                    ? "bg-green-600 text-white hover:bg-green-500"
                    : "bg-green-300 text-gray-900 hover:bg-green-400"
                }`}
              >
                {translations[language].ordermodel.confirmOrder}
              </button>

              {/* Add to Cart Button */}
              <button onClick={handleAddToCart} className="px-4 py-2 bg-yellow-500 text-white rounded-lg">
              {translations[language].ordermodel.addToCart}
              </button>

              <button
                onClick={closeOrderModal}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-red-300 text-gray-900 hover:bg-red-400"
                }`}
              >
                {translations[language].ordermodel.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrops && (
        <div
          className={`fixed top-[5rem] h-[calc(100vh-5rem-3.6rem)] left-0 w-full p-6 z-50 rounded-lg shadow-lg transition-colors duration-500 
                      ${ darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900" }`}
        >
          {/* Header: Back & Filter Button */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-bold">{translations[language].buyerPage.friendsCrops}</h3>

            <div className="flex gap-4">
              {/* Toggle Filters Button */}
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className="px-5 py-2 text-sm rounded-md font-medium bg-gray-500 text-white hover:bg-gray-600 transition"
              >
                {showFilters ? translations[language].buyerPage.hideFilters : translations[language].buyerPage.showFilters}
              </button>

              {/* Reset Filters Button (Only visible when filters are shown) */}
              <button
                onClick={resetFilters}
                className="px-5 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition"
              >
                {translations[language].buyerPage.resetFilters}
              </button>

              <button
                onClick={() => setShowCrops(false)}
                className="px-5 py-2 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                {translations[language].buyerPage.back}
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="p-6 mb-6 rounded-md shadow-md border transition-colors duration-500 space-y-4">
              <h3 className="text-md font-bold mb-2">{translations[language].buyerPage.filterOptions}</h3>
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder={translations[language].buyerPage.cropName}
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={translations[language].buyerPage.variety}
                  value={filterVariety}
                  onChange={(e) => setFilterVariety(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={translations[language].buyerPage.farmerName}
                  value={filterFarmerName}
                  onChange={(e) => setFilterFarmerName(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="number"
                  placeholder={translations[language].buyerPage.maxPrice}
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="date"
                  value={filterBestBefore}
                  onChange={(e) => setFilterBestBefore(e.target.value)}
                  className="p-3 rounded-md border bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={applyFilters}
                  className="px-5 py-2 text-sm rounded-md font-medium bg-green-500 text-white hover:bg-green-600 transition"
                >
                  {translations[language].buyerPage.applyFilters}
                </button>
              </div>
            </div>
          )}

          {/* Crops List - 3 per Row with Left Border */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(100vh-15rem)]">
            {cropsToDisplay.length > 0 ? (
              cropsToDisplay.map((crop, index) => (
                <div
                  key={index}
                  className={`p-6 border-l-4 rounded-lg shadow-md transition-colors duration-500 ${
                    darkMode ? "bg-gray-800 text-white border-green-500" : "bg-white text-black border-green-600"
                  }`}
                >
                  <div className="flex justify-between mb-2 items-center">
                    <h4 className="text-xl font-semibold">
                      {getCropName(crop.name)} ({getCropVariety(crop.variety)})
                    </h4>
                    <h5 className="text-xl font-semibold">{crop.farmerName}</h5>
                  </div>

                  <p> <span className="font-medium">{translations[language].buyerPage.totalQuantity}:</span> {crop.totalQuantity} kg </p>
                  <p> <span className="font-medium">{translations[language].buyerPage.availableQuantity}:</span> {crop.availableQuantity} kg </p>
                  <p> <span className="font-medium">{translations[language].buyerPage.productionDate}:</span> 
                      {new Date(crop.productionDate).toLocaleDateString()}
                  </p>
                  <p> <span className="font-medium">{translations[language].buyerPage.bestBefore}:</span> {new Date(crop.bestBefore).toLocaleDateString()} </p>
                  <p> <span className="font-medium">{translations[language].buyerPage.price}:</span> ₹{crop.price} {translations[language].buyerPage.perKg} </p>
                  <p> <span className="font-medium">{translations[language].buyerPage.rating}:</span> 
                      {crop.averageRating ? `${crop.averageRating}⭐` : translations[language].buyerPage.noRatings} 
                      ({crop.ratingCount} {translations[language].buyerPage.ratings})
                  </p>

                  {/* Order Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedCrop(crop)}
                      className="px-6 py-3 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                      {translations[language].buyerPage.order}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-lg mt-4">{translations[language].buyerPage.noCrops}</p>
            )}
          </div>
        </div>
      )}

      {showCart && (
        <div className={`fixed top-[5rem] bottom-18 left-0 right-0 w-full h-[calc(100vh-5rem-3.6rem)] border-b overflow-auto p-6 rounded-lg 
          shadow-xl transition-all duration-500 ${darkMode ? "bg-[#0a1124] text-white" : "bg-gray-100 text-black"} flex flex-col`}>
          {/* Cart Header */}
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="text-2xl font-bold flex items-center">
              📦 {translations[language].cart.title}
            </h2>
          </div>

          {/* Cart Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
            {cartItems.length > 0 ? (
              cartItems.map((crop) => (
                <div
                  key={crop._id || `${crop.cropName}-${crop.farmerName}-${crop.productionDate}`}
                  className={`p-5 border-l-4 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 
                              ${selectedItems.has(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`) ? "border-green-500" : "border-gray-400"}
                              ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>

                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold">{getCropName(crop.cropName)}</h4>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`)}
                        onChange={() => handleSelectCrop(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`)}
                        className="w-5 h-5 cursor-pointer accent-green-500"
                      />
                  </div>

                  <p className="text-sm"><span className="font-medium">{translations[language].cart.farmer}:</span> {crop.farmerName}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.quantity}:</span> {crop.quantityOrdered} {translations[language].kg_Lang}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.pricePerKg}:</span> ₹{(crop.totalPrice / crop.quantityOrdered).toFixed(2)}/{translations[language].kg_Lang}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.totalPrice}:</span> ₹{crop.totalPrice.toFixed(2)}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.payment}:</span> {translations[language].yourcrops?.[toCamelCase(crop.paymentMethod)]}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.distance}:</span> {crop.distance}</p>
                  <p className="text-sm"><span className="font-medium">{translations[language].cart.contact}:</span> {crop.farmerMobile}</p>

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      handleRemoveFromCart(crop.cropName, crop.farmerName, buyer.name, crop.productionDate, crop.addedAt, crop.distance ) }
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition w-full shadow-md"
                  >
                    ❌ {translations[language].cart.remove}
                  </button>
                </div>
               ))
              ) : (
                <p className="text-gray-500 text-center text-lg">{translations[language].cart.noItems}</p>
            )}
          </div>

          {/* Total Amount and Checkout */}
          {cartItems.length > 0 && (
            <div className="mt-6 flex justify-between items-center border-t pt-4">
              <h3 className="text-xl font-semibold">
                {translations[language].cart.totalAmount}: ₹
                {
                 ( cartItems.filter((crop) => selectedItems.has(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`))
                  .reduce((total, crop) => total + (Number(crop.totalPrice) || 0), 0)).toFixed(2)
                }
              </h3>

              {/* Order All Button */}
              <button
                onClick={() => {
                  const selectedCartItems = cartItems.filter((crop) =>
                    selectedItems.has(`${crop.cropName}-${crop.farmerName}-${crop.productionDate}`)
                  );
                  
                  if (selectedCartItems.length > 1) {
                    handleMultipleOrderSubmit();
                  } else {
                      handleOrderSubmit(selectedCartItems[0]);
                  }
                }}
                className="px-6 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition shadow-md"
                disabled={selectedItems.size === 0}
              >
                ✅ {translations[language].cart.orderAll}
              </button>
            </div>
          )}
        </div>
      )}

      {showOrders && (
        <div className={`fixed top-[5rem] bottom-18 left-0 right-0 w-full h-[calc(100vh-5rem-3.6rem)] border-b p-6 rounded-lg shadow-xl 
          transition-all duration-500 flex flex-col overflow-hidden ${darkMode ? "bg-[#00142b] text-white" : "bg-gray-100 text-black"}`}
        >
          {/* ✅ Fixed Header */}
          <div className="bg-inherit pb-2 border-b border-gray-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center">{translations[language].orders.title}</h2>
            </div>

            {/* ✅ Table Headers (Responsive) */}
            <div className="hidden md:grid grid-cols-6 gap-4 p-3 font-semibold bg-gray-700 text-white rounded-md">
              <span>{translations[language].orders.cropName}</span>
              <span>{translations[language].orders.quantity}</span>
              <span>{translations[language].orders.price}</span>
              <span>{translations[language].orders.orderedAt}</span>
              <span className="text-center">{translations[language].orders.status}</span>
              <span className="text-center">{translations[language].orders.action}</span>
            </div>
          </div>

          {/* ✅ Scrollable Orders List */}
          <div className="overflow-auto flex-1 mt-2">
            {[...(buyerOrders || []), ...(multipleOrders || [])]
              .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt))
              .map((order) => {
              const isMultiple = Array.isArray(order.crops) && order.crops.length > 0;

              return (
                <div
                  key={order._id || `${order.buyerName}-${order.orderedAt}`}
                  className={`p-4 rounded-lg shadow-md transition-all duration-300 mt-3 grid gap-4 items-center 
                    ${isMultiple ? "border border-gray-300" : "border border-gray-300"} 
                    ${darkMode ? "text-white bg-[#081f39]" : "text-black bg-white"}  md:grid-cols-6 grid-cols-1 text-sm md:text-base`}
                >
                  {isMultiple ? (
                      <div className="col-span-7">
                        {/* ✅ Crops List */}
                        {order.crops.map((crop, i) => (
                          <div
                            key={`${crop.cropName}-${i}`}
                            className="grid md:grid-cols-6 grid-cols-2 gap-4 p-2 items-center border-b border-gray-700"
                          >
                            <span className="font-medium">{getCropName(crop.cropName)}</span>
                            <span>{crop.orderedKg} {translations[language].kg_Lang}</span>
                            <span>₹ {crop.totalPrice}</span>
                            <span>{new Date(order.orderedAt).toLocaleString()}</span>
                            {/* <span className="text-center text-blue-400">{order.status}</span> */}
                            <span className="text-left md:text-center text-blue-400">{translations[language].orderStatus[order.status.replace(/\s+/g,'').toLowerCase()]}</span>

                            {/* ✅ Action Buttons for Delivered Orders */}
                            <span className="flex gap-2 items-center justify-center">
                              
                              {/* ✅ Show Rating (Horizontally) */}
                              {order.status === "Completed" && (
                                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md shadow-md">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, index) => (
                                      <span
                                        key={index}
                                        onClick={() =>
                                          handleMultipleRatings(order._id, crop.cropName, crop.productionDate, index + 1)
                                        }
                                        className={`cursor-pointer text-2xl transition-colors duration-200 ${
                                          index < crop.rating ? "text-yellow-400" : "text-gray-500"
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                    <span className="text-white text-sm ml-2">({crop.rating || 0}/5)</span>
                                  </div>
                                  
                                </div>
                              )}
                            </span>              
                          </div>
                        ))}
                    
                        {/* ✅ Total Price, Status & Actions */}
                        <div className="grid md:grid-cols-6 grid-cols-2 gap-4 p-2 items-center mt-3 font-medium bg-gray-800 text-white rounded-lg">
                          <span>{translations[language].orders.total}</span>
                          <span>{order.crops.reduce((sum, crop) => sum + crop.orderedKg, 0)} {translations[language].kg_Lang}</span>
                          <span>₹ {order.crops.reduce((sum, crop) => sum + crop.totalPrice, 0)}</span>
                          <span>{new Date(order.orderedAt).toLocaleString()}</span>
                          <span className="text-left md:text-center text-blue-400">{translations[language].orderStatus[order.status.toLowerCase()]}</span>
                          <span className="flex justify-center">

                            {order.status === "Completed" && (
                              <button
                                onClick={() => {
                                  setSelectedOrder({id: order._id, farmerMobile: order.farmerMobile, buyerMobile: order.buyerMobile,
                                                    orderedAt: order.orderedAt, orderType: "Multiple" });
                                  setShowReturnModal(true); }}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-md shadow transition-transform hover:scale-105"
                              >
                                {translations[language].return}
                              </button>
                            )}
                            {order.status === "Delivered" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMultipleOrderConfirmation(order._id, order.buyerName, true)}
                                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                                >
                                  {translations[language].orders.confirm}
                                </button>
                                <button
                                  onClick={() => handleMultipleOrderConfirmation(order._id, order.buyerName, false)}
                                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                                >
                                  {translations[language].orders.issue}
                                </button>
                              </div>
                            )}

                            {order.status !== "Completed" && order.status !== "Cancelled" && order.status !== "Returned" && order.status !== "Delivered" &&(
                              <button
                                onClick={() =>
                                  openCancelModal(order)
                                }
                                className="px-5 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition"
                              >
                                {translations[language].yourcrops.cancelOrder}
                              </button>
                            )}

                          </span>

                        </div>
                      </div>
                    ) : (
                      <>
                        <span>{getCropName(order.cropName)}</span>
                        <span>{order.quantityOrdered} {translations[language].kg_Lang}</span>
                        <span>₹ {order.totalPrice}</span>
                        <span>{new Date(order.orderedAt).toLocaleString()}</span>
                        <span className="text-left md:text-center text-blue-400">{translations[language].orderStatus[order.status.replace(/\s+/g,'').toLowerCase()]}</span>
                        <span>
                          {/* ✅ Action Buttons for Delivered Orders */}
                          {order.status === "Delivered" && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() =>
                                  handleBuyerConfirmation( order.cropName, order.buyerMobile, order.buyerName, order.farmerMobile, 
                                                          order.orderedAt, true )
                                }
                                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                              >
                                {translations[language].orders.confirm}
                              </button>
                              <button
                                onClick={() =>
                                  handleBuyerConfirmation( order.cropName, order.buyerMobile, order.buyerName, order.farmerMobile,
                                                          order.orderedAt, false )
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                              >
                                {translations[language].orders.issue}
                              </button>
                            </div>
                          )}
                          
                          {/* ✅ Always Editable Rating */}
                          {order.status === "Completed" && (
                            <div className="flex gap-2 items-center justify-center">

                              {/* ⭐ Clickable Stars */}
                              <div>
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    onClick={() => handleRating(order._id, i + 1)}  // Click to set rating
                                    className={`cursor-pointer text-2xl transition-colors duration-200 ${
                                      i < order.rating ? "text-yellow-400" : "text-gray-500"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                          
                              {/* Show Numeric Rating */}
                              <span className={`text-sm ml-2 ${darkMode ? "text-white" : "text-black"}`}>({order.rating || 0}/5)</span>
                              <button
                                onClick={() => {
                                  setSelectedOrder({id: order._id, farmerMobile: order.farmerMobile, buyerMobile: order.buyerMobile,
                                                    orderedAt: order.orderedAt, orderType: "Single" });
                                  setShowReturnModal(true); }}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-md shadow transition-transform hover:scale-105"
                              >
                                {translations[language].return}
                              </button>
                            </div>
                          )}

                          <span className="flex justify-center">
                            {order.status !== "Completed" && order.status !== "Cancelled" && order.status !== "Returned" && order.status !== "Delivered" &&(
                                <button
                                  onClick={() =>
                                    openCancelModal(order)
                                  }
                                  className="px-5 py-2 text-sm rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition"
                                >
                                  {translations[language].yourcrops.cancelOrder}
                                </button>                       
                            )}
                          </span>
                        </span>
                      </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-4">{translations[language].reasonForReturn}</h2>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={translations[language].reasonForReturnPlaceHolder}
              className="w-full border rounded-md p-2 mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                {translations[language].buttons.cancel}
              </button>
              <button
                onClick={() => {
                  if (!returnReason.trim()) {
                    alert("Please enter a reason for return.");
                    return;
                  }
                  handleReturnOrder(selectedOrder.id, selectedOrder.farmerMobile, selectedOrder.buyerMobile, selectedOrder.orderedAt,
                                    selectedOrder.orderType, returnReason );
                  setShowReturnModal(false);
                  setReturnReason("");
                }}
                disabled={!returnReason.trim()}
                className={`px-4 py-2 rounded-md ${
                  returnReason.trim()
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {translations[language].return}
              </button>

            </div>
          </div>
        </div>
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
                👤 <span>{translations[language].profile.titleBuyer}</span>
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
                  setSelectedCropP(""); // Reset crop selection when variety changes
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
                onChange={(e) => setSelectedCropP(e.target.value)}
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

      {/* Main Content */}
      {!showProfile && !showSearch && !showNotifications && !showChat && !showFriends && !showOrders && !showCrops && !showCart && !showPrediction && (
        <main
          className={`fixed top-[5rem] bottom-18 left-0 right-0 h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 transition-colors duration-500 
                      ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-black"}`}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ✅ Welcome Section */}
            <section className={`p-6 rounded-lg shadow-lg border flex flex-col items-center transition-all duration-500 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
            >
              <h2 className="text-3xl font-bold">👋 {translations[language].buyerPage.welcome} {buyerName}{"!"}</h2>
              <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {friendCrops.length > 0 
                  ? ` ${translations[language].buyerPage.newListings} ${friendCrops.length}`
                  : translations[language].buyerPage.noListings}
              </p>
            </section>
        
            {/* ✅ Farmer Friends Section */}
            <section className={`p-6 rounded-lg shadow-lg border flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
              onClick={() => setShowFriends(true)}
            >
              <h2 className="text-2xl font-bold">👨‍🌾 {translations[language].buyerPage.farmerFriends}</h2>
              <p className="text-lg text-center mt-2">{friends.filter(friend => friend.role === "farmer").length} {translations[language].buyerPage.farmersConnected}</p>
            </section>
        
            {/* ✅ Browse Crops Section */}
            <section className={`p-6 rounded-lg shadow-lg border flex flex-col items-center transition-all duration-500 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
            >
              <h2 className="text-2xl font-bold">🌾 {translations[language].buyerPage.browseCrops}</h2>
              <p className="text-lg mt-2 text-center">{translations[language].buyerPage.seeCrops}</p>
              <button
                onClick={() => { setShowCrops(true); handleViewListings(); }}
                className={`mt-4 px-6 py-3 rounded-md font-medium shadow-md transition-transform transform hover:scale-105 
                            ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
              >
                {translations[language].buyerPage.viewListings}
              </button>
            </section>
        
            {/* ✅ Your Orders Section */}
            <section className={`p-6 rounded-lg shadow-lg border flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
              onClick={() => setShowOrders(true)}
            >
              <h2 className="text-2xl font-bold">📦 {translations[language].buyerPage.yourOrders}</h2>
              <p className="text-lg mt-2 text-center">{translations[language].buyerPage.trackOrders}</p>
              <button className={`mt-4 px-6 py-3 rounded-md font-medium shadow-md transition 
                                  ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
              >
                {translations[language].buyerPage.viewOrders}
              </button>
            </section>
        
            {/* ✅ Crop Price Prediction Section */}
            <section className={`p-6 rounded-lg shadow-md border flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
              onClick={() => setShowPrediction(true)}
            >
              <h2 className="text-2xl font-bold">🔮 {translations[language].buyerPage.cropPrediction}</h2>
              <p className="text-lg text-center mt-2">{translations[language].buyerPage.predictFuture}</p>
              <button className={`mt-4 px-6 py-3 rounded-md font-medium shadow-md transition 
                                  ${darkMode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
              >
                {translations[language].buyerPage.predictNow}
              </button>
            </section>
        
            {/* ✅ Real-Time Price Section */}
            <section className={`p-6 rounded-lg shadow-md border flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105 
                                ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
              onClick={() => window.open("https://www.agmarknet.gov.in/SearchCmmMkt.aspx", "_blank")}
            >
              <h2 className="text-2xl font-bold text-center">📈 {translations[language].buyerPage.realTimePrices}</h2>
              <p className="text-lg text-center mt-2">{translations[language].buyerPage.getPrices}</p>
              <button className={`mt-4 px-6 py-3 rounded-md font-medium shadow-md transition 
                                  ${darkMode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
              >
                {translations[language].buyerPage.checkNow}
              </button>
            </section>
        
          </div>
        </main> 
      )}

      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 w-full h-18 flex justify-around items-center p-4 border-t z-50 transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white border-gray-700" : "bg-white text-gray-800 border-gray-300"}`}>
        
        <FaHome 
          className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {navigate("/buyer-home");setShowSearch(false);setShowNotifications(false);setShowProfile(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);setShowPrediction(false);}}/>

        <FaSearch 
          className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {setShowSearch(true);setShowProfile(false);setShowNotifications(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);setShowPrediction(false);}}/>

        <FaBox 
          className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {fetchBuyerOrders();fetchMultipleOrders();setShowOrders(true);setShowNotifications(false);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowCrops(false);setShowCart(false);}}/>

        <FaBell 
          className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {setShowNotifications(true);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);}}/>

        <FaUser 
          className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {setShowProfile(true);setShowSearch(false);setShowNotifications(false);setShowChat(false);setShowFriends(false);setShowSettings(false);setShowOrders(false);setShowCrops(false);setShowCart(false);}}/>
        
        {/* Voice Assistant Button */}
        <FaMicrophone 
          onClick={startVoiceRecognition}
          className={`w-6 h-6 cursor-pointer hover:scale-110 transition ${listening ? "bg-green-500 animate-pulse rounded-full text-white" : ""}`}
          />

      </nav>

    </div>
  );
};



export default BuyerHome;