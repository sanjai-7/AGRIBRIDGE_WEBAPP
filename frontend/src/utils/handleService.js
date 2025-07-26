import axios from "axios";

const BASE_URL = "http://localhost:5000";

/**
 * Handles user search based on name
 * @param {string} searchQuery - User input for search
 * @param {Function} setSearchResults - State setter function to update search results
 * @param {Function} setShowFriends - State setter function to toggle friends list
 * @param {Function} updateRecentSearches - Function to update recent searches
 * @param {Function} setFriendshipStatus - State setter for friendship status
 * @param {string} farmerName - The current farmer's name
 */
export const handleSearch = async (
    searchQuery,
    setSearchResults,
    setShowFriends,
    updateRecentSearches,
    setFriendshipStatus,
    farmerName
  ) => {
    if (!searchQuery.trim()) {
      setSearchResults("Please enter a name to search!");
      return;
    }
  
    try {
      setShowFriends(false);
      
      const res = await axios.get(`http://localhost:5000/search-user?name=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (searchQuery.toUpperCase() === farmerName.toUpperCase()) {
        setSearchResults((prev) => prev === "It's Your Name!" ? prev : "It's Your Name!");
      } else if (res.data.success) {
        setSearchResults((prev) => prev === res.data.user ? prev : res.data.user);
        updateRecentSearches(searchQuery);
  
        setFriendshipStatus((prev) => 
          prev === (res.data.isFriend ? "Friends" : res.data.hasSentRequest ? "Cancel Request" : "Add Friend") 
          ? prev 
          : res.data.isFriend ? "Friends" : res.data.hasSentRequest ? "Cancel Request" : "Add Friend"
        );
      } else {
        setSearchResults((prev) => prev === "No user exists with this name!" ? prev : "No user exists with this name!");
        updateRecentSearches(searchQuery);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  

/**
 * Handles accepting a friend request
 * @param {string} senderId - ID of the user who sent the request
 * @param {Function} setNotifications - State setter function to update notifications
 * @param {Function} setFriendshipStatus - State setter function to update friendship status
 */
export const handleAcceptRequest = async (senderId, setNotifications, setFriendshipStatus) => {
  console.log("Accept button clicked for:", senderId);
  try {
    const response = await axios.post(
      `${BASE_URL}/accept-friend-request`,
      { senderId },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    console.log("Response from server:", response.data);

    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.senderId !== senderId)
    );
    setFriendshipStatus("Friends");
    alert("ACCEPTED!");
  } catch (error) {
    console.error("Error accepting friend request:", error.response?.data || error);
  }
};

/**
 * Handles declining a friend request
 * @param {string} senderId - ID of the user who sent the request
 * @param {Function} setNotifications - State setter function to update notifications
 * @param {Function} setFriendshipStatus - State setter function to update friendship status
 */
export const handleDeclineRequest = async (senderId, setNotifications, setFriendshipStatus) => {
  try {
    await axios.post(
      `${BASE_URL}/decline-friend-request`,
      { senderId },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    // Update UI: Remove notification and reset friendship status
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.senderId !== senderId)
    );
    setFriendshipStatus("Add Friend");
    alert("Denied!");
  } catch (error) {
    console.error("Error declining friend request:", error);
  }
};


/**
 * Handles input change for a form and updates state.
 * @param {Event} e - The event object from the input field.
 * @param {Function} setEditedProfile - The state updater function for edited profile.
 */
export const handleChange = (e, setEditedProfile) => {
  setEditedProfile((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

/**
 * Saves the updated profile by sending a PUT request to the server.
 * @param {Object} editedProfile - The updated profile data.
 * @param {Function} setProfile - The state updater function for the profile.
 * @param {Function} setEditMode - Function to toggle edit mode.
 */
export const handleSave = async (editedProfile, setProfile, setEditMode) => {
  try {
    const token = localStorage.getItem("token");

    const endpoint = editedProfile.role === "farmer" 
      ? "http://localhost:5000/update-farmer-profile" 
      : editedProfile.role === "buyer" ? "http://localhost:5000/update-buyer-profile" : "http://localhost:5000/update-admin-profile";

    await axios.put(endpoint, editedProfile, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setProfile(editedProfile);
    setEditMode(false);
    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

// Function to handle crop search
export const handleCropSearch = async (cropSearchQuery, farmer, setCropSearchResults, updateRecentCropSearches) => {

    if (!cropSearchQuery.trim()) {
      alert("Enter a crop name");
      return;
    }
    const userName = farmer?.name; // Current logged-in farmer's name
  
    try {
      const response = await fetch(`http://localhost:5000/api/crops?query=${cropSearchQuery}&userName=${userName}`);
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
  
      const data = await response.json();
      console.log("Raw response data:", data);
  
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format — expected an array of crops");
      }
  
      // Filter out crops uploaded by the current logged-in farmer
      const filteredCrops = data.filter(
        (crop) => crop.availableQuantity > 0 && crop.farmerName !== userName
      );
  
      setCropSearchResults(filteredCrops);
      updateRecentCropSearches(cropSearchQuery);
    } catch (error) {
      console.error("Error fetching crops:", error);
    }
  };

  // ✅ Function to clear all notifications
