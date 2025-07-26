import React from "react";
import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 

const NotificationsView = ({
  user,
  showNotifications,
  darkMode,
  notifications,
  handleAcceptRequest,
  handleDeclineRequest,
  markAllAsRead,
  clearNotifications,
  setNotifications,
  setFriendshipStatus,
}) => {
  const { language } = useLanguage();  // Get Language State
  if (!showNotifications) return null;

  return (
    <div
      className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] shadow-lg border-t rounded-lg p-6 z-50 transition-colors duration-500 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-5 flex items-center ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        🔔 {translations[language].notification}
      </h2>

      {notifications.length > 0 ? (
        <>
          <ul className="space-y-4 max-h-[63vh] overflow-y-auto border-t">
            {notifications.map((notification, index) => (
              <li
                key={index}
                className={`p-4 border rounded-lg flex justify-between items-center transition-colors duration-500 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-900"
                }`}
              >
                <span>{notification.message}</span>
                <div className="flex items-center space-x-3">
                  {!notification.isRead && <span className="text-red-500">🔴</span>}

                  {notification.type === "friend-request" && user.role !== "Admin" && notification.senderId && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleAcceptRequest(
                            notification.senderId,
                            setNotifications,
                            setFriendshipStatus
                          )
                        }
                        className={`px-4 py-2 rounded-lg transition ${
                          darkMode
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        ✅ {translations[language].accept}
                      </button>
                      <button
                        onClick={() =>
                          handleDeclineRequest(
                            notification.senderId,
                            setNotifications,
                            setFriendshipStatus
                          )
                        }
                        className={`px-4 py-2 rounded-lg transition ${
                          darkMode
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        ❌ {translations[language].decline}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-center space-x-24 border-t mt-0">
            <button
              className={`px-5 py-2 rounded-lg transition mt-4 ${
                darkMode
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              onClick={() => markAllAsRead(setNotifications)}
            >
              ✔ {translations[language].markAllRead}
            </button>
            <button
              className={`px-5 py-2 rounded-lg transition mt-4 ${
                darkMode
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
              onClick={() => clearNotifications(setNotifications)}
            >
              🗑 {translations[language].clearAllNotifications}
            </button>
          </div>
        </>
      ) : (
        <p className={`text-center transition-colors duration-500 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {translations[language].noNotifications}
        </p>
      )}
    </div>
  );
};

export default NotificationsView;