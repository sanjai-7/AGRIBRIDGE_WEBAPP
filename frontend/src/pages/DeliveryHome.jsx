import React, { useState, useEffect,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdChat } from "react-icons/md";
import { FaHome, FaUser, FaBell, FaCog, FaUserFriends, FaShoppingCart } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import SettingsView from "../components/SettingsView"; // Adjust the path as needed
import NotificationsView from "../components/NotificationsView";
import { fetchUnreadMessages, fetchUnreadMessagesPerFriend } from "../utils/fetchService";
import { handleSearch, handleCropSearch, handleSave, clearNotifications, sendMessage, markAllAsRead,} from "../utils/handleService";
import SearchView from "../components/SearchView";
import ChatBox from "../components/chatBox";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";


const DeliveryHome = () => {

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
  const [multiCropOrders, setMultiCropOrders] = useState([]);
  
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

  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const { darkMode, setDarkMode } = useTheme();

  const [season, setSeason] = useState("");
  const [month, setMonth] = useState("");
  const [msp, setMsp] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [productionDate, setProductionDate] = useState("");

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

  const handleChange = (e) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

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

  const updateRecentSearches = (query) => {
    const updatedSearches = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
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

  const handleAdminApproval = async (order, approve) => {
    const newStatus = approve ? "Out for Delivery" : "Packed";
  
    try {
      const apiUrl =
        order.orderType === "Multiple"
          ? "http://localhost:5000/api/update-multiple-order-status"
          : "http://localhost:5000/api/update-order-status";
  
      const requestBody =
        order.orderType === "Multiple"
          ? {
              buyerMobile: order.buyerMobile,
              farmerMobile: order.farmerMobile,
              buyerName: order.buyerName,
              orderedAt: order.orderedAt,
              status: newStatus,
            }
          : {
              cropName: order.cropName,
              buyerMobile: order.buyerMobile,
              farmerMobile: order.farmerMobile,
              buyerName: order.buyerName,
              orderedAt: order.orderedAt,
              status: newStatus,
            };
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });
  
      const result = await response.json();
      alert(result.message);
  
      // Update the order status immediately in the frontend
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderType === "Multiple" && order.orderType === "Multiple"
            ? o.buyerMobile === order.buyerMobile &&
              o.farmerMobile === order.farmerMobile &&
              o.buyerName === order.buyerName &&
              o.orderedAt === order.orderedAt
              ? { ...o, status: newStatus }
              : o
            : o.cropName === order.cropName &&
              o.buyerMobile === order.buyerMobile &&
              o.farmerMobile === order.farmerMobile &&
              o.orderedAt === order.orderedAt
            ? { ...o, status: newStatus }
            : o
        )
      );
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };
  
  const handleAdminApproval1 = async (order, approve) => {
    const newStatus = approve ? "Delivered" : "Shipped";
  
    try {
      const apiUrl =
        order.orderType === "Multiple"
          ? "http://localhost:5000/api/update-multiple-order-status"
          : "http://localhost:5000/api/update-order-status";
  
      const requestBody =
        order.orderType === "Multiple"
          ? {
              buyerMobile: order.buyerMobile,
              farmerMobile: order.farmerMobile,
              buyerName: order.buyerName,
              orderedAt: order.orderedAt,
              status: newStatus,
            }
          : {
              cropName: order.cropName,
              buyerMobile: order.buyerMobile,
              farmerMobile: order.farmerMobile,
              buyerName: order.buyerName,
              orderedAt: order.orderedAt,
              status: newStatus,
            };
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });
  
      const result = await response.json();
      alert(result.message);
  
      // Update the order status immediately in the frontend
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderType === "Multiple" && order.orderType === "Multiple"
            ? o.buyerMobile === order.buyerMobile &&
              o.farmerMobile === order.farmerMobile &&
              o.buyerName === order.buyerName &&
              o.orderedAt === order.orderedAt
              ? { ...o, status: newStatus }
              : o
            : o.cropName === order.cropName &&
              o.buyerMobile === order.buyerMobile &&
              o.farmerMobile === order.farmerMobile &&
              o.orderedAt === order.orderedAt
            ? { ...o, status: newStatus }
            : o
        )
      );
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const updateRecentCropSearches = (query) => {
    const updatedCropSearches = [query, ...recentCropSearches.filter(q => q !== query)].slice(0, 7);
    setRecentCropSearches(updatedCropSearches);
    localStorage.setItem("recentCropSearches", JSON.stringify(updatedCropSearches));
  };

  const handleReturnVerification = async (cropName, buyerMobile, farmerMobile, orderedAt, orderType, bool) => {
    try {
      const response = await fetch("http://localhost:5000/api/verify-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropName, buyerMobile, farmerMobile, orderedAt, orderType, bool }),
      });
  
      const data = await response.json();
      alert(data.message);
  
      // Optionally refresh orders
      fetchOrders();
  
    } catch (error) {
      console.error("Error verifying return:", error);
      alert("Failed to verify return.");
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
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].profile.village}</th>
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
                      <td className="py-3 px-6 border-b border-gray-600">{user.village}</td>
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
        <div className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] flex justify-center items-center p-4 z-50 transition-colors duration-500 ${
                        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900" }`}
        >
          <div className={`w-full max-w-2xl rounded-xl shadow-lg p-8 space-y-6 border transition-all duration-500 ${
                          darkMode ? "bg-[#1e293b] border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900" }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-3xl font-semibold flex items-center space-x-2">
                👤 <span>{translations[language].profile.titleDelivery}</span>
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
        <div className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 z-50 transition-colors duration-500 
                        ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
          {/* Header */}
          <h2 className="text-3xl font-bold mb-6">{translations[language].adminPage.ordersAndDeliveryStats}</h2>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className={`text-left text-lg font-semibold ${darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-900"}`}>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.buyerName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.cropName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.farmerName}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.quantityKg}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.status}</th>
                  <th className="py-4 px-6 border-b border-gray-600">{translations[language].adminPage.action}</th>
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

                      {/* Action Buttons */}
                      <td className="py-3 px-6 border-b border-gray-600">
                        {order.status === "Shipped" && (
                          <div className="flex gap-2">
                            <button
                                onClick={() => handleAdminApproval( order, true ) }
                                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                            >
                              {translations[language].adminPage.approve}
                            </button>
                            <button
                              onClick={() => handleAdminApproval( order, false ) }
                              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                            >
                              {translations[language].adminPage.reject}
                            </button>
                          </div>
                        )}

                        {order.status === "Out for Delivery" && (
                          <div className="flex gap-2">
                            <button
                                  onClick={() => handleAdminApproval1( order, true ) }
                                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {translations[language].adminPage.delivered}
                            </button>
                            <button
                                onClick={() =>
                                handleAdminApproval1( order, false ) }
                                className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              {translations[language].adminPage.verifyShipping}
                            </button>
                          </div>
                        )}

                        {/* ✅ If order.status === "Returned" and returnStatus === "Requested" */}
                        {order.status === "Returned" && order.returnStatus === "Returning" && (
                          <div className="text-green-600 font-medium mt-2">
                            {translations[language].adminPage.returnInProgress}
                          </div>
                        )}

                        {order.status === "Returned" && order.returnStatus !== "Returning" && order.returnStatus !== "Returned" && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {handleReturnVerification((order.cropName || ""),order.buyerMobile, order.farmerMobile, order.orderedAt, order.orderType, true);
                              }}
                              className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {translations[language].adminPage.verifyReturn}
                            </button>
                            <button
                              onClick={() => {handleReturnVerification((order.cropName || ""),order.buyerMobile, order.farmerMobile, order.orderedAt, order.orderType, false);
                              }}
                              className="px-4 py-2 rounded-md bg-red-600 hover:bg-purple-700 text-white"
                            >
                              {translations[language].yourcrops.cancelOrder}
                            </button>
                          </div>
                        )}


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
        <div className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 z-50 transition-colors duration-500 
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
                <tr className={`text-left text-lg font-semibold 
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
        <main className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto p-6 transition-colors duration-500 
                        ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
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
            <section className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-105 
                ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.allUsers}</h3>
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
              <h3 className="text-2xl font-semibold mb-4">{translations[language].adminPage.cropListings}</h3>
              <button
                className={`w-full py-2 rounded-md font-medium 
                          ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white`}
                onClick={() => { setShowListings(true);setShowUsers(false);setShowOrders(false);setShowProfile(false); setShowSettings(false);  setShowSearch(false); setShowChat(false); setShowNotifications(false); }} > 
                  {translations[language].adminPage.checkListings}
              </button>
            </section>
          </div>
        </main>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 w-full h-18 flex justify-around items-center p-4 border-t z-50 transition-colors duration-500 ${darkMode ? "bg-[#030711] text-white border-gray-700" : "bg-white text-gray-800 border-gray-300"}`}>
        
        <FaHome className="w-6 h-6 cursor-pointer hover:scale-110 transition" 
                onClick={() => {navigate("/delivery-home");setShowProfile(false);setShowSettings(false);setShowListings(false);setShowUsers(false);setShowSearch(false);setShowChat(false);setShowNotifications(false);setShowOrders(false); }} />
            
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

export default DeliveryHome;