export const clearNotifications = async (setNotifications) => {
    try {
      const response = await axios.delete("http://localhost:5000/clear-notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      alert(response.data.message); // ✅ Show success message
      setNotifications([]); // ✅ Clear UI notifications
  
    } catch (error) {
      console.error("Error clearing notifications:", error);
      alert("Failed to clear notifications");
    }
  };

  // ✅ Function to select a friend and load chat
export const handleSelectFriend = async (friend, setSelectedFriend, setMessages, setRefreshKey) => {
    setSelectedFriend(friend);
  
    try {
      // Fetch chat messages
      const res = await axios.post(
        "http://localhost:5000/get-chat",
        { friendId: friend._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessages(res.data.messages);
  
      // Mark messages as read
      await axios.post(
        "http://localhost:5000/mark-as-read",
        { friendId: friend._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
  
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading chat or marking messages as read:", error);
    }
  };
  
  // ✅ Function to send a message
  export const sendMessage = async (newMessage, selectedFriend, setMessages, setNewMessage) => {
    if (!newMessage.trim()) return;
  
    try {
      const res = await axios.post(
        "http://localhost:5000/send-message",
        { friendId: selectedFriend._id, text: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
  
      setMessages(res.data.messages);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // ✅ Function to mark all notifications as read
  export const markAllAsRead = async (setNotifications) => {
    try {
      await axios.put(
        "http://localhost:5000/mark-all-notifications-read",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
  
      // Update local state to remove unread notifications
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // ✅ Function to Remove a Friend
export const handleRemoveFriend = async (friend, setFriends, setFriendshipStatus) => {
    try {
      const response = await fetch("http://localhost:5000/remove-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure the user is authenticated
        },
        body: JSON.stringify({ friendName: friend.name }), // Using name instead of _id
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Friend removed:", friend.name);
        // ✅ Update frontend — remove friend from state
        setFriends((prevFriends) =>
          prevFriends.filter((f) => f.name !== friend.name)
        );
        setFriendshipStatus("Add Friend");
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };
  
  // ✅ Function to Add/Cancel Friend Request
  export const handleAddFriend = async (friendId, friendshipStatus, setFriendshipStatus) => {
    try {
      if (friendshipStatus === "Cancel Request") {
        console.log("Cancelling friend request for:", friendId);
        const response = await axios.post(
          "http://localhost:5000/cancel-friend-request",
          { friendId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        console.log("Cancel request response:", response.data);
        setFriendshipStatus("Add Friend"); // Reset status
      } else {
        console.log("Sending friend request to:", friendId);
        const response = await axios.post(
          "http://localhost:5000/send-friend-request",
          { friendId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        console.log("Friend request response:", response.data);
        setFriendshipStatus("Cancel Request");
      }
    } catch (error) {
      console.error("Friend request error:", error.response ? error.response.data : error);
    }
  };
  