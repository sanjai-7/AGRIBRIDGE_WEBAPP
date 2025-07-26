import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext"; 
// import ThemeToggle from "../components/ThemeToggle"; // Import the theme toggle button
import ThemeContext from "../context/ThemeContext"; 
import farmerImg from "../assets/farmer.jpg";
import buyerImg from "../assets/buyer.jpg";
import adminImg from "../assets/admin.jpg";
import translations from "../utils/translations";
import { useTheme } from "../context/ThemeContext";

const SignupSelection = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext); // Access theme context
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

      const farmerCommands = ["farmer", "register farmer", "farmer register", "உழவர்", "விவசாயி","former","foreigner"];
      const buyerCommands = ["buyer", "register buyer", "buyer register", "வாங்குபவர்", "கையளவு"];
      const deliveryPartnerCommands = ["விநியோகக் கூட்டாளர்", "விநியோக கூட்டாளர்", "வினியோக கூட்டாளர்", "delivery", "delivery partner", "டெலிவரி", "டெலிவரி பாட்ட்னர்", "டெலிவரி பங்காளர்"];
      const themeCommands = ["change team", "change teen", "team", "teen", "theme", "change theme","சேஞ்ஜ் தீம்","தீம்","டீம்","பையன் முறை"];

      if (farmerCommands.some(word => speech.includes(word))) {
        navigate("/register/farmer");
      } else if (buyerCommands.some(word => speech.includes(word))) {
        navigate("/register/buyer");
      } else if (deliveryPartnerCommands.some(word => speech.includes(word))) {
        navigate("/register/deliverypartner");
      } else if (speech.includes("light theme") || speech.includes("light mode") || speech.includes("light team") || speech.includes("ஒளி பயன்முறை")) {
        toggleTheme();setDarkMode(false);
      } else if (speech.includes("dark theme") || speech.includes("dark mode") || speech.includes("dark team") || speech.includes("இருண்ட பயன்முறை")) {
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

  return (
    <div className={`fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"}`}>
      <h1 className="text-3xl md:text-4xl font-bold md:mb-16 mb-8">
        {translations[language].chooseRole}
      </h1>

      <div className="flex flex-col md:flex-row gap-y-8 gap-x-6 justify-center items-center w-full max-w-6xl px-4">
        {[{ img: farmerImg, label: translations[language].farmer, path: "/register/farmer" },
          { img: buyerImg, label: translations[language].buyer, path: "/register/buyer" },
          { img: adminImg, label: translations[language].administrator, path: "/register/admin" }
        ].map(({ img, label, path }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            className={`w-80 h-48 md:w-[30rem] lg:w-[36rem] md:h-[18rem] shadow-md hover:shadow-lg border ${darkMode ? "border-white" : "border-gray-300"} rounded-lg flex flex-col justify-between cursor-pointer transition-transform duration-300 bg-white overflow-hidden`}
          >
            <div className="w-full h-[77%] flex items-center justify-center bg-[#e9f5ff]">
              <img src={img} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-[23%] bg-black text-white text-lg font-bold flex items-center justify-center">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => navigate("/register/deliverypartner")}
        className={`w-48 h-14 sm:w-48 sm:h-16 md:w-[20rem] md:h-[4rem] md:mt-12 mt-4 mb-12 shadow-md hover:shadow-lg border ${darkMode ? "border-white" : "border-gray-300"} rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-300 bg-white overflow-hidden`}
      >
        <div className="w-full h-full bg-black text-white text-base sm:text-lg md:text-xl font-bold flex items-center justify-center">
          {translations[language].deliveryPartner}
        </div>
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

export default SignupSelection;