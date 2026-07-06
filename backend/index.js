const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up file uploading for image processing
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Database File Path
const DB_PATH = path.join(__dirname, 'db.json');

// Helper to check if Gemini API key exists
const isMockMode = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_free_gemini');
if (isMockMode) {
  console.warn("⚠️ WARNING: No valid GEMINI_API_KEY found in environment variables. Running in MOCK DEV MODE.");
} else {
  console.log("🚀 SUCCESS: GEMINI_API_KEY detected. Vertex/AI Studio integration enabled.");
}

// ----------------------------------------------------
// DATABASE INITIALIZATION & SEED DATA
// ----------------------------------------------------
const initialDb = {
  profile: {
    patientName: "Robert Miller",
    age: 78,
    conditions: ["Hypertension", "Type 2 Diabetes", "Mild Cognitive Impairment"],
    allergies: ["Penicillin"],
    primaryCaregiver: "Sarah Miller (Daughter)",
    caregiverPhone: "(555) 234-5678"
  },
  medications: [
    {
      id: "med-1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      instructions: "Take 1 tablet in the morning with or without food for blood pressure.",
      timeOfDay: ["Morning"],
      refillsLeft: 3,
      sideEffects: ["Dizziness", "Dry Cough", "Headache"],
      dateAdded: "2026-06-01"
    },
    {
      id: "med-2",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      instructions: "Take 1 tablet with breakfast and 1 tablet with dinner for blood sugar.",
      timeOfDay: ["Morning", "Evening"],
      refillsLeft: 5,
      sideEffects: ["Nausea", "Stomach Upset", "Metallic Taste"],
      dateAdded: "2026-06-01"
    },
    {
      id: "med-3",
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily at bedtime",
      instructions: "Take 1 tablet at night before bed for cholesterol.",
      timeOfDay: ["Night"],
      refillsLeft: 2,
      sideEffects: ["Muscle aches", "Mild fatigue"],
      dateAdded: "2026-06-15"
    }
  ],
  schedule: [
    { id: "task-1", time: "08:00 AM", category: "Medication", title: "Take Lisinopril (10mg)", detail: "Blood pressure pill. Take with water.", completed: false },
    { id: "task-2", time: "08:30 AM", category: "Medication", title: "Take Metformin (500mg)", detail: "Blood sugar pill. Take with breakfast.", completed: false },
    { id: "task-3", time: "09:00 AM", category: "Measurement", title: "Check Blood Glucose", detail: "Target: under 130 mg/dL fasting.", completed: false },
    { id: "task-4", time: "02:00 PM", category: "Activity", title: "Cognitive Exercises", detail: "Crossword puzzle or memory card games (15 mins).", completed: false },
    { id: "task-5", time: "06:30 PM", category: "Medication", title: "Take Metformin (500mg)", detail: "Blood sugar pill. Take with dinner.", completed: false },
    { id: "task-6", time: "09:30 PM", category: "Medication", title: "Take Atorvastatin (20mg)", detail: "Cholesterol pill. Take right before sleep.", completed: false }
  ],
  resources: [
    {
      id: "res-1",
      name: "Golden Years Eldercare Solutions",
      category: "In-home Support",
      description: "Dedicated caregivers providing non-medical in-home companionship, respite care, light cooking, and hygiene assistance.",
      phone: "(555) 432-1090",
      location: "Northside & Downtown",
      services: ["Dementia Support", "Respite Care", "Meal Prep"]
    },
    {
      id: "res-2",
      name: "Silver Wheels Senior Transport",
      category: "Transportation",
      description: "Door-to-door medical shuttle service equipped with wheelchair lifts. Offers subsidized rides to local hospitals, clinics, and pharmacies.",
      phone: "(555) 890-5432",
      location: "Countywide",
      services: ["Medical Appointments", "Pharmacy Pickup"]
    },
    {
      id: "res-3",
      name: "Summit Physical Therapy & Rehab",
      category: "Wellness & Physical Therapy",
      description: "Specialized geriatric physical therapists focusing on balance training, fall prevention, and strength recovery after surgery or illness.",
      phone: "(555) 678-1234",
      location: "West End Plaza",
      services: ["Balance Coaching", "Post-Stroke Rehab", "Home Assessments"]
    },
    {
      id: "res-4",
      name: "Dementia & Memory Care Family Group",
      category: "Support Group",
      description: "Weekly peer support meetings for family caregivers dealing with Alzheimer's and cognitive decline. Free resources and guidance.",
      phone: "(555) 123-9876",
      location: "Community Center (District 4)",
      services: ["Caregiver Respite", "Support Meetings", "Education"]
    },
    {
      id: "res-5",
      name: "Apex Pharmacy & Medical Supply",
      category: "Medical Supply & Pharmacy",
      description: "Local pharmacy offering custom pill blister packs, automatic refills, and home delivery of prescription medications.",
      phone: "(555) 234-8765",
      location: "Central Avenue",
      services: ["Blister Packaging", "Home Delivery", "Mobility Equipment"]
    }
  ],
  complianceLogs: [
    { date: "2026-07-01", adherence: 100 },
    { date: "2026-07-02", adherence: 83 },
    { date: "2026-07-03", adherence: 100 },
    { date: "2026-07-04", adherence: 66 },
    { date: "2026-07-05", adherence: 100 }
  ]
};

