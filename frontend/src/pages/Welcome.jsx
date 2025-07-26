import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ThemeContext from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";
import { useTheme } from "../context/ThemeContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { language, setLanguage } = useLanguage();
  const { setDarkMode } = useTheme();
  const [listening, setListening] = useState(false);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ta" : "en"));
  };

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

      const loginCommands = ["login","உள்நுழை","உள் நுழை", "உள்நுழைவு", "முல்லை", "விலை", "வீடுகளை", "நியூ லைன்", "மும் இல்லை", "புள்ளி", "நீ முலை","வில்லை","ம் இல்லை","கூகிளை"];
      const registerCommands = ["register", "sign up", "பதிவு"];
      const themeCommands = ["change team", "change teen", "team", "teen", "theme", "change theme","சேஞ்ஜ் தீம்","தீம்","டீம்","பையன் முறை"];

      // ✅ Login commands
      if (loginCommands.some(word => speech.includes(word))) {
        navigate("/login");

      // ✅ Register commands
      } else if (registerCommands.some(word => speech.includes(word))) {
        navigate("/signup-selection");

      // ✅ Tamil language switch
      } else if (speech.includes("tamil") || speech.includes("தமிழ்")) {
        setLanguage("ta");

      // ✅ English language switch
      } else if (speech.includes("english") || speech.includes("இங்கிலிஷ்") || speech.includes("ஆங்கிலம்")) {
        setLanguage("en");

      // ✅ Light theme set
      } else if (speech.includes("light theme") || speech.includes("light mode") || speech.includes("ஒளி பயன்முறை")) {
        setDarkMode(false);

      // ✅ Dark theme set
      } else if (speech.includes("dark theme") || speech.includes("dark mode") || speech.includes("இருண்ட பயன்முறை") || speech.includes("இருந்த பயன்முறை")) {
        setDarkMode(true);

      // ✅ Toggle theme
      } else if (themeCommands.some(word => speech.includes(word))) {
        toggleTheme();

      // ✅ Unrecognized command
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

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 p-4 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Language Toggle Button */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 left-4 px-3 sm:px-4 py-[12px] sm:py-[11px] border-2 rounded-md 
                  bg-[#000c20] text-white hover:bg-gray-400 transition-all text-sm sm:text-base"
      >
        {translations[language].language}
      </button>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-32 h-12 text-sm font-bold rounded-lg border-2 border-white-500 bg-[#030711] text-white hover:bg-gray-600 transition-all"
      >
        {translations[language]?.[darkMode ? "lightMode" : "darkMode"]}
      </button>

      {/* Voice Assistant Button */}
      <button
        onClick={startVoiceRecognition}
        className="absolute bottom-6 right-6 px-4 py-3 rounded-full shadow-lg text-white font-bold 
                  bg-[#ff9900] hover:bg-[#cc7a00] transition"
      >
        🎤 {listening ? translations[language].listening : translations[language].voice}
      </button>

      {/* Logo */}
      <img
        src={logo}
        alt="AgriBridge Logo"
        className="w-80 h-52 mb-14 border-2 border-[#030711] shadow-2xl rounded-lg hover:shadow-[0_0_30px_#13d941,#009dff] transition-shadow duration-300"
      />

      {/* Login Button */}
      <button
        onClick={() => navigate("/login")}
        className="w-full max-w-xs py-3 text-lg font-bold rounded-lg transition-all duration-300 bg-[#13d941] text-black hover:bg-[#0d7c25] hover:text-white shadow-md mb-4"
      >
        {translations[language].login}
      </button>

      {/* Register Button */}
      <button
        onClick={() => navigate("/signup-selection")}
        className="w-full max-w-xs py-3 text-lg font-bold rounded-lg transition-all duration-300 bg-[#009dff] text-black hover:bg-[#0056b3] hover:text-white shadow-md"
      >
        {translations[language].register}
      </button>
    </div>
  );
};



export default Welcome;