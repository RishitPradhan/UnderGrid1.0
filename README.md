# MineSafe-v2 (UnderGrid AI)

**MineSafe-v2** is an advanced, AI-powered mine safety and real-time monitoring system designed for modern industrial mining operations. It provides a comprehensive suite of tools for worker safety, environmental monitoring, emergency response, and autonomous risk mitigation.

---

## 🚀 Key Features

### 📡 Real-Time Monitoring
*   **Biometrics Dashboard**: Monitor worker heart rate, body temperature, and stress levels in real-time.
*   **Seismic Activity Tracking**: Live monitoring of ground vibrations and tectonic stability using `SeismicMonitor.tsx`.
*   **Ventilation Control**: Automated and manual management of mine air quality and airflow via `VentilationControl.tsx`.
*   **Hazard Heatmapping**: Dynamic visualization of environmental risks (gas levels, temperature spikes) using `HazardHeatmap`.

### 🤖 AI-Powered Safety
*   **Global AI Assistant**: A persistent, context-aware chatbot for safety queries and data analysis.
*   **Automated Safety Reports**: Generates detailed, data-driven safety assessments using Google Gemini AI.
*   **AI Risk Engine**: Predictive analysis of potential hazards based on live sensor data.

### 🚁 Emergency & Operations
*   **Autonomous Drone Patrols**: Simulated drone surveillance for hazardous area inspection and worker checks.
*   **Dynamic Evacuation Pathfinding**: Calculates and visualizes the safest routes out of the mine during emergencies.
*   **Helmet HUD Simulation**: Interactive Head-Up Display for workers to receive critical alerts and navigation cues.
*   **Incident Timeline**: Comprehensive logging and visualization of safety incidents and system alerts.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Visualizations**: Leaflet (Maps), Chart.js (Data charts)
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js & Express
- **Database**: MongoDB (Mongoose ODM)
- **Real-Time**: Socket.io for live sensor feeds
- **AI Integration**: Google Generative AI (Gemini)
- **Monitoring**: Prometheus, Winston, Loki
- **Communication**: Twilio for emergency SMS alerts

---

## 📂 Project Structure

```text
MineSafe-v2/
├── backend/            # Express server, MongoDB models, Socket.io, AI services
│   ├── routes/         # API endpoints (seismic, ventilation, biometrics, etc.)
│   ├── controllers/    # Business logic for routes
│   ├── models/         # Mongoose schemas for data persistence
│   └── ai-service/     # Gemini AI integration logic
├── frontend/           # React SPA (Vite)
│   ├── src/
│   │   ├── components/ # Modular UI components (HUD, HUD, DronePatrol, etc.)
│   │   ├── pages/      # Main application views/dashboards
│   │   └── services/   # API and WebSocket client handlers
└── geospatial/         # Specialized geospatial data and logic
```

---

## 🛠 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Gemini API Key](https://aistudio.google.com/app/apikey)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file and configure:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    TWILIO_SID=your_twilio_sid
    TWILIO_AUTH_TOKEN=your_twilio_token
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 🛡 License
This project is licensed under the MIT License.

---

## 👨‍💻 Developed By
Part of the **UnderGrid AI** initiative.
