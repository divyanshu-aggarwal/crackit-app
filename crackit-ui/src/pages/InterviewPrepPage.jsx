import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AiLoadingOverlay from '../components/AiLoadingOverlay';
import InterviewChatPanel from '../components/InterviewChatPanel';
import PageHeader from '../components/ui/PageHeader'
import { API_BASE_URL } from '../api/axios'

const API = `${API_BASE_URL}/api`;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

const CATEGORY_COLORS = {
  "Technical": { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
  "Behavioral": { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  "System Design": { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  "Domain Knowledge": { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
};

const DIFFICULTY_COLORS = {
  "Easy": { bg: "#d1fae5", color: "#065f46" },
  "Medium": { bg: "#fef3c7", color: "#92400e" },
  "Hard": { bg: "#fee2e2", color: "#991b1b" },
};

const TYPE_ICONS = {
  "Technical": "ti-code",
  "Behavioral": "ti-users",
  "Situational": "ti-bulb",
};

export default function InterviewPrepPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [prep, setPrep] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("topics");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [newTopic, setNewTopic] = useState({ topic: "", category: "Technical", description: "", priority: 3 });
  const [chatPanelWidth, setChatPanelWidth] = useState(0); // 0 = closed
  const notesTimer = useRef(null);

  useEffect(() => {
    fetchJob();
    fetchPrep();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API}/jobs/${jobId}`, { headers: authHeaders() });
      if (res.ok) setJob(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPrep = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/jobs/${jobId}/interview-prep`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPrep(data);
        setNotes(data.notes || "");

        // If generating in background via Kafka, resume polling
        if (data && (data.status === "PENDING" || data.status === "IN_PROGRESS")) {
          setGenerating(true);
          const pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch(`${API}/ai/jobs/${jobId}/interview-prep`, { headers: authHeaders() });
              if (pollRes.ok) {
                const updated = await pollRes.json();
                if (updated && updated.status !== "PENDING" && updated.status !== "IN_PROGRESS") {
                  clearInterval(pollInterval);
                  setPrep(updated);
                  setNotes(updated.notes || "");
                  setGenerating(false);
                }
              }
            } catch {
              clearInterval(pollInterval);
              setGenerating(false);
            }
          }, 2000);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/ai/jobs/${jobId}/interview-prep`, {
        method: "POST", headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPrep(data);
        setNotes(data.notes || "");

        // If dispatched asynchronously via Kafka, poll until COMPLETED or FAILED
        if (data && (data.status === "PENDING" || data.status === "IN_PROGRESS")) {
          const pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch(`${API}/ai/jobs/${jobId}/interview-prep`, { headers: authHeaders() });
              if (pollRes.ok) {
                const updated = await pollRes.json();
                if (updated && updated.status !== "PENDING" && updated.status !== "IN_PROGRESS") {
                  clearInterval(pollInterval);
                  setPrep(updated);
                  setNotes(updated.notes || "");
                  setGenerating(false);
                }
              }
            } catch {
              clearInterval(pollInterval);
              setGenerating(false);
            }
          }, 2000);
          return;
        }
      }
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    setNotesSaved(false);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 1500);
  };

  const saveNotes = async (val) => {
    setSavingNotes(true);
    try {
      await fetch(`${API}/ai/jobs/${jobId}/interview-prep/notes`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ notes: val }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSavingNotes(false);
  };

  const toggleTopic = async (topic) => {
    const res = await fetch(`${API}/ai/jobs/interview-prep/topics/${topic.id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ isCompleted: !topic.isCompleted }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrep(prev => ({
        ...prev,
        topics: prev.topics.map(t => t.id === topic.id ? updated : t),
        overallProgress: calcProgress(prev.topics.map(t => t.id === topic.id ? updated : t)),
      }));
    }
  };

  const toggleQuestion = async (question) => {
    const res = await fetch(`${API}/ai/jobs/interview-prep/questions/${question.id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ isPracticed: !question.isPracticed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrep(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === question.id ? updated : q),
      }));
    }
  };

  const saveTopic = async () => {
    if (!newTopic.topic.trim()) return;
    const res = await fetch(`${API}/ai/jobs/${jobId}/interview-prep/topics`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(newTopic),
    });
    if (res.ok) {
      const added = await res.json();
      setPrep(prev => ({ ...prev, topics: [...prev.topics, added] }));
      setAddingTopic(false);
      setNewTopic({ topic: "", category: "Technical", description: "", priority: 3 });
    }
  };

  const saveEditTopic = async () => {
    const res = await fetch(`${API}/ai/jobs/interview-prep/topics/${editingTopic.id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify(editingTopic),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrep(prev => ({ ...prev, topics: prev.topics.map(t => t.id === editingTopic.id ? updated : t) }));
      setEditingTopic(null);
    }
  };

  const deleteTopic = async (id) => {
    await fetch(`${API}/ai/jobs/interview-prep/topics/${id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    setPrep(prev => ({ ...prev, topics: prev.topics.filter(t => t.id !== id) }));
  };

  const calcProgress = (topics) => {
    if (!topics?.length) return 0;
    return Math.round((topics.filter(t => t.isCompleted).length / topics.length) * 100);
  };

  const progress = prep ? calcProgress(prep.topics) : 0;
  const practicedCount = prep?.questions?.filter(q => q.isPracticed).length || 0;

  const groupedTopics = prep?.topics?.reduce((acc, t) => {
    const cat = t.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {}) || {};

  const groupedQuestions = prep?.questions?.reduce((acc, q) => {
    const type = q.type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(q);
    return acc;
  }, {}) || {};

  // main content shifts left when chat panel is open
const isMobile = window.innerWidth < 768;

const contentWidth =
  isMobile
    ? "100%"
    : chatPanelWidth > 0
    ? `calc(100vw - ${chatPanelWidth + 320}px)`
    : "960px";

  return (
    <>
      <AiLoadingOverlay type="interview" visible={generating} />
      <style>{`
.prep-page {
  width: 100%;
  transition: max-width 0.08s ease;
}        .prep-header { margin-bottom: 1.75rem; }
        .prep-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.82rem; color: #7c6faa; background: none; border: none;
          cursor: pointer; padding: 0; margin-bottom: 1rem; font-family: inherit;
          transition: color 0.15s;
        }
        .prep-back:hover { color: #5b21b6; }
        .prep-title { font-size: 1.4rem; font-weight: 700; color: #1a1040; margin: 0 0 0.25rem; }
        .prep-subtitle { font-size: 0.88rem; color: #a094c4; margin: 0; }
        .prep-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  box-shadow: 0 1px 3px rgba(124,58,237,0.07);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1040;
}
        .stat-label { font-size: 0.72rem; color: #a094c4; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; }
        .stat-sub { font-size: 0.75rem; color: #a094c4; margin-top: 0.15rem; }
        .progress-bar-wrap { height: 6px; background: #ede9fe; border-radius: 99px; overflow: hidden; margin-top: 0.5rem; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #a78bfa, #7c3aed); border-radius: 99px; transition: width 0.4s ease; }
        .prep-tabs { display: flex; gap: 4px; background: #fff; border-radius: 12px; padding: 4px; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(124,58,237,0.07); }
        .prep-tab {
          flex: 1; padding: 0.6rem 1rem; border-radius: 9px; border: none;
          font-size: 0.88rem; font-family: inherit; cursor: pointer;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          color: #7c6faa; background: transparent; font-weight: 500;
        }
        .prep-tab.active { background: #7c3aed; color: #fff; font-weight: 600; }
        .prep-tab:hover:not(.active) { background: #f5f0ff; color: #1a1040; }
        .prep-panel {
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(124,58,237,0.07);
}
        .panel-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .panel-top h2 { font-size: 1rem; font-weight: 700; color: #1a1040; margin: 0; }
        .cat-group { margin-bottom: 1.5rem; }
        .cat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; margin-bottom: 0.6rem; padding: 0.25rem 0.6rem; border-radius: 4px; display: inline-block; }
        .topic-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem; border-radius: 10px; border: 1px solid #f0eeff; margin-bottom: 0.5rem; transition: all 0.15s; background: #fdfcff; }
        .topic-item:hover { border-color: #c4b5fd; background: #faf8ff; }
        .topic-item.completed { opacity: 0.6; }
        .topic-checkbox { width: 20px; height: 20px; border-radius: 6px; border: 2px solid #c4b5fd; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-top: 1px; transition: all 0.15s; background: transparent; }
        .topic-checkbox.checked { background: #7c3aed; border-color: #7c3aed; }
        .topic-name { font-size: 0.92rem; font-weight: 600; color: #1a1040; margin-bottom: 0.2rem; }
        .topic-name.done { text-decoration: line-through; color: #a094c4; }
        .topic-desc { font-size: 0.82rem; color: #7c6faa; line-height: 1.5; }
        .topic-actions { display: flex; gap: 4px; margin-left: auto; flex-shrink: 0; }
        .question-item { border: 1px solid #f0eeff; border-radius: 10px; margin-bottom: 0.5rem; overflow: hidden; transition: border-color 0.15s; }
        .question-item:hover { border-color: #c4b5fd; }
        .question-item.practiced { border-color: #6ee7b7; }
        .question-header { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem; cursor: pointer; background: #fdfcff; }
        .question-text { flex: 1; font-size: 0.9rem; color: #1a1040; font-weight: 500; line-height: 1.5; }
        .question-meta { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .question-answer { padding: 0.875rem 1rem 1rem 3rem; border-top: 1px solid #f5f3ff; background: #faf8ff; }
        .answer-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #a094c4; font-weight: 600; margin-bottom: 0.4rem; }
        .answer-text { font-size: 0.88rem; color: #444; line-height: 1.7; }
        .notes-area { width: 100%; min-height: 320px; padding: 1rem; border: 1.5px solid #e4daff; border-radius: 10px; font-size: 0.92rem; font-family: inherit; color: #1a1040; resize: vertical; outline: none; line-height: 1.7; transition: border-color 0.15s; box-sizing: border-box; background: #fdfcff; }
        .notes-area:focus { border-color: #7c3aed; }
        .notes-hint { font-size: 0.78rem; color: #a094c4; margin-top: 0.5rem; }
        .add-topic-form { border: 1.5px dashed #c4b5fd; border-radius: 10px; padding: 1rem; margin-bottom: 0.5rem; background: #faf8ff; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
        .form-group label { font-size: 0.72rem; color: #a094c4; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea { padding: 0.45rem 0.75rem; border: 1px solid #e0d9ff; border-radius: 8px; font-size: 0.88rem; font-family: inherit; outline: none; color: #1a1040; background: #fff; transition: border 0.15s; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #7c3aed; }
        .form-actions { display: flex; gap: 0.5rem; }
        .btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.25rem; background: #7c3aed; color: #fff; border: none; border-radius: 8px; font-size: 0.88rem; font-family: inherit; cursor: pointer; font-weight: 500; transition: background 0.15s; }
        .btn-primary:hover { background: #6b2fd6; }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .btn-primary-sm { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.9rem; background: #7c3aed; color: #fff; border: none; border-radius: 8px; font-size: 0.82rem; font-family: inherit; cursor: pointer; font-weight: 500; transition: background 0.15s; }
        .btn-primary-sm:hover { background: #6b2fd6; }
        .btn-ghost { padding: 0.5rem 1rem; background: transparent; color: #7c6faa; border: 1px solid #e0d9ff; border-radius: 8px; font-size: 0.88rem; font-family: inherit; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover { background: #f5f0ff; color: #1a1040; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: #c4b5fd; display: flex; align-items: center; transition: all 0.15s; }
        .btn-icon:hover { background: #f0eeff; color: #7c3aed; }
        .btn-icon.danger:hover { background: #fff0f0; color: #ef4444; }
        .badge { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
        .empty-state { text-align: center; padding: 3rem 1rem; }
        .empty-icon { font-size: 3rem; color: #d4c9f5; display: block; margin-bottom: 1rem; }
        .empty-title { font-size: 1rem; font-weight: 600; color: #1a1040; margin: 0 0 0.5rem; }
        .empty-sub { font-size: 0.88rem; color: #a094c4; margin: 0 0 1.5rem; }
        .loading-state { display: flex; align-items: center; justify-content: center; min-height: 40vh; color: #a094c4; gap: 0.5rem; }
        @media (max-width: 1100px) {

  .prep-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .prep-page {
    max-width: 100% !important;
  }
}

@media (max-width: 768px) {

  .prep-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .prep-tabs {
    overflow-x: auto;
    scrollbar-width: none;
    padding: 4px;
  }

  .prep-tabs::-webkit-scrollbar {
    display: none;
  }

  .prep-tab {
  min-width: 0;
  flex: 1;
  padding: 0.55rem 0.45rem;
  font-size: 0.75rem;
  gap: 0.25rem;
  white-space: nowrap;
}

.prep-tabs {
  gap: 4px;
  margin-bottom: 12px;
}

  .panel-top {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button,
  .btn-primary-sm {
    width: 100%;
    justify-content: center;
  }

  .topic-item {
    flex-direction: column;
    align-items: stretch;
  }

  .topic-actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .question-header {
    flex-direction: column;
    align-items: stretch;
  }

  .question-meta {
    justify-content: space-between;
    width: 100%;
  }

  .question-answer {
    padding: 1rem;
  }

  .notes-area {
    min-height: 240px;
  }

  .stat-card {
  padding: 0.75rem 1rem;
}

.stat-label {
  margin-bottom: 0.25rem;
}

.stat-sub {
  margin-top: 0.05rem;
}
}
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Main content — shifts right when chat opens */}
      <div
  className="prep-page"
  style={{
    width: "100%",
    maxWidth: contentWidth,
    transition: "max-width 0.08s ease"
  }}
>
        <button className="prep-back" onClick={() => navigate(`/jobs/${jobId}`)}>
          <i className="ti ti-arrow-left" /> Back to job
        </button>

        <PageHeader
  title="Interview Prep"
  subtitle="AI-powered preparation for this role"
  icon="ti-brain"
/>
        {loading ? (
          <div className="loading-state"><i className="ti ti-loader" /> Loading prep...</div>
        ) : !prep ? (
          <div className="prep-panel">
            <div className="empty-state">
              <i className="ti ti-brain empty-icon" />
              <p className="empty-title">No prep generated yet</p>
              <p className="empty-sub">Generate your personalised interview prep plan based on the JD analysis and your resume</p>
              <button className="btn-primary" onClick={handleGenerate}>
                <i className="ti ti-sparkles" /> Generate Interview Prep
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="prep-stats">
              <div className="stat-card">
                <div className="stat-label">Topics Progress</div>
                <div className="stat-value">{progress}%</div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Topics</div>
                <div className="stat-value">{prep.topics?.filter(t => t.isCompleted).length || 0} / {prep.topics?.length || 0}</div>
                <div className="stat-sub">completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Questions Practiced</div>
                <div className="stat-value">{practicedCount} / {prep.questions?.length || 0}</div>
                <div className="stat-sub">practiced</div>
              </div>
              <div className="stat-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button className="btn-primary" onClick={handleGenerate} style={{ width: "100%", justifyContent: "center" }}>
                  <i className="ti ti-refresh" /> Regenerate
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="prep-tabs">
              {[
                { id: "topics", label: "Study Topics", icon: "ti-list-check" },
                { id: "questions", label: "Practice Q's", icon: "ti-message-question" },
                { id: "notes", label: "Cheat Sheet", icon: "ti-notes" },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`prep-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`ti ${tab.icon}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Topics tab */}
            {activeTab === "topics" && (
              <div className="prep-panel">
                <div className="panel-top">
                  <h2>Study Topics</h2>
                  <button className="btn-primary-sm" onClick={() => setAddingTopic(true)}>
                    <i className="ti ti-plus" /> Add Topic
                  </button>
                </div>
                {addingTopic && (
                  <div className="add-topic-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Topic</label>
                        <input placeholder="e.g. System Design Basics" value={newTopic.topic} onChange={e => setNewTopic({ ...newTopic, topic: e.target.value })} autoFocus />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select value={newTopic.category} onChange={e => setNewTopic({ ...newTopic, category: e.target.value })}>
                          <option>Technical</option><option>Behavioral</option>
                          <option>System Design</option><option>Domain Knowledge</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                      <label>Description</label>
                      <textarea rows={2} placeholder="What to study..." value={newTopic.description} onChange={e => setNewTopic({ ...newTopic, description: e.target.value })} />
                    </div>
                    <div className="form-actions">
                      <button className="btn-primary" onClick={saveTopic}><i className="ti ti-check" /> Save</button>
                      <button className="btn-ghost" onClick={() => setAddingTopic(false)}>Cancel</button>
                    </div>
                  </div>
                )}
                {Object.entries(groupedTopics).map(([cat, topics]) => {
                  const colors = CATEGORY_COLORS[cat] || { bg: "#f0eeff", color: "#5b21b6" };
                  return (
                    <div key={cat} className="cat-group">
                      <span className="cat-label" style={{ background: colors.bg, color: colors.color }}>{cat}</span>
                      {topics.map(topic => (
                        editingTopic?.id === topic.id ? (
                          <div key={topic.id} className="add-topic-form">
                            <div className="form-row">
                              <div className="form-group">
                                <label>Topic</label>
                                <input value={editingTopic.topic} onChange={e => setEditingTopic({ ...editingTopic, topic: e.target.value })} />
                              </div>
                              <div className="form-group">
                                <label>Category</label>
                                <select value={editingTopic.category} onChange={e => setEditingTopic({ ...editingTopic, category: e.target.value })}>
                                  <option>Technical</option><option>Behavioral</option>
                                  <option>System Design</option><option>Domain Knowledge</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                              <label>Description</label>
                              <textarea rows={2} value={editingTopic.description || ""} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                              <label>Notes</label>
                              <textarea rows={2} placeholder="Your personal notes..." value={editingTopic.notes || ""} onChange={e => setEditingTopic({ ...editingTopic, notes: e.target.value })} />
                            </div>
                            <div className="form-actions">
                              <button className="btn-primary" onClick={saveEditTopic}><i className="ti ti-check" /> Save</button>
                              <button className="btn-ghost" onClick={() => setEditingTopic(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div key={topic.id} className={`topic-item ${topic.isCompleted ? "completed" : ""}`}>
                            <div className={`topic-checkbox ${topic.isCompleted ? "checked" : ""}`} onClick={() => toggleTopic(topic)}>
                              {topic.isCompleted && <i className="ti ti-check" style={{ fontSize: "0.75rem", color: "#fff" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={`topic-name ${topic.isCompleted ? "done" : ""}`}>{topic.topic}</div>
                              {topic.description && <div className="topic-desc">{topic.description}</div>}
                              {topic.notes && (
                                <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#5b21b6", background: "#f5f0ff", padding: "0.3rem 0.6rem", borderRadius: "6px", borderLeft: "2px solid #c4b5fd" }}>
                                  📝 {topic.notes}
                                </div>
                              )}
                            </div>
                            <div className="topic-actions">
                              <button className="btn-icon" onClick={() => setEditingTopic({ ...topic })}><i className="ti ti-edit" style={{ fontSize: "0.9rem" }} /></button>
                              <button className="btn-icon danger" onClick={() => deleteTopic(topic.id)}><i className="ti ti-trash" style={{ fontSize: "0.9rem" }} /></button>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Questions tab */}
            {activeTab === "questions" && (
              <div className="prep-panel">
                <div className="panel-top">
                  <h2>Practice Questions</h2>
                  <span style={{ fontSize: "0.82rem", color: "#a094c4" }}>{practicedCount} of {prep.questions?.length} practiced</span>
                </div>
                {Object.entries(groupedQuestions).map(([type, questions]) => (
                  <div key={type} className="cat-group">
                    <span className="cat-label" style={{ background: "#f0eeff", color: "#5b21b6", display: "flex", alignItems: "center", gap: "0.35rem", width: "fit-content" }}>
                      <i className={`ti ${TYPE_ICONS[type] || "ti-help"}`} style={{ fontSize: "0.8rem" }} />{type}
                    </span>
                    {questions.map(q => (
                      <div key={q.id} className={`question-item ${q.isPracticed ? "practiced" : ""}`}>
                        <div className="question-header" onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}>
                          <div
                            className={`topic-checkbox ${q.isPracticed ? "checked" : ""}`}
                            style={{ borderColor: q.isPracticed ? "#10b981" : "#c4b5fd", background: q.isPracticed ? "#10b981" : "transparent" }}
                            onClick={e => { e.stopPropagation(); toggleQuestion(q); }}
                          >
                            {q.isPracticed && <i className="ti ti-check" style={{ fontSize: "0.75rem", color: "#fff" }} />}
                          </div>
                          <div className="question-text">{q.question}</div>
                          <div className="question-meta">
                            {q.difficulty && (
                              <span className="badge" style={{ background: DIFFICULTY_COLORS[q.difficulty]?.bg || "#f0eeff", color: DIFFICULTY_COLORS[q.difficulty]?.color || "#5b21b6" }}>
                                {q.difficulty}
                              </span>
                            )}
                            <i className={`ti ${expandedQuestion === q.id ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: "0.9rem", color: "#c4b5fd" }} />
                          </div>
                        </div>
                        {expandedQuestion === q.id && q.suggestedAnswer && (
                          <div className="question-answer">
                            <div className="answer-label">Suggested Answer</div>
                            <div className="answer-text">{q.suggestedAnswer}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Cheat Sheet tab */}
            {activeTab === "notes" && (
              <div className="prep-panel">
                <div className="panel-top">
                  <h2>Cheat Sheet</h2>
                  <span style={{ fontSize: "0.78rem", color: notesSaved ? "#059669" : "#a094c4" }}>
                    {savingNotes ? "Saving..." : notesSaved ? "✓ Saved" : "Auto-saves as you type"}
                  </span>
                </div>
                <textarea
                  className="notes-area"
                  placeholder={`Use this as your personal cheat sheet for ${job?.companyName || "this"} interview.\n\nYou can write:\n• Key concepts to remember\n• Talking points for behavioral questions\n• Things to research about the company\n• Questions to ask the interviewer\n• Anything else you want to remember`}
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                />
                <p className="notes-hint">
                  <i className="ti ti-info-circle" /> Your notes auto-save after you stop typing.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat panel — only when prep is generated */}
      {prep && (
        <InterviewChatPanel
          jobId={jobId}
          jobTitle={job?.title}
          companyName={job?.companyName}
          onOpenChange={(width) => setChatPanelWidth(width)}
        />
      )}
    </>
  );
}