import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import AiLoadingOverlay from '../components/AiLoadingOverlay'
import PageHeader from '../components/ui/PageHeader'
import { API_BASE_URL } from '../api/axios'

const API = `${API_BASE_URL}/api`;

const token = () => localStorage.getItem("token");
const authHeaders = (isFormData = false) => {
  const h = { Authorization: `Bearer ${token()}` };
  if (!isFormData) h["Content-Type"] = "application/json";
  return h;
};

// ─── Small helpers ─────────────────────────────────────────────────────────

function SectionNav({ active, setActive }) {
  const sections = [
    { id: "summary", icon: "ti-file-text", label: "Summary" },
    { id: "skills", icon: "ti-tag", label: "Skills" },
    { id: "experience", icon: "ti-briefcase", label: "Experience" },
    { id: "projects", icon: "ti-code", label: "Projects" },
  ];
  return (
    <nav className="section-nav">
      {sections.map((s) => (
        <button
          key={s.id}
          className={`nav-item ${active === s.id ? "active" : ""}`}
          onClick={() => setActive(s.id)}
        >
          <i className={`ti ${s.icon}`} />
          {s.label}
        </button>
      ))}
    </nav>
  );
}

function SkillTag({ skill, onDelete }) {
  return (
    <span className="skill-tag">
      {skill.skillName}
      <span className="skill-level">{skill.proficiencyLevel}</span>
      <button className="tag-delete" onClick={() => onDelete(skill.id)} title="Remove">
        <i className="ti ti-x" />
      </button>
    </span>
  );
}

function BulletItem({ bullet, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(bullet.bulletText);

  const save = async () => {
    await onUpdate(bullet.id, text);
    setEditing(false);
  };

  return (
    <div className="bullet-item">
      {editing ? (
        <div className="bullet-edit-row">
          <input
            className="bullet-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <button className="btn-icon btn-save" onClick={save}><i className="ti ti-check" /></button>
          <button className="btn-icon" onClick={() => { setText(bullet.bulletText); setEditing(false); }}><i className="ti ti-x" /></button>
        </div>
      ) : (
        <div className="bullet-view-row">
          <span className="bullet-dot">•</span>
          <span className="bullet-text">{text}</span>
          <button className="btn-icon btn-ghost" onClick={() => setEditing(true)}><i className="ti ti-edit" /></button>
          <button className="btn-icon btn-ghost btn-danger" onClick={() => onDelete(bullet.id)}><i className="ti ti-trash" /></button>
        </div>
      )}
    </div>
  );
}

function ExperienceCard({ exp, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...exp });
  const [newBullet, setNewBullet] = useState("");
  const [bullets, setBullets] = useState(exp.bullets || []);
  const [addingBullet, setAddingBullet] = useState(false);

  const saveExp = async () => {
    await onUpdate(exp.id, form);
    setEditing(false);
  };

const addBullet = async () => {
    if (!newBullet.trim()) return;
    const res = await fetch(`${API}/resume/experience-bullets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ experienceId: exp.id, bulletText: newBullet }),
    });
    if (res.ok) {
      const b = await res.json();
      setBullets((prev) => [...prev, b]);
      setNewBullet("");
      setAddingBullet(false);
    }
  };

// updateBullet — change the URL:
const updateBullet = async (id, text) => {
  const res = await fetch(`${API}/resume/experience-bullets/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ bulletText: text }),
  });
  if (res.ok) setBullets((prev) => prev.map((b) => (b.id === id ? { ...b, bulletText: text } : b)));
};

