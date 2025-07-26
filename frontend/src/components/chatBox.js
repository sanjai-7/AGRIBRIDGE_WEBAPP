import React from "react";
import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 

const ChatBox = ({
  showChat,
  darkMode,
  friends,
  admins,
  selectedFriend,
  setSelectedFriend,
  messages,
  setMessages,
  chatNotifications,
  unreadMessagesPerFriend,
  sendMessage,
  newMessage,
  setNewMessage,
  handleSelectFriend,
  setRefreshKey,
}) => {
  const { language } = useLanguage();  // Get Language State
  if (!showChat) return null;

  return (
    <div className={`fixed top-0 left-0 w-full h-full transition-colors duration-500 ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"} z-40`}>

      {/* Chat Header */}
      <div className={`fixed top-20 left-0 w-full h-[5.55rem] flex justify-between items-center p-4 border-t border-b z-50
        ${darkMode ? "bg-[#05193d] text-white" : "bg-gradient-to-r from-indigo-500 to-blue-600 text-white"}`}>
        
        <div className="w-[29%] flex items-center">
          <h2 className="text-xl font-bold">
            💬 {translations[language].chat}{" "}
            {chatNotifications > 0 && (
              <span className="text-red-500 font-bold">({chatNotifications})</span>
            )}
          </h2>
        </div>
        {!selectedFriend ? (<p></p>):(<div className={`w-[4px] self-stretch ${darkMode ? "bg-gray-200" : "bg-gray-300"}`}></div>)}
        

        <div className="w-[70%] flex items-center justify-between space-x-4">
          {selectedFriend && (
            <>
            <h3 className="text-lg ml-1 font-bold">{selectedFriend.name}</h3>
            <div className="flex space-x-4">
            <button
              className={`p-2 rounded-lg ${darkMode ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-white text-indigo-600 hover:bg-gray-100"} transition`}
              onClick={() => alert("📱 Video call feature will be added soon!")}
            >
              📱 {translations[language].video}
            </button>
            <button
              className={`p-2 rounded-lg ${darkMode ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-white text-green-600 hover:bg-gray-100"} transition`}
              onClick={() => alert("📞 Voice call feature will be added soon!")}
            >
              📞 {translations[language].audio}
            </button>
          </div>
          </>
          )}
          
        </div>
      </div>

      {/* Main Chat Section */}
      <div className={`flex flex-col mt-20 h-[calc(100vh-8.5rem)] border-t border-b z-50 transition-colors duration-500 ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
        {/* Friends & Admins List */}
        <div className="flex flex-grow mt-[5.5rem] h-[70.5vh] overflow-hidden">
          <div className={`w-[30%] overflow-y-auto p-4 border-r transition-colors duration-500 ${darkMode ? "bg-[#101d37] border-gray-700 text-white" : "bg-white border-gray-300 text-black"}`}>
            {friends.length > 0 || admins.length > 0 ? (
              <>
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className={`p-3 mt-3 mb-3 truncate rounded-lg cursor-pointer border transition ${
                    selectedFriend?._id === friend._id
                      ? darkMode
                        ? "border-blue-400 bg-blue-800 text-white"
                        : "border-blue-500 bg-blue-100"
                      : darkMode
                      ? "border-gray-600 hover:bg-blue-800 text-white"
                      : "border-gray-300 hover:bg-blue-100 text-black"
                  }`}
                  onClick={() => handleSelectFriend(friend,setSelectedFriend, setMessages, setRefreshKey)}
                  >
                  {friend.name}{" "}
                  {unreadMessagesPerFriend[friend._id] > 0 && (
                    <span className="text-red-500">
                      ({unreadMessagesPerFriend[friend._id]})
                    </span>
                  )}
                </div>
              ))}
              {admins.map((admin) => (
                <div
                  key={admin._id}
                  className={`p-3 mt-3 mb-3 truncate rounded-lg cursor-pointer border transition ${
                    selectedFriend?._id === admin._id
                      ? darkMode
                        ? "border-blue-400 bg-blue-800 text-white"
                        : "border-blue-500 bg-blue-100"
                      : darkMode
                      ? "border-gray-600 hover:bg-blue-800 text-white"
                      : "border-gray-300 hover:bg-blue-100 text-black"
                  }`}
                  onClick={() => handleSelectFriend(admin,setSelectedFriend, setMessages, setRefreshKey)}
                  >
                  {admin.name}({translations[language].administrator}) {" "}
                  {unreadMessagesPerFriend[admin._id] > 0 && (
                    <span className="text-red-500">
                      ({unreadMessagesPerFriend[admin._id]})
                    </span>
                  )}
                </div>
              ))}

              </>
            ) : (
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {translations[language].noFriendsAdmins}
              </p>
            )}
          </div>

          {/* Chat Box */}
          {!selectedFriend ?
          (
              <p className={`flex justify-center items-center w-full h-full ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {translations[language].selectFriend}
              </p>
            ) : (
          <div className="w-[70%] flex flex-col">

            {/* Message Container */}
            <div id="messages-container" className={`flex-1 overflow-y-auto p-4 space-y-4 border-b transition-colors duration-500 ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
              {messages.map((msg, index) => {
                const loggedInUser = JSON.parse(localStorage.getItem("user"))?.name;
                const isMyMessage = msg.sender.name === loggedInUser;

                const messageDate = new Date(msg.timestamp).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit", 
                });
                const messageTime = new Date(msg.timestamp).toLocaleString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <div
                    key={index}
                    className={`max-w-xs p-3 rounded-lg shadow transition ${
                      isMyMessage
                        ? darkMode
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-blue-500 text-white ml-auto"
                        : darkMode
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span>{isMyMessage ? translations[language].you : msg.sender.name}</span>
                      <span>{messageDate} - {messageTime}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            {selectedFriend && (
              <div className={`p-4 border-t transition-colors duration-500 ${darkMode ? "bg-[#101d37] border-gray-700" : "bg-white border-gray-300"}`}>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={translations[language].typeMessage}
                    className={`flex-1 p-3 rounded-lg border transition-colors duration-500 focus:ring-2 focus:outline-none ${
                      darkMode
                        ? "border-gray-600 bg-[#101d37] text-white focus:ring-blue-500"
                        : "border-gray-300 bg-gray-100 text-black focus:ring-blue-500"
                    }`}
                  />
                  <button
                    onClick={() => sendMessage(newMessage, selectedFriend, setMessages, setNewMessage)}
                    className={`px-6 py-3 rounded-lg transition ${
                      darkMode
                        ? "bg-[#004fff] text-white hover:bg-[#447dfb]"
                        : "bg-[#004fff] text-white hover:bg-[#447dfb]"
                    }`}
                  >
                    {translations[language].sendButton}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        
        </div>
      </div>
      </div>

  );
};

export default ChatBox;
