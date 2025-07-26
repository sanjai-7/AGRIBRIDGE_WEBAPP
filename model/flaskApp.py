from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load optimized single model and required tools
model = joblib.load('multi_price_model.pkl')
crop_encoder = joblib.load('crop_encoder.pkl')
season_encoder = joblib.load('season_encoder.pkl')
scaler = joblib.load('scaler.pkl')

# Month-to-Season mapping
def get_season(month):
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Summer'
    elif month in [6, 7, 8]:
        return 'Monsoon'
    else:
        return 'Autumn'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    try:
        crop_name = data['cropName']
        msp = float(data['msp'])
        date = pd.to_datetime(data['date'], format='%Y-%m-%d', errors='coerce')

        if pd.isna(date):
            raise ValueError("Invalid date format. Use YYYY-MM-DD.")

        month, year = date.month, date.year
        season = get_season(month)

        # Ensure crop is known
        if crop_name not in crop_encoder.classes_:
            raise ValueError(f"Unknown crop: {crop_name}. Available: {list(crop_encoder.classes_)}")

        crop_encoded = crop_encoder.transform([crop_name])[0]
        season_encoded = season_encoder.transform([season])[0]

        input_data = pd.DataFrame([[crop_encoded, season_encoded, msp, month, year]],
                                  columns=['Crop Name', 'Season', 'MSP (₹)', 'Month', 'Year'])

        input_scaled = scaler.transform(input_data)
        prediction = model.predict(input_scaled)[0]

        response = {
            'marketPrice': round(prediction[0], 2),
            'farmerPrice': round(prediction[1], 2)
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
