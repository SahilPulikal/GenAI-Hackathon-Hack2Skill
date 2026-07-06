<div align="center">

# 🧭 CareCompass AI
### Intelligent Eldercare & Medication Coordinator

**A Google GenAI Hackathon (Hack2Skill) Project**

[![Built with Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

</div>

---

## 🎯 What is CareCompass AI?

**CareCompass AI** is an AI-powered eldercare management platform designed to help **family caregivers** coordinate the health and daily routines of elderly patients. It combines **Google Gemini's multimodal AI** with a real-time care dashboard to eliminate medication errors, missed schedules, and the cognitive burden of caregiving.

**Demo Patient:** Robert Miller, 78 — managed by caregiver Sarah Miller (daughter).

**Working Prototype Google Cloud Run Deployed Link** : https://carecompass-ai-899229286203.asia-south1.run.app/

**Demo Video** : https://youtu.be/gfhGzbx18_w

**Demo PPT** : https://github.com/SahilPulikal/GenAI-Hackathon-Hack2Skill/blob/83b24368a43725bf692f055aae03e9c2c0c953da/Sahil%20Pulikal%20_%20Gen%20AI%20Academy%20APAC%20Edition%20Hack2Skill.pdf

---

## ✨ Key Features

| Feature | Description | Powered By |
|---|---|---|
| 🤖 **AI Caregiver Copilot** | Conversational assistant that knows the patient's full profile, medications, and schedule | Google Gemini 1.5 Flash |
| 📸 **Prescription Label OCR** | Upload a photo of a medicine bottle — AI extracts name, dosage, frequency automatically | Gemini Multimodal Vision |
| 📄 **Discharge Document Parser** | Upload a hospital discharge PDF/image — AI extracts care tasks and syncs them to the daily plan | Gemini Multimodal Vision |
| 📅 **AI Schedule Optimizer** | Rebuilds the full daily care timeline intelligently based on all active medications and conditions | Gemini 1.5 Pro |
| 💊 **Medication Manager** | Full CRUD for patient medications with refill tracking and side-effect logging | REST API + JSON DB |
| 📊 **Adherence Analytics** | Visual chart tracking medication compliance percentage over time | Recharts |
| 🔍 **Eldercare Resource Finder** | Semantic search for local care services — transport, therapy, support groups | Keyword Scoring Engine |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐      ┌──────────────────────────────┐
│         Frontend (React/Vite)       │      │     Backend (Node/Express)   │
│                                     │      │                              │
│  ┌─────────────┐  ┌──────────────┐  │      │  ┌────────────────────────┐  │
│  │  Dashboard  │  │  AI Chat UI  │  │◄────►│  │  REST API Endpoints    │  │
│  └─────────────┘  └──────────────┘  │      │  └────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  │      │              │               │
│  │ Med Manager │  │  Doc Upload  │  │      │  ┌────────────────────────┐  │
│  └─────────────┘  └──────────────┘  │      │  │   Google Gemini AI     │  │
└─────────────────────────────────────┘      │  │   (Multimodal + Chat)  │  │
                                             │  └────────────────────────┘  │
                                             │              │               │
                                             │  ┌────────────────────────┐  │
                                             │  │   db.json (Local DB)   │  │
                                             │  └────────────────────────┘  │
                                             └──────────────────────────────┘
```

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** v18 or higher — [Download](https://nodejs.org/en/download)
- **npm** v9 or higher (comes with Node.js)
- **Git** — [Download](https://git-scm.com/downloads)
- A **Google Gemini API Key** (free) — [Get one here](https://aistudio.google.com/app/apikey)

Verify your installs:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show v9.x or higher
```

---

## 🚀 Running the Project — Step by Step

### Step 1 — Clone the Repository

```bash
git clone https://github.com/SahilPulikal/GenAI-Hackathon-Hack2Skill.git
cd "GenAI-Hackathon-Hack2Skill"
```

---

### Step 2 — Set Up the Backend

#### 2a. Navigate to the backend folder
```bash
cd backend
```

#### 2b. Install dependencies
```bash
npm install
```

#### 2c. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```bash
# On Windows (PowerShell)
copy NUL .env
# Then open it in any text editor and paste the contents below
```

Add this content to `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

> **Get a free Gemini API Key:** Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), sign in with your Google account, and click "Create API Key".

> ⚠️ **Without a real API key**, the app runs in **Mock Mode** — all AI features return realistic dummy responses so you can still explore the UI fully. The header will show an amber "Mock Developer Mode" indicator.

#### 2d. Start the backend server
```bash
npm run dev
```

You should see:
```
📡 CareCompass API Server running on http://localhost:5000
🚀 SUCCESS: GEMINI_API_KEY detected. Vertex/AI Studio integration enabled.
```

> ℹ️ Leave this terminal open. The backend must stay running.

---

### Step 3 — Set Up the Frontend

Open a **new terminal window** (keep the backend running).

#### 3a. Navigate to the frontend folder
```bash
# From the project root:
cd frontend
```

#### 3b. Install dependencies
```bash
npm install
```

#### 3c. Start the frontend dev server
```bash
npm run dev
```

You should see:
```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 4 — Open the App

Open your browser and go to:

```
http://localhost:5173
```

🎉 **CareCompass AI is now running!**

**For deploying in Google Cloud Run:**
```
gcloud run deploy carecompass-ai --source . --region asia-south1 --allow-unauthenticated --set-env-vars GEMINI_API_KEY=[API_KEY]
```

---

## 🧪 Testing the AI Features

Once the app is open, try these in order:

### 1. AI Chat Copilot (Right sidebar)
- Type: *"What are the side effects of Lisinopril?"*
- Type: *"Robert is feeling dizzy, what should I do?"*
- Click the quick-question chips for instant answers

### 2. Upload a Prescription Label
- Click **"Upload Med Label Photo"** in the right panel
- Upload any image of a pill bottle or prescription label
- AI will extract: drug name, dosage, frequency, instructions
- Click **"Confirm & Sync to Patient List"** to add it to Robert's medications

### 3. Upload a Discharge Document
- Click **"Upload Discharge Slip"**
- Upload a hospital discharge summary (image or PDF)
- AI will extract care tasks and suggest adding them to the schedule

### 4. AI Schedule Optimizer
- Click **"AI Optimize"** button in the Daily Care Plan panel
- Gemini Pro rebuilds the full daily timeline based on all active medications and patient conditions

### 5. Medication Manager
- Click **"Add Pill"** to manually add a medication
- Hover over any medication card and click the 🗑️ icon to remove it
- Every add/delete automatically triggers a schedule rebuild

### 6. Eldercare Resource Finder
- Type in the search box: *"wheelchair transport"*, *"memory care"*, *"physical therapy"*
- Click **"Ask AI about them"** on any result to get AI commentary in the chat

---

## 📁 Project Structure

```
GenAI-Hackathon-Hack2Skill/
│
├── backend/                        # Node.js + Express API Server
│   ├── index.js                    # Main server — all API endpoints + Gemini integration
│   ├── db.json                     # Local flat-file database (auto-created on first run)
│   ├── package.json
│   ├── .env                        # ⚠️ YOU CREATE THIS — contains GEMINI_API_KEY
│   └── uploads/                    # Temporary storage for uploaded files (auto-cleared)
│
├── frontend/                       # React + Vite + TailwindCSS App
│   ├── src/
│   │   ├── App.jsx                 # Main application component (entire UI)
│   │   ├── index.css               # Global styles + glassmorphism + animations
│   │   └── main.jsx                # React entry point
│   ├── index.html                  # HTML shell with SEO meta tags
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                      # Protects .env, node_modules, uploads
└── README.md                       # This file
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get patient profile |
| `POST` | `/api/profile` | Update patient profile |
| `GET` | `/api/meds` | List all medications |
| `POST` | `/api/meds/add` | Add a new medication |
| `DELETE` | `/api/meds/:id` | Remove a medication |
| `POST` | `/api/meds/parse` | **[AI]** OCR a prescription label image |
| `POST` | `/api/discharge/parse` | **[AI]** Parse a discharge document |
| `GET` | `/api/schedule` | Get daily schedule + compliance logs |
| `POST` | `/api/schedule/toggle` | Mark a task complete/incomplete |
| `POST` | `/api/schedule/rebuild` | **[AI]** Rebuild optimized daily schedule |
| `GET` | `/api/resources?search=` | Search eldercare resources |
| `POST` | `/api/chat` | **[AI]** Send a message to the AI copilot |

---

## 🧠 AI Integration Details

All AI features use **Google Gemini** via the `@google/generative-ai` SDK:

| Endpoint | Model Used | Capability |
|---|---|---|
| `/api/chat` | `gemini-1.5-flash` | Multi-turn conversation with full patient context |
| `/api/meds/parse` | `gemini-1.5-flash` | Multimodal vision — reads prescription label images |
| `/api/discharge/parse` | `gemini-1.5-flash` | Multimodal vision — extracts tasks from clinical documents |
| `/api/schedule/rebuild` | `gemini-1.5-pro` | Reasoning — optimizes care timelines from medication data |

**Mock Mode:** If no API key is provided, every AI endpoint returns realistic, hardcoded responses. The app is fully functional in mock mode for demos.

---

## 🛑 Troubleshooting

| Problem | Solution |
|---|---|
| `Cannot connect to http://localhost:5000` | Backend is not running. Run `npm run dev` inside `/backend` |
| `Port 5173 already in use` | Another process is using that port. Run `npm run dev -- --port 5174` |
| `Port 5000 already in use` | Change `PORT=5001` in `backend/.env` and update `API_BASE` in `frontend/src/App.jsx` |
| AI returns mock/dummy data | Your `GEMINI_API_KEY` in `.env` is not set or invalid |
| `node_modules not found` | Run `npm install` in both `/backend` and `/frontend` folders |
| `db.json` corrupted | Delete `backend/db.json` — it will be recreated with seed data on next server start |

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 8 |
| **Styling** | TailwindCSS 3 + Custom Glassmorphism |
| **UI Components** | Lucide React (icons), Recharts (analytics) |
| **Backend** | Node.js + Express 4 |
| **AI / LLM** | Google Gemini 1.5 Flash & Pro (`@google/generative-ai`) |
| **File Uploads** | Multer (multipart form handling) |
| **Database** | JSON flat-file (`db.json`) with UUID identifiers |
| **Font** | Outfit + Inter (Google Fonts) |

---

## 🏆 Hackathon Context

This project was built for the **Google GenAI Hackathon — Hack2Skill**.

**Problem Statement:** Family caregivers of elderly patients face enormous cognitive load managing medications, appointments, and care instructions across multiple providers, often leading to medication errors and missed care milestones.

**Our Solution:** CareCompass AI acts as a 24/7 AI-powered caregiver assistant that can read prescription labels with a phone camera, parse hospital discharge instructions, and proactively coordinate an intelligent daily care plan — all powered by Google Gemini's multimodal generative AI.

---

<div align="center">

Built with ❤️ for the Google GenAI Hackathon · Hack2Skill 2026

</div>
