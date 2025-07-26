import pytest
import json
from flaskApp import app  # import the Flask app object

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_predict_from_input(client):
    print("Press Ctrl+C to stop the test.\n")
    while True:
        try:
            crop_name = input("Enter crop name: ")
            msp = float(input("Enter MSP (number): "))
            date = input("Enter date (YYYY-MM-DD): ")

            data = {
                "cropName": crop_name,
                "msp": msp,
                "date": date
            }
            response = client.post("/predict", json=data)
            json_data = response.get_json()

            print("\nServer Response:")
            print(json.dumps(json_data, indent=4))

            assert response.status_code == 200

            if "error" in json_data:
                print("\nError received:", json_data["error"])
                print("Test Case: INVALID ❌")
            else:
                assert "marketPrice" in json_data
                assert "farmerPrice" in json_data
                print("\nMarket Price:", json_data["marketPrice"])
                print("Farmer Price:", json_data["farmerPrice"])
                print("Test Case: VALID ✅")

            print("\n--- New Request ---\n")

        except KeyboardInterrupt:
            print("\nExiting test loop.")
            break
        except Exception as e:
            print(f"Error: {e}")



# pytest -s test_flask_api.py