// Ensure database file exists
const initDbFile = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
  }
};
initDbFile();

// Read Database Helper
const readDb = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file", error);
    return initialDb;
  }
};

// Write Database Helper
const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing database file", error);
  }
};

// ----------------------------------------------------
// GOOGLE GEMINI API INITIALIZATION
// ----------------------------------------------------
let generativeModel = null;
if (!isMockMode) {
  try {
    // Initialize the Google Gen AI client using developer API Key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    generativeModel = ai;
  } catch (e) {
    console.error("Failed to initialize Google Gen AI client, falling back to Mock mode.", e);
  }
}

// Helper to convert local file to Generative Part Object
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 1. Profile Endpoints
app.get('/api/profile', (req, res) => {
  const db = readDb();
  res.json(db.profile);
});

app.post('/api/profile', (req, res) => {
  const db = readDb();
  db.profile = { ...db.profile, ...req.body };
  writeDb(db);
  res.json({ success: true, profile: db.profile });
});

// 2. Medication Endpoints
app.get('/api/meds', (req, res) => {
  const db = readDb();
  res.json(db.medications);
});

app.post('/api/meds/add', (req, res) => {
  const db = readDb();
  const newMed = {
    id: `med-${uuidv4().substring(0, 8)}`,
    dateAdded: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.medications.push(newMed);
  writeDb(db);
  res.json({ success: true, medication: newMed });
});

app.delete('/api/meds/:id', (req, res) => {
  const db = readDb();
  db.medications = db.medications.filter(m => m.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 3. Multimodal Parser: Parse Medication Label
app.post('/api/meds/parse', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  // Check if Mock Mode or key is not working
  if (isMockMode || !generativeModel) {
    // Delete uploaded file to keep folder clean
    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 1000);
    
    // Return mock parsed medication
    const mockMeds = [
      {
        name: "Metoprolol Succinate",
        dosage: "25mg",
        frequency: "Once daily in the morning",
        instructions: "Take 1 tablet daily with a meal. Do not crush or chew.",
        timeOfDay: ["Morning"],
        refillsLeft: 6,
        sideEffects: ["Dizziness", "Fatigue", "Slow heart rate"]
      },
      {
        name: "Gabapentin",
        dosage: "300mg",
        frequency: "Three times daily",
        instructions: "Take 1 capsule every 8 hours. May cause drowsiness.",
        timeOfDay: ["Morning", "Afternoon", "Evening"],
        refillsLeft: 4,
        sideEffects: ["Drowsiness", "Unsteadiness", "Fatigue"]
      }
    ];
    const selectedMock = mockMeds[Math.floor(Math.random() * mockMeds.length)];
    return res.json({
      success: true,
      source: "Mock Engine (No API Key)",
      medication: selectedMock
    });
  }

  try {
    const imagePart = fileToGenerativePart(filePath, mimeType);
    const model = generativeModel.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this prescription medicine label image. 
    Extract the following information and output strictly as a JSON object with these exact keys:
    {
      "name": "Name of the drug",
      "dosage": "Strength e.g. 50mg, 10ml",
      "frequency": "How often to take e.g. Once daily, twice daily",
      "instructions": "Full patient instructions / directions for use",
      "timeOfDay": ["Morning", "Afternoon", "Evening", "Night"], // select all that apply based on directions
      "refillsLeft": 3 // number representing refills remaining, default to 0 if not found
    }
    Make sure you output ONLY the valid JSON, no markdown formatting blocks, no triple backticks.`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // Safe JSON parsing
    let cleanJsonStr = responseText;
    if (cleanJsonStr.includes("```")) {
      cleanJsonStr = cleanJsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    const parsedMed = JSON.parse(cleanJsonStr);

    // Append extra details from a side-effects lookup
    parsedMed.sideEffects = ["Check with your doctor or pharmacist for details."];
    
    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      source: "Gemini 1.5 Flash",
      medication: parsedMed
    });
  } catch (error) {
    console.error("Gemini OCR Parsing Error:", error);
    // Cleanup file in case of error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: "Failed to parse image. Gemini API error or invalid label format.", details: error.message });
  }
});

