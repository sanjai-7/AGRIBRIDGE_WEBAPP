# AGRIBRIDGE

AGRIBRIDGE is an innovative web application designed to bridge the gap between farmers and buyers, enabling seamless, transparent, and efficient crop trading. The platform empowers farmers to showcase their produce directly to potential buyers, fostering fair trade and reducing middlemen.

---

### Notes!

- Ensure the following are installed and properly configured before running the project:
  - <a href="https://nodejs.org/" target="_blank">Node.js</a> (version 14.x or above)
  - npm (comes with Node.js)
  - <a href="https://www.python.org/downloads/release/python-3122/" target="_blank">Python</a> (version 3.12.2)
  - <a href="https://www.mongodb.com/try/download/community" target="_blank">MongoDB Community Server</a> (with MongoDB Compass for GUI)
  - <a href="https://tailwindcss.com/" target="_blank">Tailwind CSS</a> (already configured in the frontend project; just `npm install` is enough)
  - All required Node.js and Python dependencies (run `npm install` in `/frontend` and `/backend`, and install packages in `/model` as per `requirements.txt`)


- The OTP is printed to the backend terminal for development/testing purposes.

---

## Project Setup Instructions

Follow these steps to run the application locally:

---
### 1️⃣ Open the Project Folder

Open the **AGRIBRIDGE** folder in **Visual Studio Code** or your preferred code editor.

---

### 2️⃣ Open Three Terminals

Inside VS Code, open three terminals and navigate to the respective folders:

| Terminal  | Command                      |
|-----------|------------------------------|
| Terminal 1 | `cd backend`                 |
| Terminal 2 | `cd model`                   |
| Terminal 3 | `cd frontend`                |

---

### 3️⃣ Run the Servers

Start the servers in the following order:

---
✅ **Terminal 1 (Backend):**  
Run the Node.js server:
```bash
npm install   # (run only the first time)
```
```bash
node server.js
```
---
✅ **Terminal 2 (ML Model):**  
Run the Python flask app:

```bash
pip install -r requirements.txt   # (run only the first time)
```
```bash
python flaskApp.py
```
---
✅ **Terminal 3 (Frontend):**  
Start the React frontend:

```bash
npm install # (run only the first time)
```

```bash
npm start
```

---
- ➡️ The frontend will automatically open in your browser at: http://localhost:3000
- ➡️ The backend will be running in your browser at: http://localhost:5000
- ➡️ The model will be running in your browser at: http://localhost:5001

---


### User Registration & OTP Verification

  1.Go to Register on the web app.
  
  2.Enter your details, including your mobile number.
  
  3.An OTP will be displayed in the backend terminal (VS Code) for testing purposes.
  
  4.Enter the OTP in the app to complete registration.
  
  5.Once OTP is verified, your user account will be created.

---

### User Login

After successful registration:


  1.Go to the Login page.
  
  2.Enter your mobile number and password.
  
  3.Click Login — you are now ready to use AGRIBRIDGE!

---



### 📂 Project Structure
```bash
AGRIBRIDGE/
├── frontend/   # React frontend
├── backend/    # Node.js backend
└── model/      # Python Flask ML model
```
---
