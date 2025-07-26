import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isHomePage = [].includes(currentPath);

    if (!isHomePage) {
      document.body.className = darkMode ? "bg-[#000c20] text-white" : "bg-white text-black";
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } else {
      document.body.className = ""; // Reset styles for home pages
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
