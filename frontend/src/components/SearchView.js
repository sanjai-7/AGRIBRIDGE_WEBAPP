import React from "react";
import { FaSearch } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 


const SearchView = ({
  showSearch,
  darkMode,
  searchQuery,
  setSearchQuery,
  handleSearchClick,
  handleCropSearchClick,
  searchResults,
  friendshipStatus,
  handleChat,
  confirmRemove,
  handleAddFriendClick,
  recentSearches,
  clearRecentSearches,
  cropSearchQuery,
  setCropSearchQuery,
  user,
  cropSearchResults,
  recentCropSearches,
  clearRecentCropSearches,
  setSelectedCrop,
  applyFilters,
  setFilterFarmerName,
  setShowCrops,
  
}) => {
  const { language } = useLanguage();  // Get Language State
  const getCropName = (cropName) => {
      const cropCategories = ["vegetableOptions", "fruitOptions", "pulsesOptions", "cerealsOptions", "spicesOptions"];
    
      if (language === "ta") {
        for (const category of cropCategories) {
          const index = translations.en[category].indexOf(cropName);
          if (index !== -1) {
            return translations.ta[category][index]; // Return Tamil name if found
          }
        }
      }
    
      return cropName.toUpperCase(); // Default to English
    };
    const getCropVariety = (variety) => {
      const index = translations.en.cropVarieties.indexOf(variety);
      return index !== -1 ? translations[language].cropVarieties[index] : variety;
    };

    const toCamelCase = (str) => {
      return str
        .toLowerCase()
        .split(" ")
        .map((word, index) =>
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    };

  if (!showSearch) return null;
  



  return (
    <div
      className={`fixed top-[5rem] left-0 w-full h-[calc(100vh-5rem-3.6rem)] p-4 transition-colors duration-500 ${
        darkMode ? "bg-[#000c20] text-white" : "bg-white text-gray-900"
      }`}>
      <div className="h-full flex flex-col md:flex-row gap-4">
        {/* Friends Search */}
        <div className={`flex-1 p-4 rounded-lg overflow-y-auto transition-colors duration-500 md:max-w-[50%] md:h-full h-[50%] 
          ${darkMode ? "shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "shadow-[0_0_15px_rgba(0,0,0,0.2)]"}`}>

          <h2 className="text-xl mb-2 font-bold flex items-center gap-2"> 🔍 {translations[language].seachFarmers}</h2>

          <div className="relative w-full mb-4">
            <input
              type="text"
              placeholder={translations[language].enterName}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-2 pr-10 rounded-lg border outline-none ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
              }`}
            />
            <FaSearch
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
              onClick={handleSearchClick}
            />
          </div>

          {searchResults && 
            (typeof searchResults === "string" ? (
              <p>{searchResults}</p>
            ) : (
              <div className="p-4 rounded-lg border">
                <h3 className="font-bold text-lg">{searchResults.name}</h3>
                <p><strong>{translations[language].profile.email}:</strong> {searchResults.email || translations[language].profile.notProvided}</p>
                <p><strong>{translations[language].profile.mobile}:</strong> {searchResults.mobile}</p>
                <p><strong>{translations[language].profile.village}:</strong> {searchResults.village}</p>
                <p><strong>{translations[language].profile.district}:</strong> {searchResults.district}</p>
                <p><strong>{translations[language].profile.state}:</strong> {searchResults.state}</p>

                <div className="flex flex-wrap gap-4 mt-5">  {/* ✅ FLEXBOX CONTAINER FOR HORIZONTAL BUTTONS */}
                  {friendshipStatus === "Friends" && searchResults.role!== "admin" && searchResults.role!== "deliveryPartner" && (
                    <>
                      <button
                        onClick={() => handleChat(searchResults)}
                        className="px-6 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                      >
                        {translations[language].chat}
                      </button>

                      <button
                        onClick={() => confirmRemove(searchResults)}
                        className="px-6 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition"
                      >
                        {translations[language].removeFriend}
                      </button>
                    </>
                  )}

                  {friendshipStatus !== "Friends" && searchResults.role!== "admin" && searchResults.role!== "deliveryPartner" && (
                    <button
                      onClick={handleAddFriendClick}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        friendshipStatus === "Cancel Request"
                          ? darkMode
                            ? "bg-red-600 text-white hover:bg-red-500"
                            : "bg-red-600 text-gray-900 hover:bg-red-400"
                          : darkMode
                          ? "bg-green-600 text-white hover:bg-green-500"
                          : "bg-green-500 text-gray-900 hover:bg-green-400"
                      }`}
                    >
                      {translations[language]?.[toCamelCase(friendshipStatus)]}
                    </button>
                  )}

                  {user.role === "buyer"&& (
                    <button
                      onClick={() => {
                        setFilterFarmerName(searchResults.name);
                        setShowCrops(true);
                      }}
                      className="px-4 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition"
                    >
                      {translations[language].viewCrops(searchResults.name)}
                    </button>
                  )}
                </div>
              </div>
            ))
          }


          <h3 className="text-lg font-medium mt-4">{translations[language].recentSearch}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {recentSearches.length > 0 ? (
              recentSearches.map((search, index) => <li key={index}>{search}</li>)
            ) : (
              <p>{translations[language].noRecentSearch}</p>
            )}
          </ul>
          {recentSearches.length > 0 && (
            <button
              onClick={clearRecentSearches}
              className={`mt-2 px-4 py-1 rounded-lg font-medium transition ${
                darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-300 text-gray-900 hover:bg-gray-400"
              }`}
            >
              {translations[language].clearRecentSearch}
            </button>
          )}
        </div>

        {/* Crops Search */}
        <div className={`flex-1 p-4 rounded-lg overflow-y-auto transition-colors duration-500 md:max-w-[50%] md:h-full h-[50%] 
          ${darkMode ? "shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "shadow-[0_0_15px_rgba(0,0,0,0.2)]"}`}>
          <h2 className="text-xl mb-2 font-bold flex items-center gap-2">🌱 {translations[language].searchCrops}</h2>

          <div className="relative w-full mb-4">
            <input
              type="text"
              placeholder={translations[language].enterCrop}
              value={cropSearchQuery}
              onChange={(e) => setCropSearchQuery(e.target.value)}
              className={`w-full p-2 pr-10 rounded-lg border outline-none ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
              }`}
            />
            <FaSearch
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
              onClick={handleCropSearchClick}
            />
          </div>

          {cropSearchResults.length > 0 ? (
            cropSearchResults.map((crop, index) => (
              <div key={index} className="p-4 mb-2 rounded-lg border space-y-2">
                <h3 className="font-bold text-lg">{getCropName(crop.name)}</h3>
                <p>
                  <strong>{translations[language].variety}:</strong> {getCropVariety(crop.variety)}
                </p>
                <p>
                  <strong>{translations[language].availableQuantity}:</strong> {crop.availableQuantity} {translations[language].kg_Lang}
                </p>
                <p>
                  <strong>{translations[language].productionDate}:</strong> {new Date(crop.productionDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>{translations[language].bestBefore}:</strong> {new Date(crop.bestBefore).toLocaleDateString()}
                </p>
                <p>
                  <strong>{translations[language].price}:</strong> ₹{crop.price} {translations[language].per_kg}
                </p>
                <p>
                  <strong>{translations[language].farmerName}:</strong> {crop.farmerName}
                </p>
                <p>
                  <strong>{translations[language].farmerMobile}:</strong> {crop.farmerMobile}
                </p>
                <p>
                  <strong>{translations[language].farmerDistance}:</strong> {crop.farmerDistance}
                </p>
                <p>
                  <strong>{translations[language].rating}: </strong> {crop.averageRating ? `${crop.averageRating}⭐` : ""} ({crop.ratingCount} {translations[language].rating})
                </p>
                {/* Show "Order" button only for buyers */}
                {user.role === "buyer" && (
                  
                  <div className="flex gap-2">
                    {/* Order Button */}
                    <button
                      onClick={() => setSelectedCrop(crop)}
                      className="px-4 py-2 mt-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                      {translations[language].order}
                    </button>

                    {/* View Farmer's Crops Button */}
                    <button
                      onClick={() => {
                        setFilterFarmerName(crop.farmerName); // Apply filter by farmer
                        applyFilters(); // Apply filters with updated filterFarmerName
                        setShowCrops(true); // Show crops list
                      }}
                      className="px-4 py-2 mt-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition"
                    >
                      {translations[language].viewCrops(crop.farmerName)}
                    </button>
                 </div>
                )}
              </div>
            ))
          ) : (
            <p></p>
          )}

          <h3 className="text-lg font-medium mt-4">{translations[language].recentCropSearch}</h3>
          <ul className="list-disc pl-5 space-y-1">
            {recentCropSearches.length > 0 ? (
              recentCropSearches.map((search, index) => <li key={index}>{search}</li>)
            ) : (
              <p>{translations[language].noRecentCropSearch}</p>
            )}
          </ul>
          {recentCropSearches.length > 0 && (
            <button
              onClick={clearRecentCropSearches}
              className={`mt-2 px-4 py-1 rounded-lg font-medium transition ${
                darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-300 text-gray-900 hover:bg-gray-400"
              }`}
            >
              {translations[language].clearRecentCropSearch}
            </button>
          )}
        </div>
      </div>
      
    </div>
    
  );
};

export default SearchView;
