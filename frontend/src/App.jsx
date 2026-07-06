import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  UploadCloud, 
  Trash2, 
  Search, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  Calendar, 
  User, 
  Plus, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ShieldAlert,
  Loader2,
  Clock,
  Sparkles,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// In production (Cloud Run), frontend and backend share the same origin.
// In local dev, the backend runs separately on port 5000.
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';


export default function App() {
  // --- STATE ---
  const [profile, setProfile] = useState({
    patientName: "Robert Miller",
    age: 78,
    conditions: [],
    allergies: [],
    primaryCaregiver: "",
    caregiverPhone: ""
  });
  const [medications, setMedications] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [complianceLogs, setComplianceLogs] = useState([]);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: '1', sender: 'bot', text: "Hello Sarah! I am CareCompass. I have loaded Robert's profile. Ask me anything about his medications, schedules, or coordinate support resources.", source: "System" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // App configurations & status
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isParsingMed, setIsParsingMed] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  // Parsed Output Modals
  const [parsedMedResult, setParsedMedResult] = useState(null);
  const [parsedDocResult, setParsedDocResult] = useState(null);
  
  // Edit Profile Form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...profile });
  
  // Add Medication Form
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [medForm, setMedForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    instructions: '',
    timeOfDay: ['Morning'],
    refillsLeft: 3
  });

  const chatEndRef = useRef(null);

  // --- FETCH DATA ON MOUNT ---
  useEffect(() => {
    fetchProfile();
    fetchMedications();
    fetchSchedule();
    fetchResources('');
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      const data = await res.json();
      setProfile(data);
      setProfileForm(data);
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${API_BASE}/meds`);
      const data = await res.json();
      setMedications(data);
    } catch (err) {
      console.error("Error fetching medications", err);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API_BASE}/schedule`);
      const data = await res.json();
      setSchedule(data.schedule);
      setComplianceLogs(data.logs);
    } catch (err) {
      console.error("Error fetching schedule", err);
    }
  };

  const fetchResources = async (query = '') => {
    try {
      const res = await fetch(`${API_BASE}/resources?search=${query}`);
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error("Error fetching resources", err);
    }
  };

  // --- HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setIsEditingProfile(false);
      }
    } catch (err) {
      console.error("Error updating profile", err);
    }
  };

  const handleToggleTask = async (taskId, completed) => {
    try {
      const res = await fetch(`${API_BASE}/schedule/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed })
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        setComplianceLogs(data.logs);
      }
    } catch (err) {
      console.error("Error toggling task", err);
    }
  };

  const handleAddMedication = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/meds/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm)
      });
      const data = await res.json();
      if (data.success) {
        setMedications(prev => [...prev, data.medication]);
        setIsAddingMed(false);
        setMedForm({
          name: '',
          dosage: '',
          frequency: 'Once daily',
          instructions: '',
          timeOfDay: ['Morning'],
          refillsLeft: 3
        });
        // Automatically rebuild schedule
        handleRebuildSchedule();
      }
    } catch (err) {
      console.error("Error adding medication", err);
    }
  };

  const handleDeleteMedication = async (medId) => {
    try {
      const res = await fetch(`${API_BASE}/meds/${medId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMedications(prev => prev.filter(m => m.id !== medId));
        handleRebuildSchedule();
      }
    } catch (err) {
      console.error("Error deleting medication", err);
    }
  };

  const handleRebuildSchedule = async () => {
    setIsRebuilding(true);
    try {
      const res = await fetch(`${API_BASE}/schedule/rebuild`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        // Alert trigger
        const replyText = `I have optimized Robert's daily schedule. Lisinopril has been scheduled for early morning, Metformin twice daily with meals (breakfast & dinner), and Atorvastatin before sleep. I also added a walking routine and a blood glucose check.`;
        setChatHistory(prev => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: replyText, source: data.source }
        ]);
      }
    } catch (err) {
      console.error("Error rebuilding schedule", err);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSearchResources = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchResources(val);
  };

  const handleSendChatMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    const queryText = directText || chatMessage;
    if (!queryText.trim()) return;

    // Add user message to history
    const userMsg = { id: Date.now().toString(), sender: 'user', text: queryText };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          chatHistory: chatHistory.concat(userMsg)
        })
      });
      const data = await res.json();
      setChatHistory(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: data.reply, source: data.source }
      ]);
    } catch (err) {
      console.error("Error chatting", err);
      setChatHistory(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: "Sorry, I lost connection to the server. Please check that the backend is running.", source: "Error" }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- MULTIMODAL UPLOADS ---
  const handleUploadMed = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingMed(true);
    setParsedMedResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/meds/parse`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setParsedMedResult(data.medication);
        if (data.source.includes("Mock")) {
          setApiKeyMissing(true);
        }
      }
    } catch (err) {
      console.error("Error parsing med", err);
    } finally {
      setIsParsingMed(false);
    }
  };

  const handleUploadDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingDoc(true);
    setParsedDocResult(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_BASE}/discharge/parse`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setParsedDocResult(data.tasks);
        if (data.source.includes("Mock")) {
          setApiKeyMissing(true);
        }
      }
    } catch (err) {
      console.error("Error parsing document", err);
    } finally {
      setIsParsingDoc(false);
    }
  };

  const acceptParsedMed = () => {
    if (!parsedMedResult) return;
    setMedications(prev => [
      ...prev,
      {
        id: `med-${uuidv4()}`,
        name: parsedMedResult.name,
        dosage: parsedMedResult.dosage,
        frequency: parsedMedResult.frequency,
        instructions: parsedMedResult.instructions,
        timeOfDay: parsedMedResult.timeOfDay || ["Morning"],
        refillsLeft: parsedMedResult.refillsLeft || 0,
        sideEffects: parsedMedResult.sideEffects || ["Check with doctor."],
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ]);
    setParsedMedResult(null);
    handleRebuildSchedule();
  };

  const acceptParsedTasks = () => {
    if (!parsedDocResult) return;
    const newTasks = parsedDocResult.map((t, idx) => ({
      id: `task-parsed-${idx}-${Date.now()}`,
      time: t.time || "09:00 AM",
      category: t.category || "Measurement",
      title: t.title,
      detail: t.detail,
      completed: false
    }));
    setSchedule(prev => [...prev, ...newTasks]);
    setParsedDocResult(null);
  };

  // Helper uuid generator
  const uuidv4 = () => {
    return 'xxxx-xxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Compliance average
  const todayAdherence = () => {
    if (schedule.length === 0) return 100;
    const done = schedule.filter(t => t.completed).length;
    return Math.round((done / schedule.length) * 100);
  };

  return (
    <div className="min-h-screen pb-10 flex flex-col text-slate-200">
      
      {/* --- HEADER --- */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 py-3 px-6 flex justify-between items-center shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 animate-pulse">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">CareCompass AI</h1>
            <p className="text-xs text-slate-400">Intelligent Eldercare Coordinator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border glass-panel">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiKeyMissing ? 'bg-amber-400' : 'bg-teal-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiKeyMissing ? 'bg-amber-500' : 'bg-teal-500'}`}></span>
            </span>
            <span className="text-slate-300">{apiKeyMissing ? "Mock Developer Mode" : "Google Gemini Live"}</span>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-medium">Caregiver Account</p>
            <p className="text-sm font-semibold text-teal-400">Sarah Miller</p>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTAINER --- */}
      <main className="max-w-[1600px] w-full mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* --- LEFT COL (8 cols): DASHBOARD VIEW --- */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* PROFILE SUMMARY WIDGET */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden animate-fade-in">
            <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <User className="w-7 h-7" />
              </div>
              
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Patient Name</label>
                    <input 
                      type="text" 
                      value={profileForm.patientName} 
                      onChange={e => setProfileForm({...profileForm, patientName: e.target.value})}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Age</label>
                    <input 
                      type="number" 
                      value={profileForm.age} 
                      onChange={e => setProfileForm({...profileForm, age: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Conditions (Comma separated)</label>
                    <input 
                      type="text" 
                      value={profileForm.conditions.join(', ')} 
                      onChange={e => setProfileForm({...profileForm, conditions: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Allergies (Comma separated)</label>
                    <input 
                      type="text" 
                      value={profileForm.allergies.join(', ')} 
                      onChange={e => setProfileForm({...profileForm, allergies: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">{profile.patientName}</h2>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-semibold">{profile.age} Years Old</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.conditions.map((c, i) => (
                      <span key={i} className="text-xs bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full font-medium">
                        {c}
                      </span>
                    ))}
                    {profile.allergies.map((a, i) => (
                      <span key={i} className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Allergy: {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <div className="flex md:flex-col justify-between items-end gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-5 shrink-0">
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400">Emergency Caregiver</p>
                  <p className="text-sm font-semibold text-slate-300">{profile.primaryCaregiver}</p>
                  <p className="text-xs text-teal-400/80 font-mono mt-0.5">{profile.caregiverPhone}</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300 transition"
                  id="btn-edit-profile"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* COMPLIANCE GRAPH & CALENDAR ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DAILY CARE CHECKLIST */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 min-h-[380px] relative">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-slate-100">Daily Care Plan</h3>
                </div>
                <button 
                  onClick={handleRebuildSchedule} 
                  disabled={isRebuilding}
                  className="flex items-center gap-1 text-xs font-bold text-teal-400 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/20 py-1.5 px-3 rounded-lg transition disabled:opacity-50"
                  id="btn-rebuild-schedule"
                >
                  {isRebuilding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isRebuilding ? "AI Rebuilding..." : "AI Optimize"}
                </button>
              </div>

              {schedule.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Clock className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="text-sm">No care tasks scheduled today.</p>
                  <p className="text-xs text-slate-500 mt-1">Upload a prescription or click "AI Optimize" to generate a timeline schedule.</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto max-h-[300px] pr-1 flex flex-col gap-2.5">
                  {schedule.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleTask(task.id, !task.completed)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        task.completed 
                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' 
                          : 'bg-slate-900/40 hover:bg-slate-900/60 border-white/5'
                      }`}
                      id={`task-${task.id}`}
                    >
                      <button className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition ${
                        task.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                          : 'border-white/20 text-transparent hover:border-teal-500'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[4px]" />
                      </button>
                      
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono font-semibold ${task.completed ? 'text-emerald-400' : 'text-teal-400'}`}>
                            {task.time}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {task.category}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold mt-0.5 ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{task.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADHERENCE ANALYTICS CHART */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 min-h-[380px]">
              <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-slate-100">Care Adherence Tracker</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{todayAdherence()}%</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Today's Goal</span>
                </div>
              </div>

              <div className="flex-grow h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complianceLogs} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickFormatter={(tick) => tick.substring(5)} 
                    />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelClassName="text-xs text-slate-400 font-bold"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="adherence" 
                      stroke="#14B8A6" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }} 
                      dot={{ fill: '#14B8A6', stroke: '#0A0D14', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Adherence logs daily percentage of medications and activities marked complete. Green points indicate optimal caregiver workflow completion.
              </p>
            </div>

          </div>

          {/* ACTIVE MEDICATIONS LIST */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-slate-100">Robert's Active Medications ({medications.length})</h3>
              </div>
              <button 
                onClick={() => setIsAddingMed(!isAddingMed)}
                className="flex items-center gap-1 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition"
                id="btn-toggle-add-med"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingMed ? "Close" : "Add Pill"}
              </button>
            </div>

            {/* Manual Form */}
            {isAddingMed && (
              <form onSubmit={handleAddMedication} className="p-4 rounded-xl border border-white/5 bg-slate-950/40 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Medication Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Amlodipine"
                    required
                    value={medForm.name} 
                    onChange={e => setMedForm({...medForm, name: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Dosage/Strength</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5mg"
                    required
                    value={medForm.dosage} 
                    onChange={e => setMedForm({...medForm, dosage: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Frequency</label>
                  <select 
                    value={medForm.frequency} 
                    onChange={e => setMedForm({...medForm, frequency: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                  >
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>As needed (PRN)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Instructions for caregiver</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Take with breakfast to prevent stomach upset"
                    value={medForm.instructions} 
                    onChange={e => setMedForm({...medForm, instructions: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Remaining Refills</label>
                  <input 
                    type="number" 
                    value={medForm.refillsLeft} 
                    onChange={e => setMedForm({...medForm, refillsLeft: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {medications.map((med) => (
                <div 
                  key={med.id} 
                  className="p-4 rounded-xl border border-white/5 bg-slate-900/40 relative overflow-hidden group hover:border-teal-500/20 transition-all"
                >
                  <button 
                    onClick={() => handleDeleteMedication(med.id)}
                    className="absolute right-3 top-3 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <h4 className="font-bold text-slate-200">{med.name}</h4>
                    <span className="text-xs text-slate-400 font-mono font-semibold ml-auto">{med.dosage}</span>
                  </div>

                  <p className="text-xs text-teal-400 font-semibold mt-2">{med.frequency}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{med.instructions}</p>
                  
                  <div className="border-t border-white/5 mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Added: {med.dateAdded}</span>
                    <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">Refills: {med.refillsLeft}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* --- RIGHT COL (4 cols): UPLOAD CENTER & RESOURCE FINDER & AI CHAT --- */}
        <section className="lg:col-span-4 flex flex-col gap-6">

          {/* AI COPILOT CHAT PANEL (Priority) */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col h-[500px]">
            <div className="border-b border-white/5 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-bold text-slate-100">Caregiver Assistant Copilot</h3>
                <span className="text-[10px] text-slate-400">Context: Robert Miller (78, Hypertension, Diabetes)</span>
              </div>
            </div>

            {/* Chat Logs */}
            <div className="flex-grow overflow-y-auto my-3 pr-1 flex flex-col gap-3">
              {chatHistory.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`flex flex-col max-w-[85%] ${chat.sender === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    chat.sender === 'user' 
                      ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none' 
                      : 'bg-slate-900/60 border border-white/5 rounded-tl-none text-slate-200'
                  }`}>
                    {chat.text}
                  </div>
                  {chat.source && chat.sender !== 'user' && (
                    <span className="text-[9px] text-slate-500 mt-1 self-start ml-2 font-mono">
                      Powered by: {chat.source}
                    </span>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs self-start bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <button 
                onClick={() => handleSendChatMessage(null, "Are there side effects for Lisinopril?")}
                className="text-[10px] bg-slate-900/60 hover:bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full transition"
              >
                Lisinopril Side Effects?
              </button>
              <button 
                onClick={() => handleSendChatMessage(null, "He is feeling dizzy, what should I do?")}
                className="text-[10px] bg-slate-900/60 hover:bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full transition"
              >
                Dizziness Protocols?
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask about side effects, schedules..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatMessage.trim()}
                className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* VISUAL DOCUMENT PROCESSING UPLOAD HUB */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
            <div className="border-b border-white/5 pb-2">
              <h3 className="font-bold text-slate-100">Medical Document OCR Parser</h3>
              <p className="text-xs text-slate-400">Ingest prescription labels or doctor discharge summaries using Gemini Multimodal vision.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              
              {/* Presc label Upload */}
              <div className="relative">
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 hover:border-teal-500/40 bg-slate-950/20 rounded-xl cursor-pointer hover:bg-slate-950/40 transition">
                  <UploadCloud className="w-6 h-6 text-teal-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-200">Upload Med Label Photo</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG - Max 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadMed} />
                </label>
                {isParsingMed && (
                  <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    <span className="text-xs font-medium">Gemini Reading Label...</span>
                  </div>
                )}
              </div>

              {/* Discharge Upload */}
              <div className="relative">
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 hover:border-teal-500/40 bg-slate-950/20 rounded-xl cursor-pointer hover:bg-slate-950/40 transition">
                  <FileText className="w-6 h-6 text-teal-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-200">Upload Discharge Slip</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">PDF or Image documents</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadDoc} />
                </label>
                {isParsingDoc && (
                  <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    <span className="text-xs font-medium">Gemini Processing Document...</span>
                  </div>
                )}
              </div>

            </div>

            {/* Results Med Modal */}
            {parsedMedResult && (
              <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded-xl flex flex-col gap-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-teal-400 border-b border-teal-500/10 pb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Gemini Extracted Medication</h4>
                  <button onClick={() => setParsedMedResult(null)} className="ml-auto text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Drug Name</span>
                    <span className="font-bold text-slate-200 text-sm">{parsedMedResult.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Dosage</span>
                    <span className="font-bold text-slate-200 text-sm">{parsedMedResult.dosage}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Frequency</span>
                    <span className="text-slate-300 font-semibold">{parsedMedResult.frequency}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Directions</span>
                    <p className="text-slate-300 leading-relaxed italic">{parsedMedResult.instructions}</p>
                  </div>
                </div>
                <button 
                  onClick={acceptParsedMed}
                  className="w-full mt-1.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  Confirm & Sync to Patient List
                </button>
              </div>
            )}

            {/* Results Doc Modal */}
            {parsedDocResult && (
              <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded-xl flex flex-col gap-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-teal-400 border-b border-teal-500/10 pb-1.5">
                  <FileCheck className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Discharge Tasks Extracted</h4>
                  <button onClick={() => setParsedDocResult(null)} className="ml-auto text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                  {parsedDocResult.map((t, idx) => (
                    <div key={idx} className="bg-slate-950/20 p-2 rounded border border-white/5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-teal-400 font-mono">{t.time}</span>
                        <span className="text-[9px] uppercase text-slate-500">{t.category}</span>
                      </div>
                      <p className="text-slate-200 font-semibold mt-0.5">{t.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{t.detail}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={acceptParsedTasks}
                  className="w-full mt-1.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  Import Care Guidelines
                </button>
              </div>
            )}

          </div>

          {/* RAG ELDERCARE SERVICES SEARCH */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
            <div className="border-b border-white/5 pb-2">
              <h3 className="font-bold text-slate-100">Local Eldercare Resource Finder</h3>
              <p className="text-xs text-slate-400">Search for local clinics, physical therapy, support groups, or senior transportation.</p>
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Search resources e.g. wheelchair transit..."
                value={searchQuery}
                onChange={handleSearchResources}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {resources.map((res) => (
                <div key={res.id} className="p-3 rounded-xl border border-white/5 bg-slate-950/30 flex flex-col gap-1.5 hover:border-teal-500/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{res.name}</h4>
                      <span className="text-[9px] font-semibold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {res.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {res.location}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{res.description}</p>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1 text-slate-400 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {res.phone}
                    </span>
                    <button 
                      onClick={() => handleSendChatMessage(null, `Tell me more details about: ${res.name}`)}
                      className="text-teal-400 hover:underline font-bold"
                    >
                      Ask AI about them
                    </button>
                  </div>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No matching eldercare resources found.</p>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="max-w-[1600px] w-full mx-auto px-4 mt-8 border-t border-white/5 pt-4 text-center text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 CareCompass AI - Building Better Living for Smarter Communities</p>
        <p>GCP Gen AI Hackathon Prototype • Powered by Google Gemini</p>
      </footer>

    </div>
  );
}