// 4. Clinical Document PDF / Image Parser: Extract Care Tasks
app.post('/api/discharge/parse', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No document file uploaded." });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  if (isMockMode || !generativeModel) {
    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 1000);
    return res.json({
      success: true,
      source: "Mock Engine (No API Key)",
      tasks: [
        { time: "09:00 AM", category: "Measurement", title: "Check blood pressure", detail: "Rest for 5 mins first. Report if systolic > 140." },
        { time: "11:00 AM", category: "Wellness", title: "Walk for 10 minutes", detail: "Assisted mobility exercise to prevent stiffness." },
        { time: "05:00 PM", category: "Measurement", title: "Check Blood Glucose", detail: "Fasting glucose, log reading in care log." }
      ]
    });
  }

  try {
    const docPart = fileToGenerativePart(filePath, mimeType);
    const model = generativeModel.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this clinical discharge summary, care note, or instruction document.
    Identify any critical care tasks, measurements (e.g. check blood pressure, monitor glucose), therapy exercises, or specific activity rules mentioned for the patient to follow at home.
    Extract them as a JSON list of tasks, where each task has these exact keys:
    [
      {
        "time": "Estimated time of day to perform e.g. 08:00 AM, 02:00 PM, Bedtime",
        "category": "Measurement OR Activity OR Wellness",
        "title": "Short title of the task",
        "detail": "Detailed instruction from the paper on what to do"
      }
    ]
    Return ONLY the valid JSON, no wrapper or formatting.`;

    const result = await model.generateContent([prompt, docPart]);
    const responseText = result.response.text().trim();
    
    let cleanJsonStr = responseText;
    if (cleanJsonStr.includes("```")) {
      cleanJsonStr = cleanJsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    const parsedTasks = JSON.parse(cleanJsonStr);

    fs.unlinkSync(filePath);
    res.json({
      success: true,
      source: "Gemini 1.5 Flash",
      tasks: parsedTasks
    });
  } catch (error) {
    console.error("Gemini Document Parsing Error:", error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: "Failed to parse document.", details: error.message });
  }
});

// 5. Schedule (Calendar checklist) Endpoints
app.get('/api/schedule', (req, res) => {
  const db = readDb();
  res.json({ schedule: db.schedule, logs: db.complianceLogs });
});

app.post('/api/schedule/toggle', (req, res) => {
  const { taskId, completed } = req.body;
  const db = readDb();
  db.schedule = db.schedule.map(task => {
    if (task.id === taskId) {
      return { ...task, completed };
    }
    return task;
  });

  // Re-calculate today's compliance adherence percentage
  const total = db.schedule.length;
  const done = db.schedule.filter(t => t.completed).length;
  const adherence = total > 0 ? Math.round((done / total) * 100) : 100;

  const todayStr = new Date().toISOString().split('T')[0];
  const existingLogIndex = db.complianceLogs.findIndex(l => l.date === todayStr);
  if (existingLogIndex > -1) {
    db.complianceLogs[existingLogIndex].adherence = adherence;
  } else {
    db.complianceLogs.push({ date: todayStr, adherence });
  }

  writeDb(db);
  res.json({ success: true, schedule: db.schedule, logs: db.complianceLogs });
});

