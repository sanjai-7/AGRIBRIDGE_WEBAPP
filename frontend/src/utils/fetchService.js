import axios from "axios";

// Base API URL (Modify if required)
const BASE_URL = "http://localhost:5000";

/**
 * Fetches orders from the API
 * @param {Function} setOrders - State setter function to update orders
 */
export const fetchOrders = async (setOrders) => {
  try {
    const response = await fetch(`${BASE_URL}/api/farmer-orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    setOrders(data);
  } catch (err) {
    console.error("Error fetching orders:", err);
  }
};


export const fetchMultipleOrders = async (setMultipleOrders) => {
  try {
    const response = await fetch(`${BASE_URL}/api/farmer-multiple-orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();
    // setMultipleOrders(data);
    setMultipleOrders(data);
  } catch (err) {
    console.error("Error fetching multiple orders:", err);
  }
};


/**
 * Fetches friends and admins from the API
 * @param {Function} setFriends - State setter function to update friends
 * @param {Function} setAdmins - State setter function to update admins
 */
export const fetchFriends = async (setFriends, setAdmins) => {
  try {
    const token = localStorage.getItem("token");

    // Fetch both in parallel
    const [friendsResponse, adminsResponse] = await Promise.all([
      axios.get(`${BASE_URL}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${BASE_URL}/admins`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    setFriends(friendsResponse.data.friends);
    setAdmins(adminsResponse.data.admins);
  } catch (error) {
    console.error("Error fetching friends and admins:", error);
    setFriends([]);
    setAdmins([]);
  }
};

/**
 * Fetch unread chat messages count
 * @param {Function} setChatNotifications - State setter for chat notifications
 */
export const fetchUnreadMessages = async (setChatNotifications) => {
  try {
    const res = await axios.get(`${BASE_URL}/unread-messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    setChatNotifications(res.data.unreadCount);
  } catch (error) {
    console.error("Error fetching unread messages:", error);
  }
};

/**
 * Fetch unread messages per friend
 * @param {Function} setUnreadMessagesPerFriend - State setter for unread messages per friend
 */
export const fetchUnreadMessagesPerFriend = async (setUnreadMessagesPerFriend) => {
  try {
    const res = await axios.get(`${BASE_URL}/unread-messages-per-friend`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    setUnreadMessagesPerFriend(res.data.unreadMessagesPerFriend);
  } catch (error) {
    console.error("Error fetching unread messages per friend:", error);
  }
};

/**
 * Fetch crops data from API
 * @param {Function} setCrops - State setter function to update crops data
 */
export const fetchCrops = async (setCrops) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${BASE_URL}/farmer-crops`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCrops(response.data);
  } catch (error) {
    console.error("Error fetching crops:", error);
  }
};
