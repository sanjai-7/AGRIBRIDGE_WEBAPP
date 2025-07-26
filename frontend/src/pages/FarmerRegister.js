import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeContext from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../utils/translations";

const FarmerRegister = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage();
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    otp: "",
    email: "",
    password: "",
    village: "",
    district: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDialogEnd, setShowDialogEnd] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setDialogMessage(translations[language].locationFetched);
          setShowDialog(true);
        },
        () => {
          setDialogMessage(translations[language].locationError);
          setShowDialog(true);
        }
      );
    } else {
      setDialogMessage(translations[language].geoNotSupported);
      setShowDialog(true);
    }
  };

  const sendOTP = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      setDialogMessage(translations[language].invalidMobile);
      setShowDialog(true);
      return;
    }
    try {
      await axios.post("http://localhost:5000/send-otp", { mobile: formData.mobile });
      setOtpSent(true);
      setDialogMessage(translations[language].otpSent);
      setShowDialog(true);
    } catch {
      setDialogMessage(translations[language].otpFailed);
      setShowDialog(true);
    }
  };

  const handleRegister = async () => {
    const { name, mobile, otp, password, village, district, state, pincode, latitude, longitude } = formData;

    if (!name || !mobile || !otp || !password || !village || !district || !state || !pincode || !latitude || !longitude) {
      setDialogMessage(translations[language].fillAllFields);
      setShowDialog(true);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/register", { ...formData, role: "farmer" });
      setDialogMessage(translations[language].registrationSuccessful);
      setShowDialogEnd(true);
    } catch (error) {
      setDialogMessage(translations[language].registrationFailed);
      setShowDialog(true);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 pt-16 transition-colors duration-500 ${darkMode ? "bg-[#000c20] text-white" : "bg-white text-black"}`}>
      
      <h2 className="text-3xl font-bold mb-8 mt-4">{translations[language].farmerRegistration}</h2>

      <div className={`w-full max-w-4xl p-8 border-2 rounded-lg shadow-lg transition-all duration-300 ${darkMode ? "bg-[#030711] text-white" : "bg-white text-black border-black"}`}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder={translations[language].fullName}
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />

            <div className="flex items-center gap-2">
              <input
                type="text"
                name="mobile"
                placeholder={translations[language].mobileNumber}
                value={formData.mobile}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg text-black border-black"
                required
              />
              <button
                onClick={sendOTP}
                className="px-5 py-0.5 bg-green-600 text-white rounded-lg hover:bg-green-800 transition"
              >
                {translations[language].sendOtp}
              </button>
            </div>

            {otpSent && (
              <input
                type="text"
                name="otp"
                placeholder={translations[language].enterOtp}
                value={formData.otp}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg text-black border-black"
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder={translations[language].emailOptional}
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
            />

            <input
              type="password"
              name="password"
              placeholder={translations[language].password}
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <input
              type="text"
              name="village"
              placeholder={translations[language].village}
              value={formData.village}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />

            <input
              type="text"
              name="district"
              placeholder={translations[language].district}
              value={formData.district}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />

            <input
              type="text"
              name="state"
              placeholder={translations[language].state}
              value={formData.state}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />

            <input
              type="text"
              name="pincode"
              placeholder={translations[language].pincode}
              value={formData.pincode}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg text-black border-black"
              required
            />
            <p className="text-xs text-white-500 mt-1 ml-3">{language === "ta" ? "( உங்கள் பயிர்கள் அனுப்பப்படும் இடத்தைக் குறிக்கவும்! )"
                                                                               : "( Fill the location from where your crops will be shipped! )"}
            </p>
            <div className="flex flex-col md:flex-row gap-2">
            <input
                type="text"
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude || ""}
                onChange={handleChange}
                className="w-full px-5 py-0.5 border rounded-lg text-black border-black"
              />
            <input
                type="text"
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude || ""}
                onChange={handleChange}
                className="w-full px-5 py-0.5 border rounded-lg text-black border-black"
              />
              <button
                onClick={getLocation}
                className="px-5 py-0.5 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition"
              >
                {translations[language].getLocation}
              </button>
              
            </div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full mt-6 p-3 bg-green-600 text-white rounded-lg hover:bg-green-800 transition"
        >
          {translations[language].register}
        </button>
      </div>

      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-80">
            <p className="text-center">{dialogMessage}</p>
            <button onClick={() => setShowDialog(false)} className="mt-4 w-full bg-red-500 p-2 rounded-lg hover:bg-red-600">
              {translations[language].close}
            </button>
          </div>
        </div>
      )}

      {showDialogEnd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-80">
            <p className="text-center">{dialogMessage}</p>
            <button onClick={() => {
                setShowDialogEnd(false);
                navigate("/"); // Change "/welcome" to your actual welcome route
                }}
              className="mt-4 w-full bg-red-500 p-2 rounded-lg hover:bg-red-600">
              {translations[language].close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRegister;