// 6. Intelligent Rebuilder: Uses Gemini to reconcile medical list + patient conditions into an optimal daily timeline
app.post('/api/schedule/rebuild', async (req, res) => {
  const db = readDb();
  const meds = db.medications;
  const profile = db.profile;

  if (meds.length === 0) {
    return res.json({ success: false, message: "No medications listed to rebuild calendar." });
  }

  if (isMockMode || !generativeModel) {
    // Basic local engine rebuild
    const rebuilt = [];
    meds.forEach((m, idx) => {
      const times = m.timeOfDay.length > 0 ? m.timeOfDay : ["Morning"];
      times.forEach(time => {
        let timeStr = "08:00 AM";
        if (time === "Afternoon") timeStr = "01:00 PM";
        if (time === "Evening") timeStr = "06:30 PM";
        if (time === "Night") timeStr = "09:30 PM";

        rebuilt.push({
          id: `task-rebuilt-${idx}-${time}`,
          time: timeStr,
          category: "Medication",
          title: `Take ${m.name} (${m.dosage})`,
          detail: m.instructions,
          completed: false
        });
      });
    });

    // Add general care routines
    rebuilt.push({
      id: "task-general-1",
      time: "10:00 AM",
      category: "Activity",
      title: "Gentle Morning Stretch",
      detail: "10-15 minute walk or chair exercises to support mobility and balance.",
      completed: false
    });
    
    if (profile.conditions.includes("Type 2 Diabetes")) {
      rebuilt.push({
        id: "task-general-2",
        time: "07:30 AM",
        category: "Measurement",
        title: "Check blood glucose fasting",
        detail: "Log blood glucose in tracker booklet.",
        completed: false
      });
    }

    // Sort by time (simple sort)
    rebuilt.sort((a,b) => a.time.localeCompare(b.time));

    db.schedule = rebuilt;
    writeDb(db);
    return res.json({ success: true, source: "Mock Rebuild Engine", schedule: db.schedule });
  }

  try {
    const model = generativeModel.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Reconcile the medications list and medical conditions of the elderly patient into an optimal daily timeline schedule.
    
    Patient Profile:
    - Name: ${profile.patientName}
    - Age: ${profile.age}
    - Conditions: ${profile.conditions.join(', ')}
    - Allergies: ${profile.allergies.join(', ')}

    Active Medications:
    ${JSON.stringify(meds, null, 2)}

    INSTRUCTIONS:
    1. Organize taking times to avoid conflict (e.g. some diabetes drugs with breakfast/dinner, blood pressure in the morning).
    2. Supplement with 1-2 standard wellness tasks appropriate for their age/conditions (e.g. check glucose if diabetic, walking exercises, check blood pressure).
    3. Return a clean list of structured calendar tasks as JSON array with these keys:
    [
      {
        "id": "Unique string id",
        "time": "Standard time string e.g. 08:30 AM, 01:00 PM, 09:00 PM",
        "category": "Medication OR Measurement OR Activity",
        "title": "Short title of the task",
        "detail": "Instruction on how to take or perform (with warnings if relevant e.g. take with food, check for dry cough side effect)"
      }
    ]
    Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    let cleanJsonStr = responseText;
    if (cleanJsonStr.includes("```")) {
      cleanJsonStr = cleanJsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    const rebuiltSchedule = JSON.parse(cleanJsonStr).map(task => ({
      ...task,
      completed: false // default to uncompleted
    }));

    db.schedule = rebuiltSchedule;
    writeDb(db);
    res.json({ success: true, source: "Gemini 1.5 Pro", schedule: db.schedule });
  } catch (error) {
    console.error("Gemini Schedule Rebuilder Error:", error);
    res.status(500).json({ error: "Failed to rebuild schedule using AI." });
  }
});

// 7. Semantic Local Resources Finder (RAG Simulation)
app.get('/api/resources', async (req, res) => {
  const query = (req.query.search || "").toLowerCase().trim();
  const db = readDb();

  if (!query) {
    return res.json(db.resources);
  }

  // If Mock Mode or simple search is desired
  // We perform text-matching score based on matching keywords in name, category, services, description
  const scoredResources = db.resources.map(res => {
    let score = 0;
    const descText = `${res.name} ${res.category} ${res.description} ${res.services.join(' ')}`.toLowerCase();
    
    // Split query into keywords
    const keywords = query.split(/\s+/);
    keywords.forEach(keyword => {
      if (descText.includes(keyword)) score += 10;
      if (res.category.toLowerCase().includes(keyword)) score += 5;
      if (res.name.toLowerCase().includes(keyword)) score += 5;
    });

    return { ...res, score };
  });

  // Filter items with score > 0 and sort by highest score
  const filtered = scoredResources
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return the matches
  res.json(filtered.length > 0 ? filtered : db.resources);
});

// 8. Caregiver Assistant Copilot: Handles conversation history and patient health records
app.post('/api/chat', async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Empty chat message." });
  }

  const db = readDb();
  const profile = db.profile;
  const meds = db.medications;
  const schedule = db.schedule;

  // Format context for prompt
  const profileStr = JSON.stringify(profile, null, 2);
  const medsStr = JSON.stringify(meds, null, 2);
  const scheduleStr = JSON.stringify(schedule, null, 2);

  if (isMockMode || !generativeModel) {
    // Smart local mock responder
    const lowMsg = message.toLowerCase();
    let response = "I'm here to help you coordinate care for Robert. You can ask about his pills, search for senior shuttle resources, or let me know how his symptoms are.";

    if (lowMsg.includes("lisinopril") || lowMsg.includes("blood pressure")) {
      response = "Robert takes Lisinopril 10mg once daily in the morning (usually at 08:00 AM) for his Hypertension. Make sure he takes it with a glass of water. A known side effect is dizziness or a dry cough. If he experiences dizziness, check his blood pressure immediately.";
    } else if (lowMsg.includes("metformin") || lowMsg.includes("diabetes") || lowMsg.includes("sugar")) {
      response = "Robert is on Metformin 500mg twice daily—taken with breakfast (08:30 AM) and dinner (06:30 PM). This helps control his Type 2 Diabetes. Common side effects include mild stomach upset. Monitor his blood sugar levels regularly, especially before meals.";
    } else if (lowMsg.includes("dizzy") || lowMsg.includes("faint") || lowMsg.includes("side effect")) {
      response = "Dizziness can be caused by Lisinopril (his blood pressure medication), especially when standing up quickly. Check his blood pressure using the home monitor and ensure he's hydrated. If he has a reading below 90/60 mmHg or if dizziness persists, contact his primary care physician.";
    } else if (lowMsg.includes("schedule") || lowMsg.includes("routine")) {
      response = `Here is Robert's morning routine:\n- 08:00 AM: Take Lisinopril 10mg\n- 08:30 AM: Take Metformin 500mg with breakfast\n- 09:00 AM: Check blood glucose levels.\n\nLet me know if you would like me to adjust any times.`;
    } else if (lowMsg.includes("allergy") || lowMsg.includes("penicillin")) {
      response = "Robert is allergic to Penicillin. Please verify that any new prescription prescribed by doctor does not contain penicillin or related beta-lactam antibiotics.";
    }

    return res.json({
      success: true,
      source: "Mock Copilot Engine",
      reply: response
    });
  }

  try {
    const model = generativeModel.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format chat history for Gemini
    const formattedHistory = chatHistory.slice(-6).map(h => {
      return `${h.sender === 'user' ? 'Caregiver' : 'CareCompass Assistant'}: ${h.text}`;
    }).join('\n');

    const systemPrompt = `You are CareCompass, an AI Elderly Care Assistant.
    You assist Sarah Miller (daughter & caregiver) in managing the health and routines of her father, Robert Miller.

    PATIENT PROFILE CONTEXT:
    ${profileStr}

    ACTIVE MEDICATIONS:
    ${medsStr}

    DAILY SCHEDULE CHECKLIST:
    ${scheduleStr}

    INSTRUCTIONS:
    1. Answer queries with compassion, empathy, and high accuracy.
    2. If asked about medication side effects or safety, reference his current list. Suggest logging measurements or contacting his doctor if symptoms sound risky.
    3. Keep answers concise, clear, and actionable. Do not suggest medications not listed in the profile.
    4. Highlight critical warnings in bold (e.g. allergies like Penicillin).

    CHAT HISTORY:
    ${formattedHistory}

    Caregiver Question: ${message}
    CareCompass Assistant:`;

    const result = await model.generateContent(systemPrompt);
    const replyText = result.response.text().trim();

    res.json({
      success: true,
      source: "Gemini 1.5 Flash",
      reply: replyText
    });
  } catch (error) {
    console.error("Gemini Chat Copilot Error:", error);
    res.status(500).json({ error: "Failed to query Caregiver Copilot." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`📡 CareCompass API Server running on http://localhost:${PORT}`);
});
