import React, { useState, useEffect,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdChat } from "react-icons/md";
import { FaHome, FaSearch, FaUser, FaBell, FaCog, FaUserFriends, FaShoppingCart } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import SettingsView from "../components/SettingsView"; // Adjust the path as needed
import NotificationsView from "../components/NotificationsView";
import { fetchUnreadMessages, fetchUnreadMessagesPerFriend } from "../utils/fetchService";
import { handleSearch, handleCropSearch, handleSave, clearNotifications, sendMessage, markAllAsRead,} from "../utils/handleService";
import SearchView from "../components/SearchView";
import ChatBox from "../components/chatBox";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";

const AdminHome = () => {

  const { language } = useLanguage();  // Get current language

  const [admin, setAdmin] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);

  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState(JSON.parse(localStorage.getItem("recentSearches")) || []);

  const [cropSearchQuery, setCropSearchQuery] = useState("");
  const [cropSearchResults, setCropSearchResults] = useState([]);
  const [recentCropSearches, setRecentCropSearches] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [showChat, setShowChat] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatNotifications, setChatNotifications] = useState(0);
  const [unreadMessagesPerFriend, setUnreadMessagesPerFriend] = useState({});

  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  
  const [farmersCount, setFarmersCount] = useState(0);
  const [buyersCount, setBuyersCount] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [showListings, setShowListings] = useState(false);
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [farmerFilter, setFarmerFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  const [showSettings, setShowSettings] = useState(false);

  const { darkMode, setDarkMode } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const [season, setSeason] = useState("");
  const [month, setMonth] = useState("");
  const [msp, setMsp] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const cropVarieties = ["Vegetables", "Fruits", "Grains", "Pulses", "Spices"];
  const vegetableOptions = ["Tomato", "Potato", "Onion", "Carrot", "Cabbage", "Cauliflower", "Brinjal", "Spinach", "Lettuce", "Radish", "Beetroot",
    "Pumpkin","Cucumber", "Peas", "Bitter Gourd", "Bottle Gourd", "Ladyfinger", "Mushroom", "Broccoli", "Capsicum", "Ginger", "Garlic", 
    "Spring Onion", "Celery", "Chilli", "Coriander", "Dill", "Fenugreek", "Mint", "Drumstick"];
  const fruitOptions = ["Apple", "Banana", "Mango", "Grapes", "Orange", "Pineapple", "Guava", "Papaya", "Strawberry"];
  const pulsesOptions = ["Chickpeas", "Lentils", "Black Gram", "Green Gram", "Pigeon Pea"];
  const cerealsOptions = ["Wheat", "Rice", "Barley", "Maize", "Millets"];
  const spicesOptions = ["Turmeric", "Pepper", "Cardamom", "Cumin", "Coriander Seeds"];

  useEffect(() => {
    if (showListings) {
      fetchActiveListings();
    }
  }, [showListings]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.mobile) {
          setAdmin(parsedUser);
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

    fetchUsers();
    fetchOrders();
    fetchActiveListings();

    // Fetch Admin Profile
    axios.get("http://localhost:5000/admin-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {setAdminName(res.data.name);
        setProfile(res.data);
        setEditedProfile({ ...res.data }); // Ensure all fields are properly initialized
      })
      .catch(() => setAdminName("Admin"));

      axios.get("http://localhost:5000/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Fetched Notifications:", res.data); // Debugging
        setNotifications(res.data);
      })
      .catch(() => setNotifications([]));

      fetchUnreadMessages(setChatNotifications);
      fetchUnreadMessagesPerFriend(setUnreadMessagesPerFriend);
      //fetchFriends();
      const container = document.querySelector("#messages-container");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
    

  }, [refreshKey,messages]);

  useEffect(() => {
    if (productionDate) {
      const date = new Date(productionDate);
      const monthName = date.toLocaleString("default", { month: "long" });
      const seasonName = getSeasonFromMonth(monthName);
  
      setMonth(monthName);
      setSeason(seasonName);
    }
  }, [productionDate]);

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

  // ✅ Fetch active listings count
  const fetchActiveListings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/admin/activeListings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by latest production date
      const sortedCrops = response.data.crops.sort(
        (a, b) => new Date(b.productionDate) - new Date(a.productionDate)
      );
      setCrops(sortedCrops);
      setFilteredCrops(sortedCrops);
      setActiveListings(response.data.activeListings);
    } catch (error) {
      console.error("Error fetching active listings:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allUsers = response.data.users;

      // Count users based on roles
      const farmers = allUsers.filter((user) => user.role === "farmer").length;
      const buyers = allUsers.filter((user) => user.role === "buyer").length;

      setUsers(allUsers);
      setFarmersCount(farmers);
      setBuyersCount(buyers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
  
      // Fetch both single and multi-crop orders
      const [singleOrdersRes, multiOrdersRes] = await Promise.all([
        axios.get("http://localhost:5000/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/admin/multiCropOrders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      // Merge and sort both orders by latest first
      const mergedOrders = [...singleOrdersRes.data.orders, ...multiOrdersRes.data.multiCropOrders].sort(
        (a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)
      );
  
      // ✅ Count transactions (excluding "Completed" orders)
      const transactionCount = mergedOrders.filter(order => order.status !== "Completed").length;
  
      // Update state
      setOrders(mergedOrders);
      setTransactions(transactionCount);  // ✅ Update transaction count
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Toggle handler for notification preferences
  const handleToggle = (preference) => {
    setNotifications((prev) => ({
      ...prev,
      [preference]: !prev[preference],
    }));
  };

  // ✅ Handle Filtering
  const handleFilter = () => {
    let filtered = crops;

    if (farmerFilter) {
      filtered = filtered.filter((crop) =>
        crop.farmerName.toLowerCase().includes(farmerFilter.toLowerCase())
      );
    }

    if (priceFilter) {
      filtered = filtered.filter((crop) => crop.price <= parseFloat(priceFilter));
    }

    if (dateFilter) {
      filtered = filtered.filter((crop) => crop.productionDate.startsWith(dateFilter));
    }

    setFilteredCrops(filtered);
  };

  const handleChange = (e) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

  const updateRecentSearches = (query) => {
    const updatedSearches = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
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

  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
  
    // Fetch chat messages
    const res = await axios.post(
      "http://localhost:5000/get-chat",
      { friendId: friend._id },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
  
    setMessages(res.data.messages);
  
    try {
      // Mark messages as read only if they are from the selected friend
      await axios.post(
        "http://localhost:5000/mark-as-read",
        { friendId: friend._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
  
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSearchClick = useCallback(() => {
    handleSearch(searchQuery, setSearchResults, setShowUsers,updateRecentSearches, null, adminName );
  }, [searchQuery, updateRecentSearches, adminName]);

  const handleCropSearchClick = useCallback(() => {
    handleCropSearch(cropSearchQuery, admin, setCropSearchResults, updateRecentCropSearches,);
  }, [cropSearchQuery, admin, setCropSearchResults, updateRecentCropSearches]);

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

  // Return function

  return (

    <div className="min-h-screen bg-gray-100 dark:bg-[#000c20] text-gray-800 dark:text-white">
      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 w-full h-20 flex justify-between border-b items-center px-6 z-50 shadow-md 
                          transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white" : "bg-white text-gray-800"}`}>
        <h1 className="text-xl font-bold tracking-wide">{translations[language].title}</h1>

        {/* Icons Section */}
        <div className="flex space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Friends"
            onClick={() => {fetchUsers();setShowUsers(true);setShowSettings(false);setShowProfile(false);setShowSearch(false);setShowChat(false);setShowNotifications(false);setShowOrders(false);setShowListings(false);}}>
            <FaUserFriends className="w-5 h-5" />
          </button>

          
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Chat"
            onClick={() => {setShowChat(true);setShowSettings(false);setShowProfile(false);setShowUsers(false);setShowSearch(false);setShowNotifications(false);setShowOrders(false);setShowListings(false);}}>
            <MdChat className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Settings"
            onClick={() => {setShowSettings(true);setShowProfile(false);setShowUsers(false);setShowSearch(false);setShowChat(false);setShowNotifications(false);setShowOrders(false);setShowListings(false);}}>
            <FaCog className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showChat &&(
          <ChatBox
          showChat={showChat}
          darkMode={darkMode}
          friends={users}
          admins={[]}
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
        />
      )}

      {/* Search View */}
      {showSearch &&(
        <SearchView
          showSearch={showSearch}
          darkMode={darkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchClick={handleSearchClick}
          searchResults={searchResults}
          friendshipStatus={null} // Hide chat/add friend for admin
          handleChat={null} // Admin can't chat
          confirmRemove={null} // Admin can't remove
          handleAddFriendClick={null} // Admin can't add friends
          recentSearches={recentSearches}
          clearRecentSearches={clearRecentSearches}
          cropSearchQuery={cropSearchQuery}
          setCropSearchQuery={setCropSearchQuery}
          handleCropSearchClick={handleCropSearchClick}
          cropSearchResults={cropSearchResults}
          recentCropSearches={recentCropSearches}
          clearRecentCropSearches={clearRecentCropSearches}
          setSelectedCrop={null} // Admin can't order crops
          applyFilters={null} // No need to filter crops for admin
          setFilterFarmerName={null} // No need to filter by farmer name
          setShowCrops={null} // No crop listing for admin
          user={{ role: "admin" }} // Pass user role as admin
        />
      )}

      {showUsers && (
        <div
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 z-50 rounded-lg shadow-lg transition-colors duration-500 
                      ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
          {/* Table Header */}
          <h2 className="text-3xl font-bold mb-6">{translations[language].adminPage.allUsers}</h2>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr
                  className={`text-left text-lg font-semibold 
                  ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-900"}`}
                >
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.name}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.role}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.mobile}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.district}</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.mobile}
                      className={`transition duration-300 
                      ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                    >
                      <td className="py-3 px-6 border-b border-gray-600">{user.name}</td>
                      <td className="py-3 px-6 border-b border-gray-600">{user.role.toUpperCase()}</td>
                      <td className="py-3 px-6 border-b border-gray-600">{user.mobile}</td>
                      <td className="py-3 px-6 border-b border-gray-600">{user.district}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-4 text-center text-lg font-medium text-gray-500 dark:text-gray-400"
                    >
                      {translations[language].adminPage.noUsersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications View */}
      {showNotifications && (
        <NotificationsView
          user={admin}
          showNotifications={showNotifications}
          darkMode={darkMode}
          notifications={notifications}

          markAllAsRead={markAllAsRead}
          clearNotifications={clearNotifications}
          setNotifications={setNotifications}
        />
      )}

      {/* Profile Page */}
      {showProfile && (
        <div
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] flex justify-center items-center p-4 z-50 transition-colors duration-500 ${
            darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900" }`}
        >
          <div
            className={`w-full max-w-2xl rounded-xl shadow-lg p-8 space-y-6 border transition-all duration-500 ${
              darkMode ? "bg-[#1e293b] border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900" }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-3xl font-semibold flex items-center space-x-2">
                👤 <span>{translations[language].profile.titleAdmin}</span>
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

      {/* Settings Page */}
      {showSettings && (
        <SettingsView
          showSettings={showSettings}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          notifications={notifications}
          handleToggle={handleToggle}
        />
      )}

      {showOrders && (
        <div
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 z-50 transition-colors duration-500 
          ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
          {/* Header */}
          <h2 className="text-3xl font-bold mb-6">{translations[language].adminPage.ordersAndDeliveryStats}</h2>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr
                  className={`text-left text-lg font-semibold 
                  ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-900"}`}
                >
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.buyerName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.cropName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.farmerName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.quantityKg}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.status}</th>
                </tr>
              </thead>

              <tbody>
                {orders.length > 0 ? (
                  orders.map((order, index) => (
                    <tr key={index} className={`transition duration-300 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
                      {/* Buyer Name */}
                      <td className="py-3 px-6 border-b border-gray-600">{order.buyerName}</td>
                      
                      {/* Crop Name(s) */}
                      <td className="py-3 px-6 border-b border-gray-600">
                        {order.orderType === "Multiple"
                          ? order.crops.map((crop) => getCropName(crop.cropName)).join(", ")
                          : getCropName(order.cropName)}
                      </td>

                      {/* Farmer Name */}
                      <td className="py-3 px-6 border-b border-gray-600">{order.farmerName}</td>

                      {/* Quantity Ordered */}
                      <td className="py-3 px-6 border-b border-gray-600">
                        {order.orderType === "Multiple"
                          ? order.crops.map((crop) => `${crop.orderedKg} ${translations[language].kg_Lang}` ).join(", ")
                          : `${order.quantityOrdered} ${translations[language].kg_Lang}`}
                      </td>

                      {/* Order Status */}
                      <td className="py-3 px-6 border-b border-gray-600 font-medium">
                        {order.status === "Ordered" && translations[language].adminPage.waitingForPacking}
                        {order.status === "Packed" && translations[language].adminPage.readyToShip}
                        {order.status === "Shipped" && translations[language].adminPage.shipped}
                        {order.status === "Out for Delivery" && translations[language].adminPage.outForDelivery}
                        {order.status === "Delivered" && translations[language].adminPage.delivering}
                        {order.status === "Completed" && translations[language].adminPage.completed}
                        {order.status === "Cancelled" && translations[language].orderStatus.cancelled}
                        {order.status === "Returned" && translations[language].orderStatus.returned}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-lg font-medium text-gray-500 dark:text-gray-400">
                    {translations[language].adminPage.noOrdersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showListings && (
        <div
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 z-50 transition-colors duration-500 
          ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}
        >
          {/* Header */}
          <h3 className="text-3xl font-bold mb-6">{translations[language].adminPage.cropListings}</h3>

          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder={translations[language].adminPage.filterByFarmerName}
              className="p-3 rounded-md border border-gray-400 dark:border-gray-700 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
              value={farmerFilter}
              onChange={(e) => setFarmerFilter(e.target.value)}
            />
            <input
              type="number"
              placeholder={translations[language].adminPage.maxPrice}
              className="p-3 rounded-md border border-gray-400 dark:border-gray-700 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            />
            <input
              type="date"
              className="p-3 rounded-md border border-gray-400 dark:border-gray-700 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <button
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
              onClick={handleFilter}
            >
              {translations[language].adminPage.applyFilters}
            </button>
          </div>

          {/* Crops Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr
                  className={`text-left text-lg font-semibold 
                  ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-900"}`}
                >
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.cropName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.farmerName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.price}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.productionDate}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrops.length > 0 ? (
                  filteredCrops.map((crop, index) => (
                    <tr
                      key={index}
                      className={`transition duration-300 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                    >
                      <td className="py-3 px-6 border-b border-gray-600">{getCropName(crop.name)}</td>
                      <td className="py-3 px-6 border-b border-gray-600">{crop.farmerName}</td>
                      <td className="py-3 px-6 border-b border-gray-600">₹{crop.price}</td>
                      <td className="py-3 px-6 border-b border-gray-600">
                        {new Date(crop.productionDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-lg font-medium text-gray-500 dark:text-gray-400">
                    {translations[language].adminPage.noCropsFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showSettings && !showProfile && !showUsers && !showSearch && !showChat && !showNotifications && !showOrders && !showListings && (
        <main
          className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 transition-colors duration-500 
          ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}
        >
          <h2 className="text-4xl font-extrabold mb-8 text-center">📊 {translations[language].adminPage.dashboardOverview}</h2>

          <section className={`p-6 rounded-lg mb-4 transition-colors duration-500 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900 shadow-md"}`}>
            <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.statsSummary}</h3>

            <div className="flex flex-wrap justify-between items-center gap-4 p-4">
              <div className="text-lg">
                <span className="font-medium">{translations[language].adminPage.totalUsers}: </span> 
                <span className="font-bold">{farmersCount + buyersCount}</span>
              </div>
              <div className="text-lg">
                <span className="font-medium">{translations[language].adminPage.farmers}: </span> 
                <span className="font-bold">{farmersCount}</span>
              </div>
              <div className="text-lg">
                <span className="font-medium">{translations[language].adminPage.buyers}: </span> 
                <span className="font-bold">{buyersCount}</span>
              </div>
              <div className="text-lg">
                <span className="font-medium">{translations[language].adminPage.activeListings}: </span> 
                <span className="font-bold">{activeListings}</span>
              </div>
              <div className="text-lg">
                <span className="font-medium">{translations[language].adminPage.transactions}: </span> 
                <span className="font-bold">{transactions}</span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section
              className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 
              ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.manageUsers}</h3>
              <button
                className={`w-full py-2 rounded-md font-medium 
                ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                onClick={() => { setShowUsers(true);setShowListings(false);setShowOrders(false);setShowProfile(false); setShowSettings(false);  setShowSearch(false); setShowChat(false); setShowNotifications(false); }} > 
                {translations[language].adminPage.viewFarmersBuyers}
              </button>
            </section>

            <section
              className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 
              ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.manageCropListings}</h3>
              <button
                className={`w-full py-2 rounded-md font-medium 
                ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white`}
                onClick={() => { setShowListings(true);setShowUsers(false);setShowOrders(false);setShowProfile(false); setShowSettings(false);  setShowSearch(false); setShowChat(false); setShowNotifications(false); }} > 
                {translations[language].adminPage.checkListings}
              </button>
            </section>

            <section
              className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 
              ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.manageComplaints}</h3>
              <button
                className={`w-full py-2 rounded-md font-medium 
                ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white`}
                onClick={() => {setShowChat(true);setSelectedFriend(null);}}
              >
                {translations[language].adminPage.viewComplaints}
              </button>
            </section>

            <section
              className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 
              ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <h3 className="text-2xl font-semibold mb-4">
                {translations[language].adminPage.marketPriceMonitoring}
              </h3>
              <button
                className={`w-full py-2 rounded-md font-medium 
                ${darkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"} text-white`}
                onClick={() => window.open("https://www.agmarknet.gov.in/SearchCmmMkt.aspx", "_blank")}
              >
                {translations[language].adminPage.viewPrices}
              </button>
            </section> 
          </div>
          
          {/* 🔮 Crop Price Prediction Section */}
          <section className={`p-6 rounded-lg mb-4 transition-colors duration-500 mt-4
                              ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900 shadow-md"} mx-auto w-full`}
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
                <p>{translations[language].cropPrediction.farmerPrice}: ₹{predictedPrice.farmerPrice}/{translations[language].kg_Lang} </p>
                <p> {translations[language].cropPrediction.marketPrice}: ₹{predictedPrice.marketPrice}/{translations[language].kg_Lang} </p>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 w-full h-18 flex justify-around items-center p-4 border-t z-50 transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white border-gray-700" : "bg-white text-gray-800 border-gray-300"}`}>
        <FaHome className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {navigate("/admin-home");setShowProfile(false);setShowSettings(false);setShowListings(false);setShowUsers(false);setShowSearch(false);setShowChat(false);setShowNotifications(false);setShowOrders(false); }} />
        <FaSearch className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {setShowSearch(true);setShowProfile(false);setShowSettings(false);setShowUsers(false);setShowListings(false);setShowChat(false);setShowNotifications(false);setShowOrders(false); }} />
        <FaShoppingCart className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { fetchOrders();setShowOrders(true);setShowProfile(false); setShowSettings(false); setShowListings(false);setShowUsers(false); setShowSearch(false); setShowChat(false); setShowNotifications(false); }} /> 
        <FaBell className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => {setShowNotifications(true);setShowProfile(false);setShowSettings(false);setShowListings(false);setShowUsers(false);setShowSearch(false);setShowChat(false);setShowOrders(false);}} />
        <FaUser className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
          onClick={() => { setShowProfile(true);setShowSettings(false);setShowUsers(false);setShowListings(false);setShowSearch(false);setShowChat(false);setShowNotifications(false);setShowOrders(false); }} />
      </nav>

    </div>
  );
};

export default AdminHome;