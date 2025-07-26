import React from "react";
import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 

const SettingsView = ({ 
  showSettings, 
  darkMode, 
  setDarkMode, 
  notifications, 
  handleToggle,
  openSupportChat
}) => {
  const { language, setLanguage } = useLanguage();  // Get Language State
  if (!showSettings) return null;
  

  return (
    <div
      className={`fixed top-[5rem] left-0 w-full p-6 z-50 h-[calc(100vh-5rem-3.6rem)] max-h-[84.9vh] overflow-y-auto rounded-lg shadow-lg transition-colors duration-500 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}
    >
      <h1 className="text-2xl font-bold mb-6">⚙️ {translations[language].settings}</h1>

      {/* Language Toggle */}
      <section
        className={`mb-8 flex justify-between items-center border rounded-lg p-4 transition-colors duration-500 ${
          darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"
        }`}
      >
        <span className="text-lg font-semibold">🌍 {translations[language].language}</span>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg transition ${
              language === "en" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition ${
              language === "ta" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setLanguage("ta")}
          >
            தமிழ்
          </button>
        </div>
      </section>

      {/* Theme Toggle */}
      <section
        className={`mb-8 flex justify-between items-center border rounded-lg p-4 transition-colors duration-500 ${
          darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"
        }`}
      >
        <span className="text-lg font-semibold">🌗 {translations[language].toggleTheme}</span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-4 py-2 rounded-lg transition ${
            darkMode ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          {darkMode ? translations[language].lightMode : translations[language].darkMode}
        </button>
      </section>

      {/* Notification Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">🔔 {translations[language].notificationPreferencec}</h2>

        <div className="space-y-4">
          {[translations[language].sms, translations[language].profile.email].map((preference) => (
            <div
              key={preference}
              className={`flex justify-between items-center border rounded-lg p-4 transition-colors duration-500 ${
                darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"
              }`}
            >
              <span>{preference}</span>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[preference.toLowerCase().replace(/\s+/g, "")]}
                  onChange={() => handleToggle(preference.toLowerCase().replace(/\s+/g, ""))}
                  className="hidden"
                />
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    notifications[preference.toLowerCase().replace(/\s+/g, "")]
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform ${
                      notifications[preference.toLowerCase().replace(/\s+/g, "")]
                        ? "translate-x-6"
                        : "translate-x-0"
                    } transition`}
                  ></div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Support & Help */}
      <section>
        <h2 className="text-lg font-semibold mb-4">🛠️ {translations[language].supportHelp}</h2>

        <div className="space-y-4">
          {[
            { label: "📖 "+translations[language].helpCenter, action: () => openSupportChat("Help Center") },
            { label: "📞 "+translations[language].contactSupport, action: () => openSupportChat("Contact Support") },
            { label: "🚨 "+translations[language].reportIssue, action: () => openSupportChat("My Issue") },
            { label: "💬 "+translations[language].feedback, action: () => openSupportChat("My Feedback") }            
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full py-3 rounded-lg transition ${
                darkMode
                  ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;