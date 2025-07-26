import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import ForgotPassword from "./pages/ForgotPassword";
import SignupSelection from "./pages/SignupSelection";
import FarmerRegister from "./pages/FarmerRegister";
import BuyerRegister from "./pages/BuyerRegister";
import AdminRegister from "./pages/AdminRegister";
import DeliveryRegister from "./pages/DeliveryRegister";
import Login from "./pages/Login";
import OtpVerification from "./pages/OtpVerification";
import ResetPassword from "./pages/ResetPassword";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { LanguageProvider } from "./context/LanguageContext";

// Import home pages without theme interference
import FarmerHome from "./pages/FarmerHome";
import BuyerHome from "./pages/BuyerHome";
import AdminHome from "./pages/AdminHome";
import DeliveryHome from "./pages/DeliveryHome";

const AppContent = () => {

  return (
    <>
      {<ThemeToggle />}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup-selection" element={<SignupSelection />} />
        <Route path="/register/farmer" element={<FarmerRegister />} />
        <Route path="/register/buyer" element={<BuyerRegister />} />
        <Route path="/register/admin" element={<AdminRegister />} />
        <Route path="/register/deliverypartner" element={<DeliveryRegister />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Home pages WITHOUT theme context */}
        <Route path="/farmer-home" element={<FarmerHome />} />
        <Route path="/buyer-home" element={<BuyerHome />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/delivery-home" element={<DeliveryHome />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;