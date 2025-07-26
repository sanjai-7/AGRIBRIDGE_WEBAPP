import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeContext from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { setDarkMode } = useTheme();
  const { language } = useLanguage();
  const [listening, setListening] = useState(false);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "en" ? "en-US" : "ta-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      console.log("You said:", speech);

      const loginCommands = ["login", "உள்நுழைவு", "உள்நுழை","உள் நுழை", "முல்லை", "விலை", "வீடுகளை", "நியூ லைன்", "மும் இல்லை", "புள்ளி", "நீ முலை","வில்லை","ம் இல்லை","கூகிளை"];
      const themeCommands = ["change team", "change teen", "team", "teen", "theme", "change theme","சேஞ்ஜ் தீம்","தீம்","டீம்","பையன் முறை"];

      if (loginCommands.some(word => speech.includes(word))) {
        handleLogin();
      } else if (speech.includes("forgot password") || speech.includes("கடவுச்சொல் மறந்துவிட்டதா") || speech.includes("கடவுச்சொல் மறந்துவிட்ட")) {
        navigate("/forgot-password");
      } else if (speech.includes("light theme") || speech.includes("light mode") || speech.includes("ஒளி பயன்முறை")) {
        setDarkMode(false);
      } else if (speech.includes("dark theme") || speech.includes("dark mode") || speech.includes("இருண்ட பயன்முறை")) {
        setDarkMode(true);
      } else if (themeCommands.some(word => speech.includes(word))) {
        toggleTheme();
      } else {
        alert(`Unrecognized command: ${speech}`);
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", { mobile, password });
      if (response.data.message === "Login successful") {
        const { role, name, mobile } = response.data.user;
        const token = response.data.token;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify({ name, mobile, role }));

        if (role === "admin") navigate("/admin-home");
        else if (role === "farmer") navigate("/farmer-home");
        else if (role === "buyer") navigate("/buyer-home");
        else if (role === "deliveryPartner") navigate("/delivery-home");
      }
    } catch (error) {
      setErrorMessage(translations[language].loginFailed);
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center transition-colors duration-500 p-4 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Theme Toggle Button at top-right */}
      {/* <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div> */}
      <h1 className="text-4xl font-bold mb-8">{translations[language].title}</h1>

      {errorMessage && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4 w-80">
          {errorMessage}
        </div>
      )}

      <div
        className={`w-80 p-6 border-2 rounded-lg shadow-lg transition-all duration-300 ${
          darkMode ? "bg-[#030711] text-white border-gray-600" : "bg-white text-black border-gray-300"
        }`}
      >
        <div>
          <label
            className={`block text-lg font-medium ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {translations[language].mobileNumber}
          </label>
          <input
            type="text"
            placeholder={translations[language].enterMobile}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={`w-full p-3 mb-4 border rounded-lg ${
              darkMode
                ? "text-black bg-gray-200"
                : "text-black bg-white border-gray-900"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-lg font-medium ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {translations[language].password}
          </label>
          <input
            type="password"
            placeholder={translations[language].enterPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-3 mb-2 border rounded-lg ${
              darkMode
                ? "text-black bg-gray-200 "
                : "text-black bg-white border-gray-900"
            }`}
          />
        </div>

        <p
          onClick={() => navigate("/forgot-password")}
          className="text-[#0073ff] mb-4 hover:underline cursor-pointer text-sm text-center mt-2"
        >
          {translations[language].forgotPassword}
        </p>

        <button
          onClick={handleLogin}
          className="w-full p-3 bg-[#13d941] text-black font-bold rounded-lg hover:bg-[#0d7c25] hover:text-white transition-all"
        >
          {translations[language].loginButton}
        </button>
      </div>
      {/* Voice Assistant Button */}
      <button
        onClick={startVoiceRecognition}
        className="absolute bottom-6 right-6 px-4 py-3 rounded-full shadow-lg text-white font-bold 
                  bg-[#ff9900] hover:bg-[#cc7a00] transition"
      >
        🎤 {listening ? translations[language].listening : translations[language].voice}
      </button>
    </div>
  );
};

export default Login;