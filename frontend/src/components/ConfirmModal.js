import { useLanguage } from "../context/LanguageContext";  // Import Language Context
import translations from "../utils/translations"; 

// src/components/ConfirmModal.js
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  const { language } = useLanguage();  // Get Language State
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="text-lg text-gray-900 dark:text-white mb-4">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md text-gray-900 dark:text-white"
          >
            {translations[language].cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            {translations[language].confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
  
export default ConfirmModal;