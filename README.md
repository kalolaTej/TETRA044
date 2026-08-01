# 🛡️ Smart Farm Intrusion Detection System

A real-time AI-powered system that helps farmers protect their crops by detecting animal intrusions using computer vision. The system identifies animals from a live camera feed, sends instant alerts, and records intrusion events through a web dashboard.

---

## 📌 About the Project

Crop damage caused by animals such as cows, buffaloes, goats, and wild pigs is a major problem for farmers. Manual monitoring is difficult, especially during the night.

This project uses **YOLO** object detection to automatically detect animals entering farm boundaries. When an intrusion is detected, the system immediately alerts the farmer and stores the event for future monitoring.

---

## 📌 Features

- Real-time camera monitoring
- AI-based animal detection using YOLO
- Instant intrusion alerts
- Automatic event snapshot capture
- Web dashboard for monitoring
- Intrusion history and logs
- Easy configuration using environment variables
- Cloud database integration with Supabase

---

## 📌 Project Structure

```
Smart-Farm-Intrusion-System/
│
├── edge/          # AI detection on edge device
├── backend/       # REST API and database
├── web/           # React dashboard
└── README.md
```

---

## 📌 Tech Stack

### Frontend
- React
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express.js
- TypeScript

### AI
- Python
- YOLO11
- OpenCV
- Ultralytics

### Database
- Supabase

---

## 📌 Getting Started

### Clone the repository

```bash
git clone https://github.com/kalolaTej/Smart-Farm-Intrusion-System.git
cd Smart-Farm-Intrusion-System
```

### Install dependencies

#### Backend

```bash
cd backend
npm install
```

#### Web

```bash
cd web
npm install
```

#### Edge

```bash
cd edge
pip install -r requirements.txt
```

---

## ▶️ Run the Project

### Start Backend

```bash
npm run dev
```

### Start Web Dashboard

```bash
npm run dev
```

### Start Edge Detection

```bash
python detect.py
```

---

## 📸 System Workflow

1. Camera captures live video.
2. YOLO detects animals.
3. Detection is sent to the backend.
4. Event is stored in Supabase.
5. Dashboard displays the intrusion.
6. Farmer receives an alert.


---

## 👥 Team - Crystals (TETRA044)

---
