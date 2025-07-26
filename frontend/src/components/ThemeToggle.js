import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";

const ThemeToggle = () => {
  const { darkMode, setDarkMode } = useTheme();
  const { language } = useLanguage(); // Ensure language is from state

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="absolute top-4 right-4 w-32 h-12 text-sm font-bold rounded-lg border-2 border-white-500 bg-[#030711] text-white hover:bg-gray-600 transition-all"
    >
      {translations[language]?.[darkMode ? "lightMode" : "darkMode"]}
    </button>
  );
};

export default ThemeToggle;