// deleteBullet — change the URL:
const deleteBullet = async (id) => {
  await fetch(`${API}/resume/experience-bullets/${id}`, { method: "DELETE", headers: authHeaders() });
  setBullets((prev) => prev.filter((b) => b.id !== id));
};

  return (
    <div className="exp-card">
      <div className="exp-header" onClick={() => setExpanded(!expanded)}>
        <div className="exp-meta">
        <span className="exp-title">{exp.role || exp.jobTitle}</span>
        <span className="exp-company">{exp.companyName || exp.company}</span>
        <span className="exp-dates">
        {exp.startDate} — {(exp.currentCompany || exp.current) ? "Present" : exp.endDate || ""}
        </span>
        </div>
        <div className="exp-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon btn-ghost" onClick={() => setEditing(!editing)}><i className="ti ti-edit" /></button>
          <button className="btn-icon btn-ghost btn-danger" onClick={() => onDelete(exp.id)}><i className="ti ti-trash" /></button>
          <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"} chevron`} onClick={() => setExpanded(!expanded)} />
        </div>
      </div>

      {editing && (
        <div className="exp-edit-form" onClick={(e) => e.stopPropagation()}>
          <div className="form-row">
            <div className="form-group">
              <label>Job title</label>
              <input value={form.role || form.jobTitle || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input value={form.companyName || form.company || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start date</label>
              <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End date</label>
              <input value={form.endDate} disabled={form.current} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="form-group form-check">
              <label>
              <input type="checkbox" checked={form.currentCompany || form.current || false} onChange={(e) => setForm({ ...form, currentCompany: e.target.checked })} />                Current role
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={saveExp}>Save</button>
            <button className="btn-ghost-btn" onClick={() => { setForm({ ...exp }); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="exp-bullets">
          {bullets.map((b) => (
            <BulletItem key={b.id} bullet={b} onUpdate={updateBullet} onDelete={deleteBullet} />
          ))}
          {addingBullet ? (
            <div className="bullet-edit-row">
              <input
                className="bullet-input"
                placeholder="Describe what you did..."
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBullet()}
                autoFocus
              />
              <button className="btn-icon btn-save" onClick={addBullet}><i className="ti ti-check" /></button>
              <button className="btn-icon" onClick={() => { setNewBullet(""); setAddingBullet(false); }}><i className="ti ti-x" /></button>
            </div>
          ) : (
            <button className="add-bullet-btn" onClick={() => setAddingBullet(true)}>
              <i className="ti ti-plus" /> Add bullet
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...project });

  const save = async () => {
    await onUpdate(project.id, form);
    setEditing(false);
  };

  return (
    <div className="proj-card">
      <div className="proj-header">
        <div className="proj-meta">
        <span className="proj-name">{project.title || project.projectName}</span>
        {project.techStack && (
        <span className="proj-tech" style={{ whiteSpace: "normal", maxWidth: "300px", borderRadius: "6px" }}>
        {project.techStack}
        </span>
        )}
        </div>
        <div className="proj-actions">
          <button className="btn-icon btn-ghost" onClick={() => setEditing(!editing)}><i className="ti ti-edit" /></button>
          <button className="btn-icon btn-ghost btn-danger" onClick={() => onDelete(project.id)}><i className="ti ti-trash" /></button>
        </div>
      </div>
        {(project.description) && !editing && (
        <p className="proj-desc">{project.description}</p>
        )}
      {editing && (
        <div className="exp-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label>Project name</label>
              <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Tech stack</label>
              <input value={form.techStack || ""} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Live URL</label>
              <input value={form.liveUrl || ""} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input value={form.githubUrl || ""} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={save}>Save</button>
            <button className="btn-ghost-btn" onClick={() => { setForm({ ...project }); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────────────

function AddSkillModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ skillName: "", category: "", proficiencyLevel: "INTERMEDIATE" });
  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

  const submit = async () => {
    if (!form.skillName.trim()) return;
    await onAdd(form);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add skill</h3>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Skill name</label>
            <input placeholder="e.g. TypeScript" value={form.skillName} onChange={(e) => setForm({ ...form, skillName: e.target.value })} autoFocus />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input placeholder="e.g. Programming, Tools, Soft Skills" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Proficiency</label>
            <select value={form.proficiencyLevel} onChange={(e) => setForm({ ...form, proficiencyLevel: e.target.value })}>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={submit}>Add skill</button>
          <button className="btn-ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AddExperienceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false });

  const submit = async () => {
    if (!form.jobTitle.trim() || !form.company.trim()) return;
    await onAdd(form);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add experience</h3>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Job title</label>
              <input placeholder="e.g. Software Engineer" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} autoFocus />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input placeholder="e.g. Google" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start date</label>
              <input placeholder="e.g. Jan 2022" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End date</label>
              <input placeholder="e.g. Dec 2023" value={form.endDate} disabled={form.current} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input placeholder="e.g. London, UK" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group form-check">
              <label>
                <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked })} />
                Current role
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={submit}>Add experience</button>
          <button className="btn-ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AddProjectModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ projectName: "", description: "", techStack: "", liveUrl: "", githubUrl: "" });

  const submit = async () => {
    if (!form.projectName.trim()) return;
    await onAdd(form);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add project</h3>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Project name</label>
              <input placeholder="e.g. CrackIt" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} autoFocus />
            </div>
            <div className="form-group">
              <label>Tech stack</label>
              <input placeholder="e.g. React, Spring Boot, MySQL" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="What did you build and what impact did it have?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Live URL</label>
              <input placeholder="https://..." value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input placeholder="https://github.com/..." value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={submit}>Add project</button>
          <button className="btn-ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Section panels ──────────────────────────────────────────────────────────

function SummaryPanel({ resumeSummary, onSaveSummary }) {
  const [profile, setProfile] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [summaryForm, setSummaryForm] = useState(resumeSummary || "")

  useEffect(() => {
    setSummaryForm(resumeSummary || "")
  }, [resumeSummary])

  useEffect(() => {
    fetch(`${API}/users/profile`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile(data)
          setProfileForm(data)
        }
      })
  }, [])

  const saveProfile = async () => {
    const res = await fetch(`${API}/users/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(profileForm),
    })

    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setProfileForm(data)
    }

    setEditingProfile(false)
  }

  const handleSaveSummary = async () => {
    await onSaveSummary(summaryForm)
    setEditingSummary(false)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Personal details</h2>
        {!editingProfile && (
          <button
            className="btn-icon btn-ghost"
            onClick={() => {
              setProfileForm(profile || {})
              setEditingProfile(true)
            }}
          >
            <i className="ti ti-edit" />
          </button>
        )}
      </div>

      {editingProfile ? (
        <div className="summary-edit" style={{ marginBottom: "2rem" }}>
          <div className="form-row">
            <div className="form-group">
              <label>Full name</label>
              <input
                value={profileForm.fullName || ""}
                onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={profileForm.email || ""} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                value={profileForm.phone || ""}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                value={profileForm.location || ""}
                onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                value={profileForm.linkedinUrl || ""}
                onChange={e => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                value={profileForm.githubUrl || ""}
                onChange={e => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current role</label>
              <input
                value={profileForm.currentRole || ""}
                onChange={e => setProfileForm({ ...profileForm, currentRole: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Current company</label>
              <input
                value={profileForm.currentCompany || ""}
                onChange={e => setProfileForm({ ...profileForm, currentCompany: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Years of experience</label>
            <input
              type="number"
              value={profileForm.yearsExperience || ""}
              onChange={e =>
                setProfileForm({
                  ...profileForm,
                  yearsExperience: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              style={{ maxWidth: "120px" }}
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={saveProfile}>Save changes</button>
            <button className="btn-ghost-btn" onClick={() => setEditingProfile(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="summary-view" style={{ marginBottom: "2rem" }}>
          {profile ? (
            <div className="profile-block">
              <div className="profile-avatar">
                {(profile.fullName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{profile.fullName}</h3>
                {(profile.currentRole || profile.currentCompany) && (
                  <p style={{ fontSize: "0.85rem", color: "#7c5cbf", margin: "0 0 0.25rem" }}>
                    {profile.currentRole}
                    {profile.currentRole && profile.currentCompany ? " · " : ""}
                    {profile.currentCompany}
                  </p>
                )}
                <div className="profile-links">
                  {profile.email && <span><i className="ti ti-mail" /> {profile.email}</span>}
                  {profile.phone && <span><i className="ti ti-phone" /> {profile.phone}</span>}
                  {profile.location && <span><i className="ti ti-map-pin" /> {profile.location}</span>}
                </div>
                <div className="profile-links">
                  {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"><i className="ti ti-brand-linkedin" /> LinkedIn</a>}
                  {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer"><i className="ti ti-brand-github" /> GitHub</a>}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <i className="ti ti-user empty-icon" />
              <p>No personal details yet.</p>
              <button className="btn-primary" onClick={() => setEditingProfile(true)}>Add details</button>
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: "1px solid #f0eeff", marginBottom: "1.5rem" }} />

      <div className="panel-header">
        <h2>Professional summary</h2>
        {!editingSummary && (
          <button
            className="btn-icon btn-ghost"
            onClick={() => {
              setSummaryForm(resumeSummary || "")
              setEditingSummary(true)
            }}
          >
            <i className="ti ti-edit" />
          </button>
        )}
      </div>

      {editingSummary ? (
        <div className="summary-edit">
          <div className="form-group">
            <textarea
              rows={5}
              value={summaryForm}
              onChange={e => setSummaryForm(e.target.value)}
              placeholder="Write 2–4 sentences about your background, strengths, and what you're looking for..."
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSaveSummary}>Save</button>
            <button className="btn-ghost-btn" onClick={() => setEditingSummary(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          {resumeSummary ? (
            <p className="summary-text">{resumeSummary}</p>
          ) : (
            <div className="empty-state">
              <i className="ti ti-file-text empty-icon" />
              <p>No summary yet. Write a short professional summary.</p>
              <button className="btn-primary" onClick={() => setEditingSummary(true)}>Add summary</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
function SkillsPanel({ skills, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Skills</h2>
        <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Add skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-tag empty-icon" />
          <p>No skills added yet.</p>
        </div>
      ) : (
        <div className="skills-section">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="skill-group">
              <span className="skill-category">{cat}</span>
              <div className="skill-tags">
                {items.map((s) => (
                  <SkillTag key={s.id} skill={s} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddSkillModal onClose={() => setShowModal(false)} onAdd={onAdd} />
      )}
    </div>
  );
}

function ExperiencePanel({ experiences, onUpdate, onDelete, onAdd }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Experience</h2>
        <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Add experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-briefcase empty-icon" />
          <p>No experience added yet.</p>
        </div>
      ) : (
        <div className="exp-list">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} exp={exp} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <AddExperienceModal onClose={() => setShowModal(false)} onAdd={onAdd} />
      )}
    </div>
  );
}

function ProjectsPanel({ projects, onUpdate, onDelete, onAdd }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Add project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-code empty-icon" />
          <p>No projects added yet.</p>
        </div>
      ) : (
        <div className="proj-list">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <AddProjectModal onClose={() => setShowModal(false)} onAdd={onAdd} />
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [activeSection, setActiveSection] = useState("summary");
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API}/resume`, { headers: authHeaders() });
    console.log("resume status:", res.status);
   if (res.ok) {
  const data = await res.json();
  console.log("full resume data:", data);
  const mr = Array.isArray(data.masterResume) ? data.masterResume[0] : data.masterResume;
  setResume(mr || null);
  setSkills(data.skills || []);
  setExperiences((data.experiences || []).map(e => ({ ...e, bullets: e.bullets || [] })));
  setProjects(data.projects || []);
}
  } catch (e) {
    console.error("fetchAll error:", e);
  }
  setLoading(false);
};
    const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/resume/upload`, { method: "POST", headers: authHeaders(true), body: fd });
      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        await fetchAll();
      }
    } catch (e) { console.error(e); }
    setUploading(false);
    fileRef.current.value = "";
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/resume/download`, { headers: authHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "master_resume.pdf";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

const saveSummary = async (summaryText) => {
  const method = resume ? "PUT" : "POST"

  const res = await fetch(`${API}/resume/master`, {
    method,
    headers: authHeaders(),
    body: JSON.stringify({ summary: summaryText }),
  })

  if (res.ok) {
    const data = await res.json()
    setResume(data)
  }
}
  const addSkill = async (form) => {
    const res = await fetch(`${API}/resume/skills`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
    if (res.ok){
        const data = await res.json();
        setSkills((prev) => [...prev, data]);
    } 
  };
  const deleteSkill = async (id) => {
    await fetch(`${API}/resume/skills/${id}`, { method: "DELETE", headers: authHeaders() });
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const addExperience = async (form) => {
    const res = await fetch(`${API}/resume/experiences`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
    if (res.ok) {
      const data = await res.json();
      setExperiences((prev) => [...prev, { ...data, bullets: [] }]);
    }
  };
  const updateExperience = async (id, form) => {
    const res = await fetch(`${API}/resume/experiences/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(form) });
    if (res.ok) setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, ...form } : e)));
  };
  const deleteExperience = async (id) => {
    await fetch(`${API}/resume/experiences/${id}`, { method: "DELETE", headers: authHeaders() });
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const addProject = async (form) => {
    const res = await fetch(`${API}/resume/projects`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
    if (res.ok) {
      const data = await res.json();
      setProjects((prev) => [...prev, data]);
    }
  };
  const updateProject = async (id, form) => {
    const res = await fetch(`${API}/resume/projects/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(form) });
    if (res.ok) setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...form } : p)));
  };
  const deleteProject = async (id) => {
    await fetch(`${API}/resume/projects/${id}`, { method: "DELETE", headers: authHeaders() });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

const strengthItems = [
  {
    label: 'Personal details',
    done: true
  },
  {
    label: 'Professional summary',
    done: !!resume?.summary?.trim()
  },
  {
    label: 'Skills',
    done: skills.length > 0
  },
  {
    label: 'Experience',
    done: experiences.length > 0
  },
  {
    label: 'Projects',
    done: projects.length > 0
  }
]

const pct = Math.round(
  (
    strengthItems.filter(i => i.done).length /
    strengthItems.length
  ) * 100
)

const missingItems = strengthItems.filter(i => !i.done)

 return (
  <>
    <AiLoadingOverlay type="parse" visible={uploading} />
      <style>{`
.resume-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 28px;
  min-height: calc(100vh - 80px);
}
        /* Sidebar */
      .resume-sidebar {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 22px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  position: sticky;
  top: 28px;
  height: calc(100vh - 84px);
  box-shadow: 0 12px 32px rgba(124,58,237,0.07);
}
        .sidebar-brand { font-size: 1.1rem; font-weight: 700; color: #1a1040; padding: 0 0.5rem; letter-spacing: -0.02em; }
        .sidebar-brand span { color: #7c5cbf; }

        /* Completeness */

        .resume-strength-card {
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 18px;
  padding: 1.1rem;
  box-shadow: 0 10px 28px rgba(124,58,237,0.06);
}

.strength-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.strength-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1a1040;
  line-height: 1.3;
}

.strength-percent {
  font-size: 0.95rem;
  font-weight: 800;
  color: #7c3aed;
  white-space: nowrap;
}

.strength-subtitle {
  margin-top: 0.45rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #8b7bb4;
}

.strength-bar {
  height: 8px;
  background: #ede9ff;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.9rem;
}

.strength-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  transition: width 0.6s ease;
}

.strength-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.strength-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.strength-item i {
  font-size: 0.9rem;
}

.strength-item.done {
  color: #6d28d9;
}

.strength-item.missing {
  color: #a094c4;
}

.strength-tip {
  margin-top: 0.9rem;
  padding: 0.75rem 0.8rem;
  border-radius: 12px;
  background: rgba(124,58,237,0.07);
  color: #6d28d9;
  font-size: 0.74rem;
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

        /* Nav */
        .section-nav { display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 0.75rem; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; text-align: left;
          font-size: 0.9rem; color: #555; transition: all 0.15s;
          font-family: inherit;
        }
        .nav-item:hover { background: #f0eeff; color: #1a1040; }
        .nav-item.active { background: #ebe5ff; color: #5b21b6; font-weight: 600; }
        .nav-item .ti { font-size: 1rem; }

        /* Sidebar actions */
        .sidebar-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #f0eeff; }
        .btn-upload, .btn-download {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem;
          font-family: inherit; cursor: pointer; transition: all 0.15s; border: none;
        }
        .btn-upload { background: #7c5cbf; color: #fff; }
        .btn-upload:hover { background: #6b4faa; }
        .btn-upload:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-download { background: transparent; border: 1px solid #c4b5fd; color: #7c5cbf; }
        .btn-download:hover { background: #f0eeff; }
        .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Success toast */
        .upload-success {
          font-size: 0.78rem; color: #059669; background: #d1fae5;
          padding: 0.4rem 0.6rem; border-radius: 6px; text-align: center;
        }

        /* Main content */
.resume-main {
  min-width: 0;
  max-width: 980px;
}        /* Panel */
.panel {
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(10px);
  border-radius: 22px;
  padding: 1.8rem;
  border: 1px solid rgba(255,255,255,0.55);
  box-shadow:
    0 1px 2px rgba(15,23,42,0.03),
    0 14px 34px rgba(124,58,237,0.07);
}
            .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .panel-header h2 { font-size: 1.1rem; font-weight: 700; color: #1a1040; margin: 0; }

        /* Summary */
        .profile-block { display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.25rem; }
        .profile-avatar {
          width: 52px; height: 52px; border-radius: 50%; background: #ebe5ff;
          color: #7c5cbf; font-size: 1.4rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .profile-name { font-size: 1.1rem; font-weight: 700; color: #1a1040; margin: 0 0 0.4rem; }
        .profile-links { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.83rem; color: #666; margin-top: 0.25rem; }
        .profile-links a { color: #7c5cbf; text-decoration: none; }
        .profile-links .ti { margin-right: 3px; font-size: 0.85rem; }
        .summary-text { font-size: 0.92rem; color: #444; line-height: 1.7; margin: 0; border-top: 1px solid #f0eeff; padding-top: 1rem; }

        /* Skills */
        .skills-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .skill-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .skill-category { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #999; font-weight: 600; }
        .skill-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-tag {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #f0eeff; color: #5b21b6; border-radius: 99px;
          padding: 0.3rem 0.75rem; font-size: 0.82rem; font-weight: 500;
        }
        .skill-level { font-size: 0.7rem; color: #9b8ec4; background: #ebe5ff; padding: 1px 6px; border-radius: 99px; }
        .tag-delete { background: none; border: none; cursor: pointer; color: #9b8ec4; padding: 0; line-height: 1; display: flex; align-items: center; }
        .tag-delete:hover { color: #ef4444; }
        .tag-delete .ti { font-size: 0.75rem; }

        /* Experience */
        .exp-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .exp-card { border: 1px solid #f0eeff; border-radius: 10px; overflow: hidden; }
        .exp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; cursor: pointer; background: #fdfcff;
        }
        .exp-header:hover { background: #faf8ff; }
        .exp-meta { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
        .exp-title { font-size: 0.95rem; font-weight: 600; color: #1a1040; }
        .exp-company { font-size: 0.85rem; color: #7c5cbf; }
        .exp-dates { font-size: 0.78rem; color: #999; }
        .exp-actions { display: flex; align-items: center; gap: 4px; }
        .chevron { font-size: 1rem; color: #bbb; cursor: pointer; margin-left: 4px; }

        /* Bullets */
        .exp-bullets { padding: 0.75rem 1.25rem 1rem; background: #fff; border-top: 1px solid #f5f3ff; }
        .bullet-item { margin-bottom: 4px; }
        .bullet-view-row { display: flex; align-items: flex-start; gap: 0.5rem; padding: 4px 0; }
        .bullet-dot { color: #c4b5fd; font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
        .bullet-text { flex: 1; font-size: 0.88rem; color: #444; line-height: 1.6; }
        .bullet-edit-row { display: flex; align-items: center; gap: 0.5rem; margin: 4px 0; }
        .bullet-input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #d8d0ff; border-radius: 6px; font-size: 0.88rem; font-family: inherit; outline: none; }
        .bullet-input:focus { border-color: #7c5cbf; }
        .add-bullet-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          margin-top: 0.5rem; background: none; border: 1px dashed #c4b5fd;
          color: #9b8ec4; border-radius: 6px; padding: 0.35rem 0.75rem;
          font-size: 0.82rem; cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .add-bullet-btn:hover { border-color: #7c5cbf; color: #7c5cbf; background: #f9f7ff; }

        /* Projects */
        .proj-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .proj-card { border: 1px solid #f0eeff; border-radius: 10px; padding: 1rem 1.25rem; }
        .proj-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .proj-meta { display: flex; align-items: center; gap: 0.75rem; }
        .proj-name { font-size: 0.95rem; font-weight: 600; color: #1a1040; }
        .proj-tech { font-size: 0.78rem; color: #9b8ec4; background: #f0eeff; padding: 2px 10px; border-radius: 99px; }
        .proj-actions { display: flex; gap: 4px; }
        .proj-desc { font-size: 0.86rem; color: #555; line-height: 1.6; margin: 0; }

        /* Edit forms */
        .exp-edit-form { padding: 1rem 1.25rem; border-top: 1px solid #f5f3ff; background: #fdfcff; }
        .summary-edit { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group label { font-size: 0.78rem; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.5rem 0.75rem; border: 1px solid #e0d9ff; border-radius: 8px;
          font-size: 0.9rem; font-family: inherit; outline: none; background: #fff; color: #1a1040;
          transition: border 0.15s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #7c5cbf; }
        .form-group input:disabled { background: #f9f8ff; color: #bbb; }
        .form-group textarea { resize: vertical; }
        .form-check { justify-content: flex-end; }
        .form-check label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; text-transform: none; letter-spacing: 0; color: #555; cursor: pointer; }
        .form-check input[type="checkbox"] { width: 16px; height: 16px; accent-color: #7c5cbf; }
        .form-actions { display: flex; gap: 0.5rem; }

        /* Buttons */
        .btn-primary {
          padding: 0.5rem 1.25rem; background: #7c5cbf; color: #fff;
          border: none; border-radius: 8px; font-size: 0.88rem; font-family: inherit;
          cursor: pointer; font-weight: 500; transition: background 0.15s;
        }
        .btn-primary:hover { background: #6b4faa; }
        .btn-primary-sm {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.9rem; background: #7c5cbf; color: #fff;
          border: none; border-radius: 8px; font-size: 0.82rem; font-family: inherit;
          cursor: pointer; font-weight: 500; transition: background 0.15s;
        }
        .btn-primary-sm:hover { background: #6b4faa; }
        .btn-ghost-btn {
          padding: 0.5rem 1rem; background: transparent; color: #777;
          border: 1px solid #e0d9ff; border-radius: 8px; font-size: 0.88rem;
          font-family: inherit; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost-btn:hover { background: #f9f7ff; color: #1a1040; }
        .btn-icon {
          background: #f0eeff; border: 1px solid #ddd6fe; cursor: pointer; padding: 4px; border-radius: 6px;
          color: #7c3aed; display: flex; align-items: center; transition: all 0.15s;
        }
        .btn-icon:hover { background: #f0eeff; color: #7c5cbf; }
        .btn-icon .ti { font-size: 1rem; }
        .btn-save { color: #7c5cbf; }
        .btn-save:hover { background: #f0eeff; color: #5b21b6; }
        .btn-danger:hover { background: #fff0f0 !important; color: #ef4444 !important; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(26,16,64,0.35);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal {
          background: #fff; border-radius: 14px; width: 520px; max-width: 95vw;
          box-shadow: 0 20px 60px rgba(124,92,191,0.2);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0eeff;
        }
        .modal-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1a1040; }
        .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #f0eeff; display: flex; gap: 0.5rem; }

        /* Empty state */
        .empty-state { text-align: center; padding: 3rem 1rem; }
        .empty-icon { font-size: 2.5rem; color: #d4c9f5; display: block; margin-bottom: 0.75rem; }
        .empty-state p { color: #999; font-size: 0.9rem; margin: 0 0 1rem; }


        .resume-mobile-top {
  display: none;
}

@media (max-width: 768px) {
  .resume-page {
    grid-template-columns: 1fr;
    gap: 16px;
    min-height: auto;
  }

  .resume-sidebar {
    display: none;
  }

  .resume-mobile-top {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 16px;
  }

  .resume-main {
    max-width: 100%;
    width: 100%;
  }

  .section-nav {
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
  }

  .section-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(124,58,237,0.10);
  }

  .mobile-resume-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .panel {
    padding: 1.15rem;
    border-radius: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .profile-block {
    flex-direction: column;
  }

  .exp-header,
  .proj-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .exp-actions,
  .proj-actions {
    align-self: flex-end;
  }

 /* DESKTOP */

.modal-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: min(760px, 90vw);
  max-height: 90vh;
}

/* MOBILE */

@media (max-width: 768px) {

  .modal-overlay {
    align-items: flex-start;
    overflow-y: auto;
    padding: 14px 14px 120px;
  }

  .modal {
    width: 100%;
    max-width: 100%;
    max-height: calc(100dvh - 28px);
    border-radius: 22px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-body {
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    position: sticky;
    bottom: 0;
    background: white;
  }
}

  .modal-body {
    overflow-y: auto;
  }

  .modal-footer {
    position: sticky;
    bottom: 0;
    background: #fff;
    flex-direction: column;
  }

  .modal-footer button,
  .form-actions button {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }
}

        /* Loading */
        .loading-state { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #9b8ec4; font-size: 0.9rem; gap: 0.5rem; }
      `}</style>

      <PageHeader
  title="Resume"
  subtitle="Build and optimize your master resume for better AI tailoring"
  icon="ti-file-text"
/>

<div className="resume-mobile-top">
  <div className="resume-strength-card">
    <div className="strength-title-row">
      <div className="strength-title">Profile strength</div>
      <div className="strength-percent">{pct}%</div>
    </div>

    <div className="strength-subtitle">
      Complete your profile to improve job matching.
    </div>

    <div className="strength-bar">
      <div className="strength-fill" style={{ width: `${pct}%` }} />
    </div>
  </div>

  <SectionNav active={activeSection} setActive={setActiveSection} />

  <div className="mobile-resume-actions">
    <button className="btn-upload" onClick={() => fileRef.current.click()} disabled={uploading}>
      <i className="ti ti-upload" />
      {uploading ? "Parsing..." : "Upload PDF"}
    </button>

    <button className="btn-download" onClick={handleDownload} disabled={downloading}>
      <i className="ti ti-download" />
      {downloading ? "Generating..." : "Download PDF"}
    </button>
  </div>
</div>

      <div className="resume-page">
        {/* Sidebar */}
        <aside className="resume-sidebar">

<div className="resume-strength-card">
  <div className="strength-title-row">
    <div className="strength-title">Profile strength</div>
    <div className="strength-percent">{pct}%</div>
  </div>

  <div className="strength-subtitle">
    Complete your profile to improve job matching.
  </div>

  <div className="strength-bar">
    <div className="strength-fill" style={{ width: `${pct}%` }} />
  </div>

  <div className="strength-list">
    {strengthItems.map(item => (
      <div
        key={item.label}
        className={`strength-item ${item.done ? 'done' : 'missing'}`}
      >
        <i
          className={`ti ${
            item.done
              ? 'ti-circle-check-filled'
              : 'ti-circle-dashed'
          }`}
        />
        <span>{item.label}</span>
      </div>
    ))}
  </div>

  {missingItems.length > 0 && (
    <div className="strength-tip">
      <i className="ti ti-sparkles" />
      <span>
        Add {missingItems.map(i => i.label.toLowerCase()).join(', ')} to improve your resume quality.
      </span>
    </div>
  )}
</div>
          <SectionNav active={activeSection} setActive={setActiveSection} />

          <div className="sidebar-actions">
            {uploadSuccess && <div className="upload-success"><i className="ti ti-check" /> Resume parsed!</div>}
            <input type="file" accept=".pdf" ref={fileRef} style={{ display: "none" }} onChange={handleUpload} />
            <button className="btn-upload" onClick={() => fileRef.current.click()} disabled={uploading}>
              <i className="ti ti-upload" />
              {uploading ? "Parsing..." : "Upload PDF"}
            </button>
            <button className="btn-download" onClick={handleDownload} disabled={downloading}>
              <i className="ti ti-download" />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="resume-main">
          {loading ? (
            <div className="loading-state">
              <i className="ti ti-loader" /> Loading resume...
            </div>
          ) : (
            <>
              {activeSection === "summary" && (
                <SummaryPanel
                resumeSummary={resume?.summary}
                onSaveSummary={saveSummary}
                    />
                )}
              {activeSection === "skills" && (
                <SkillsPanel skills={skills} onAdd={addSkill} onDelete={deleteSkill} />
              )}
              {activeSection === "experience" && (
                <ExperiencePanel
                  experiences={experiences}
                  onUpdate={updateExperience}
                  onDelete={deleteExperience}
                  onAdd={addExperience}
                />
              )}
              {activeSection === "projects" && (
                <ProjectsPanel
                  projects={projects}
                  onUpdate={updateProject}
                  onDelete={deleteProject}
                  onAdd={addProject}
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}