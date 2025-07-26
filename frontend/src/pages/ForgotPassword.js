import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext"; // Import Language Context
import translations from "../utils/translations"; // Import translation file

const ForgotPassword = () => {
  const [mobile, setMobile] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { language } = useLanguage(); // Get selected language

  const handleSendOtp = async () => {
    if (!mobile) {
      alert(translations[language].error_empty_mobile); 
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/forgot-password", { mobile });

      if (response.data.message === "OTP sent successfully") {
        localStorage.setItem("userMobile", mobile); // Store mobile number for OTP verification
        navigate("/otp-verification");
      }
    } catch (error) {
      setErrorMessage(translations[language].otp_send_failed);
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
          {translations[language].enter_mobile}
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        <input
          type="text"
          placeholder={translations[language].enter_mobile_placeholder}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800 border-gray-900"}`}
        />

        <button
          className="w-full bg-blue-600 text-white p-3 rounded-lg mt-4 hover:bg-blue-700 transition"
          onClick={handleSendOtp}
        >
          {translations[language].send_otp}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
