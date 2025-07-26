import React from "react";
import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 

const FriendsList = ({ showFriends, friends, darkMode, handleChat, confirmRemove }) => {
  const { language } = useLanguage();  // Get Language State
  if (!showFriends) return null;

  return (
    <div
      className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] overflow-y-auto transition-colors duration-500 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="w-full h-full p-8">
        {/* Header */}
        <h2 className="text-3xl font-bold mb-8 text-center flex justify-center items-center gap-3">
          👥 {translations[language].friendsLang}
          <span
            className={`text-lg px-4 py-1 rounded-full ${
              darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-900"
            }`}
          >
            {friends.length}
          </span>
        </h2>

        {/* Friends List */}
        {Array.isArray(friends) && friends.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <div
                key={friend.mobile}
                className={`p-6 rounded-lg shadow-md border transition-colors duration-500 ${
                  darkMode
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <h3 className="text-2xl font-semibold mb-3">
                  {friend.name}
                  <span
                    className={`text-sm font-medium ml-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    ({translations[language]?.[friend.role].toUpperCase()})
                  </span>
                </h3>

                <div className="text-sm space-y-2">
                  <p>
                    📧 <strong>{translations[language].profile.email}:</strong> {friend.email || translations[language].profile.notProvided}
                  </p>
                  <p>
                    📞 <strong>{translations[language].profile.mobile}:</strong> {friend.mobile}
                  </p>
                  <p>
                    🏡 <strong>{translations[language].profile.village}:</strong> {friend.village}
                  </p>
                  <p>
                    📍 <strong>{translations[language].profile.district}:</strong> {friend.district}
                  </p>
                  <p>
                    🌍 <strong>{translations[language].profile.state}:</strong> {friend.state}
                  </p>
                </div>

                <div className="flex justify-center mt-2 gap-10">
                  <button
                    onClick={() => handleChat(friend)}
                    className="px-5 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    {translations[language].chat}
                  </button>

                  <button
                    onClick={() => confirmRemove(friend)}
                    className="px-6 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    {translations[language].removeFriend}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-lg font-medium mt-8">{translations[language].noFriends}</p>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
