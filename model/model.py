# 🌟 Import Libraries
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import warnings

warnings.filterwarnings("ignore")

# 📊 Load Dataset
file_path = "Dataset!.xlsx"
df = pd.read_excel(file_path)

# 🗓️ Date Conversion and Feature Engineering
df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
df['Month'] = df['Date'].dt.month
df['Year'] = df['Date'].dt.year

def get_season(month):
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Summer'
    elif month in [6, 7, 8]:
        return 'Monsoon'
    return 'Autumn'

df['Season'] = df['Month'].apply(get_season)

# 🚜 Encode categorical variables
crop_encoder = LabelEncoder()
season_encoder = LabelEncoder()
df['Crop Name'] = crop_encoder.fit_transform(df['Crop Name'])
df['Season'] = season_encoder.fit_transform(df['Season'])

# 🎯 Features & Multi-output Target
features = ['Crop Name', 'Season', 'MSP (₹)', 'Month', 'Year']
X = df[features]
y = df[['Market Price (₹)', 'Farmer Price (₹)']]

# 📏 Scale Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 🎓 Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# 🚀 Multi-output Model (Lightweight but accurate)
base_model = GradientBoostingRegressor(
    n_estimators=150,  # Lower than 300 to reduce size
    learning_rate=0.1,
    max_depth=7,
    random_state=42
)
model = MultiOutputRegressor(base_model)
model.fit(X_train, y_train)

# 📈 Evaluation
def evaluate_model(y_true, y_pred):
    mse = mean_squared_error(y_true, y_pred, multioutput='raw_values')
    r2 = r2_score(y_true, y_pred, multioutput='raw_values')
    print(f"Market Price - MSE: {mse[0]:.2f}, R²: {r2[0]:.2f}")
    print(f"Farmer Price - MSE: {mse[1]:.2f}, R²: {r2[1]:.2f}\n")

y_pred = model.predict(X_test)
evaluate_model(y_test, y_pred)

# 🔮 Prediction Function
def predict_prices(crop_name, msp, date_str):
    date = pd.to_datetime(date_str, format="%d-%m-%Y", errors='coerce')
    if pd.isnull(date):
        raise ValueError("Invalid date format. Use DD-MM-YYYY.")
    
    month, year = date.month, date.year
    season = get_season(month)
    
    if crop_name not in crop_encoder.classes_:
        raise ValueError(f"Unknown crop: {crop_name}. Available: {list(crop_encoder.classes_)}")
    
    crop_encoded = crop_encoder.transform([crop_name])[0]
    season_encoded = season_encoder.transform([season])[0]

    input_data = pd.DataFrame([[crop_encoded, season_encoded, msp, month, year]], columns=features)
    input_scaled = scaler.transform(input_data)
    market_price, farmer_price = model.predict(input_scaled)[0]

    return round(market_price, 2), round(farmer_price, 2)

# 🌾 Example Prediction
try:
    market_price, farmer_price = predict_prices("Tomato", 45, "15-03-2025")
    print(f"📈 Market Price: ₹{market_price} | 🌾 Farmer Price: ₹{farmer_price}")
except ValueError as e:
    print(e)

# 💾 Save models and encoders (compressed)
joblib.dump(model, 'multi_price_model.pkl', compress=5)
joblib.dump(scaler, 'scaler.pkl', compress=5)
joblib.dump(crop_encoder, 'crop_encoder.pkl', compress=5)
joblib.dump(season_encoder, 'season_encoder.pkl', compress=5)

print("✅ All models and encoders saved with compression!")
