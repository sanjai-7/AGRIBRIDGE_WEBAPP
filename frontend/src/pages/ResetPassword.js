import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext"; // Import Language Context
import translations from "../utils/translations"; // Import translation file

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { language } = useLanguage(); // Get selected language
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const mobile = localStorage.getItem("userMobile");

  const handleResetPassword = async () => {
    if (!password) {
      alert(translations[language].error_empty_password);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/reset-password", { mobile, password });

      if (response.data.message === "Password reset successfully") {
        alert(translations[language].password_reset_success);
        localStorage.removeItem("userMobile");
        navigate("/login");
      }
    } catch (error) {
      setErrorMessage(translations[language].password_reset_failed); // Show correct error message
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center transition-colors duration-500 ${
        darkMode ? "bg-[#000c20]" : "bg-gray-100"
      }`}
    >
      <div
        className={`shadow-lg rounded-lg p-8 w-full max-w-md ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
      >
        <h1 className="text-2xl font-bold mb-4 text-center">{translations[language].reset_password}</h1>
        <p className="text-sm mb-6 text-center">
          {translations[language].enter_new_password}
        </p>

        {errorMessage && (
          <div className={`mb-4 p-3 text-sm rounded-lg ${darkMode ? "bg-red-800 text-red-200" : "bg-red-100 text-red-700"}`}>
            {errorMessage}
          </div>
        )}

        <input
          type="password"
          placeholder={translations[language].enter_new_password_placeholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800 border-gray-900"
          }`}
        />

        <button
          onClick={handleResetPassword}
          className="w-full bg-blue-600 text-white p-3 rounded-lg mt-4 hover:bg-blue-700 transition"
        >
          {translations[language].reset_password_button}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
