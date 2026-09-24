import { useState, useEffect } from "react";
import PageHeader from '../components/ui/PageHeader'
import { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProBadge from '../components/ui/ProBadge';

const API = `${API_BASE_URL}/api`;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

export default function ProfilePage() {
  const { openUpgradeModal, isDevAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingCareer, setEditingCareer] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [careerForm, setCareerForm] = useState({});
  const [preferencesForm, setPreferencesForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/profile`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setPersonalForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          location: data.location || "",
          linkedinUrl: data.linkedinUrl || "",
          githubUrl: data.githubUrl || "",
        });
        setCareerForm({
          currentRole: data.currentRole || "",
          currentCompany: data.currentCompany || "",
          yearsExperience: data.yearsExperience != null ? data.yearsExperience : "",
          noticePeriod: data.noticePeriod || "",
          servingNotice: Boolean(data.servingNotice),
          lastWorkingDay: data.lastWorkingDay || "",
        });
        setPreferencesForm({
          targetRole: data.targetRole || "",
          currentCtc: data.currentCtc || "",
          expectedCtc: data.expectedCtc || "",
          preferredWorkMode: data.preferredWorkMode || "",
          preferredLocations: data.preferredLocations || "",
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveSection = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSavedMsg("Saved!");
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const savePersonal = async () => {
    await saveSection(personalForm);
    setEditingPersonal(false);
  };

  const saveCareer = async () => {
    await saveSection(careerForm);
    setEditingCareer(false);
  };

  const savePreferences = async () => {
    await saveSection(preferencesForm);
    setEditingPreferences(false);
  };

  const resetToFree = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/payments/reset-tier`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        await fetchProfile();
        setSavedMsg("Reset to Free Tier!");
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } catch (e) {
      console.error("Failed to reset tier:", e);
    }
    setSaving(false);
  };

  const initials = profile?.fullName
    ?.trim()?.split(" ")?.map(w => w[0])?.join("")?.slice(0, 2)?.toUpperCase() || "?";

  const calculateCompleteness = (p) => {
    if (!p) return 0;
    const checks = [
      Boolean(p.fullName),
      Boolean(p.email),
      Boolean(p.phone),
      Boolean(p.location),
      Boolean(p.currentRole),
      Boolean(p.currentCompany),
      p.yearsExperience != null && p.yearsExperience !== "",
      Boolean(p.noticePeriod),
      Boolean(p.targetRole),
      Boolean(p.expectedCtc || p.currentCtc),
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  };

  const completeness = calculateCompleteness(profile);

  return (
    <>
      <style>{`
        .profile-page { max-width: 100%; }

        .profile-page-header {
          display: flex; align-items: center; gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .profile-header-card {
          display: flex; align-items: center; gap: 1.5rem;
        }
        .profile-header-info {
          min-width: 0; flex: 1;
        }
        .profile-big-avatar {
          width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 1.75rem; font-weight: 700;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .profile-page-name { font-size: 1.5rem; font-weight: 700; color: #1a1040; margin: 0 0 0.2rem; }
        .profile-page-email { font-size: 0.9rem; color: #a094c4; margin: 0; word-break: break-all; }
        .profile-page-role { font-size: 0.88rem; color: #7c3aed; margin: 0.15rem 0 0; }

        .profile-card {
          background: #fff; border-radius: 16px; padding: 1.75rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 1px 3px rgba(124,58,237,0.07);
          box-sizing: border-box;
          min-width: 0;
        }
        .profile-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .profile-card-header h2 {
          font-size: 1rem; font-weight: 700; color: #1a1040; margin: 0;
        }

        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; min-width: 0; }
        .profile-field { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
        .profile-field-label {
          font-size: 0.72rem; color: #a094c4; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 600;
        }
        .profile-field-value { font-size: 0.92rem; color: #1a1040; font-weight: 500; word-break: break-word; }
        .profile-field-empty { font-size: 0.88rem; color: #ccc; font-style: italic; }
        .profile-field-link { font-size: 0.88rem; color: #7c3aed; text-decoration: none; word-break: break-all; }
        .profile-field-link:hover { text-decoration: underline; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-width: 0; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
        .form-group label {
          font-size: 0.72rem; color: #a094c4; text-transform: uppercase;
          letter-spacing: 0.05em; font-weight: 600;
        }
        .form-group input, .form-group select {
          padding: 0.5rem 0.75rem; border: 1px solid #e0d9ff; border-radius: 8px;
          font-size: 0.9rem; font-family: inherit; outline: none;
          background: #fff; color: #1a1040; transition: border 0.15s;
          box-sizing: border-box; width: 100%;
        }
        .form-group input:focus, .form-group select:focus { border-color: #7c3aed; }
        .form-group input:disabled, .form-group select:disabled { background: #f9f8ff; color: #bbb; }

        .form-actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
        .btn-primary {
          padding: 0.5rem 1.25rem; background: #7c3aed; color: #fff;
          border: none; border-radius: 8px; font-size: 0.88rem;
          font-family: inherit; cursor: pointer; font-weight: 500;
          transition: background 0.15s; display: flex; align-items: center; gap: 0.4rem;
        }
        .btn-primary:hover { background: #6b2fd6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost {
          padding: 0.5rem 1rem; background: transparent; color: #7c6faa;
          border: 1px solid #e0d9ff; border-radius: 8px; font-size: 0.88rem;
          font-family: inherit; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost:hover { background: #f5f0ff; color: #1a1040; }
        .btn-icon-edit {
          background: none; border: none; cursor: pointer; padding: 6px;
          border-radius: 8px; color: #a094c4; display: flex; align-items: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .btn-icon-edit:hover { background: #f5f0ff; color: #7c3aed; }

        .saved-badge {
          font-size: 0.78rem; color: #059669; background: #d1fae5;
          padding: 0.3rem 0.75rem; border-radius: 99px;
          display: flex; align-items: center; gap: 0.3rem;
          flex-shrink: 0;
        }

        .loading-state {
          display: flex; align-items: center; justify-content: center;
          min-height: 40vh; color: #a094c4; gap: 0.5rem;
        }

        .divider-label {
          font-size: 0.72rem; color: #a094c4; text-transform: uppercase;
          letter-spacing: 0.08em; font-weight: 600; margin-bottom: 1rem;
          padding-bottom: 0.5rem; border-bottom: 1px solid #f0eeff;
        }

        /* ─── Mobile View Overrides (< 768px) ─── */
        @media (max-width: 767px) {
          .profile-page {
            width: 100%;
            max-width: 100%;
            padding-bottom: 96px;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .profile-card {
            padding: 1.15rem 1rem !important;
            border-radius: 14px !important;
            margin-bottom: 1rem !important;
          }
          .profile-header-card {
            gap: 0.9rem !important;
          }
          .profile-big-avatar {
            width: 58px !important;
            height: 58px !important;
            font-size: 1.35rem !important;
          }
          .profile-page-name {
            font-size: 1.25rem !important;
            word-break: break-word;
          }
          .profile-page-email {
            font-size: 0.85rem !important;
            word-break: break-all;
          }
          .profile-page-role {
            font-size: 0.82rem !important;
            word-break: break-word;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
            gap: 0.85rem !important;
          }
          .form-actions {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          .profile-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.85rem !important;
          }
          .profile-card-header > div:first-child {
            width: 100% !important;
          }
          .btn-primary, .btn-ghost {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="profile-page">

        {/* Page title */}
        <PageHeader
  title="Profile"
  subtitle="Manage your professional information"
  icon="ti-user-circle"
/>

        {loading ? (
          <div className="loading-state">
            <i className="ti ti-loader" /> Loading profile...
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="profile-card profile-header-card" style={{ flexWrap: 'wrap' }}>
              <div className="profile-big-avatar">{initials}</div>
              <div className="profile-header-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0.2rem' }}>
                  <p className="profile-page-name" style={{ margin: 0 }}>{profile?.fullName || "—"}</p>
                  {(profile?.isPro || profile?.subscriptionTier === 'PRO') && <ProBadge size="lg" />}
                </div>
                <p className="profile-page-email">{profile?.email}</p>
                {(profile?.currentRole || profile?.currentCompany) && (
                  <p className="profile-page-role">
                    {profile.currentRole}
                    {profile.currentRole && profile.currentCompany ? " · " : ""}
                    {profile.currentCompany}
                  </p>
                )}
              </div>
              {savedMsg && (
                <div className="saved-badge" style={{ marginLeft: "auto" }}>
                  <i className="ti ti-check" /> {savedMsg}
                </div>
              )}
              {/* Profile Strength Indicator */}
              <div style={{
                width: '100%',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #f0eeff',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c6faa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Profile Strength
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: completeness >= 80 ? '#059669' : completeness >= 50 ? '#d97706' : '#7c3aed'
                  }}>
                    {completeness}% Completed
                  </span>
                </div>
                <div style={{ height: 6, background: '#f0eeff', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${completeness}%`,
                    height: '100%',
                    background: completeness >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                {completeness < 100 && (
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    💡 Fill in your target role, notice period & CTC to unlock 3x more accurate job & interview recommendations.
                  </span>
                )}
              </div>
            </div>

            {/* Subscription & Membership Card */}
            <div className="profile-card" style={{
              background: (profile?.isPro || profile?.subscriptionTier === 'PRO')
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(236, 72, 153, 0.03) 100%)',
              border: (profile?.isPro || profile?.subscriptionTier === 'PRO')
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid rgba(124, 58, 237, 0.15)'
            }}>
              <div className="profile-card-header" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: (profile?.isPro || profile?.subscriptionTier === 'PRO') ? '#fef3c7' : '#f3e8ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <i className="ti ti-crown" style={{
                      fontSize: 18,
                      color: (profile?.isPro || profile?.subscriptionTier === 'PRO') ? '#d97706' : '#7c3aed'
                    }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1040', display: 'flex', alignItems: 'center' }}>
                    Membership & Subscription
                  </h2>
                </div>

                {!(profile?.isPro || profile?.subscriptionTier === 'PRO') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={openUpgradeModal}
                      className="btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        padding: '0.45rem 1rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <i className="ti ti-bolt" /> Upgrade to Pro (₹299/mo)
                    </button>
                    {isDevAdmin && (
                      <button
                        onClick={resetToFree}
                        disabled={saving}
                        className="btn-ghost"
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.82rem',
                          color: '#6b7280',
                          borderColor: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="Reset credits to 0/3 (Admin Only)"
                      >
                        <i className="ti ti-rotate" /> Reset 0/3 Credits
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: '#059669',
                      background: '#ecfdf5', padding: '4px 10px', borderRadius: 9999,
                      border: '1px solid #a7f3d0'
                    }}>
                      ✓ ACTIVE PRO
                    </span>
                    <button
                      onClick={openUpgradeModal}
                      className="btn-ghost"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <i className="ti ti-crown" style={{ color: '#d97706' }} /> Extend Plan
                    </button>
                    {isDevAdmin && (
                      <button
                        onClick={resetToFree}
                        disabled={saving}
                        className="btn-ghost"
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.82rem',
                          color: '#dc2626',
                          borderColor: '#fecaca',
                          background: '#fff5f5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="Reset to Free Tier (Admin/Dev Only)"
                      >
                        <i className="ti ti-rotate" /> Reset to Free Tier
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-grid">
                <div className="profile-field">
                  <span className="profile-field-label">Current Tier</span>
                  <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: (profile?.isPro || profile?.subscriptionTier === 'PRO') ? '#d97706' : '#1a1040' }}>
                    {(profile?.isPro || profile?.subscriptionTier === 'PRO') ? (
                      <>
                        <i className="ti ti-crown" style={{ fontSize: 16, color: '#d97706', flexShrink: 0 }} />
                        <span>Crackit Pro Member</span>
                        <ProBadge size="sm" />
                      </>
                    ) : (
                      <span>Free Tier</span>
                    )}
                  </div>
                </div>

                <div className="profile-field">
                  <span className="profile-field-label">AI Generations</span>
                  <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(profile?.isPro || profile?.subscriptionTier === 'PRO') ? (
                      <>
                        <i className="ti ti-sparkles" style={{ fontSize: 15, color: '#7c3aed', flexShrink: 0 }} />
                        <span>Unlimited Access</span>
                      </>
                    ) : (
                      <span>{`${profile?.aiUsageCount || 0} of 3 free scans used`}</span>
                    )}
                  </div>
                </div>

                <div className="profile-field">
                  <span className="profile-field-label">Interview Prep Access</span>
                  <span className="profile-field-value">
                    {(profile?.isPro || profile?.subscriptionTier === 'PRO') ? 'Full Kafka-driven AI Simulations' : 'Basic Preview'}
                  </span>
                </div>

                <div className="profile-field">
                  <span className="profile-field-label">Validity</span>
                  <span className="profile-field-value">
                    {profile?.subscriptionExpiresAt
                      ? new Date(profile.subscriptionExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Lifetime Free'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Personal details */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Personal details</h2>
                {!editingPersonal && (
                  <button className="btn-icon-edit" onClick={() => setEditingPersonal(true)}>
                    <i className="ti ti-edit" style={{ fontSize: "1rem" }} />
                  </button>
                )}
              </div>

              {editingPersonal ? (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full name</label>
                      <input value={personalForm.fullName} onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input value={profile?.email || ""} disabled />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input value={personalForm.phone} onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })} placeholder="+91 98765 43210" />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input value={personalForm.location} onChange={e => setPersonalForm({ ...personalForm, location: e.target.value })} placeholder="e.g. Bangalore, India" />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn URL</label>
                      <input value={personalForm.linkedinUrl} onChange={e => setPersonalForm({ ...personalForm, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="form-group">
                      <label>GitHub URL</label>
                      <input value={personalForm.githubUrl} onChange={e => setPersonalForm({ ...personalForm, githubUrl: e.target.value })} placeholder="https://github.com/..." />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={savePersonal} disabled={saving}>
                      {saving ? <><i className="ti ti-loader" /> Saving...</> : "Save changes"}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditingPersonal(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div className="profile-grid">
                  {[
                    { label: "Full name", value: profile?.fullName },
                    { label: "Email", value: profile?.email },
                    { label: "Phone", value: profile?.phone },
                    { label: "Location", value: profile?.location },
                    { label: "LinkedIn", value: profile?.linkedinUrl, isLink: true },
                    { label: "GitHub", value: profile?.githubUrl, isLink: true },
                  ].map(({ label, value, isLink }) => (
                    <div key={label} className="profile-field">
                      <span className="profile-field-label">{label}</span>
                      {value
                        ? isLink
                          ? <a href={value} target="_blank" rel="noreferrer" className="profile-field-link">{value}</a>
                          : <span className="profile-field-value">{value}</span>
                        : <span className="profile-field-empty">Not set</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Career & Employment status */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Career & Employment Status</h2>
                {!editingCareer && (
                  <button className="btn-icon-edit" onClick={() => setEditingCareer(true)}>
                    <i className="ti ti-edit" style={{ fontSize: "1rem" }} />
                  </button>
                )}
              </div>

              {editingCareer ? (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Current role</label>
                      <input
                        value={careerForm.currentRole}
                        onChange={e => setCareerForm({ ...careerForm, currentRole: e.target.value })}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="form-group">
                      <label>Current company</label>
                      <input
                        value={careerForm.currentCompany}
                        onChange={e => setCareerForm({ ...careerForm, currentCompany: e.target.value })}
                        placeholder="e.g. Razorpay"
                      />
                    </div>
                    <div className="form-group">
                      <label>Years of experience</label>
                      <input
                        type="number" min="0" max="50"
                        value={careerForm.yearsExperience}
                        onChange={e => setCareerForm({ ...careerForm, yearsExperience: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Notice period</label>
                      <select
                        value={careerForm.noticePeriod}
                        onChange={e => setCareerForm({ ...careerForm, noticePeriod: e.target.value })}
                      >
                        <option value="">Select notice period</option>
                        <option value="Immediate (0 days)">Immediate (0 days)</option>
                        <option value="15 Days or less">15 Days or less</option>
                        <option value="30 Days">30 Days</option>
                        <option value="45 Days">45 Days</option>
                        <option value="60 Days">60 Days</option>
                        <option value="90 Days">90 Days</option>
                        <option value="Serving Notice">Serving Notice</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', fontSize: '0.88rem', color: '#1a1040' }}>
                        <input
                          type="checkbox"
                          checked={careerForm.servingNotice}
                          onChange={e => setCareerForm({ ...careerForm, servingNotice: e.target.checked })}
                          style={{ width: 'auto', accentColor: '#7c3aed' }}
                        />
                        Actively serving notice period
                      </label>
                    </div>
                    {careerForm.servingNotice && (
                      <div className="form-group">
                        <label>Last working day (LWD)</label>
                        <input
                          type="date"
                          value={careerForm.lastWorkingDay}
                          onChange={e => setCareerForm({ ...careerForm, lastWorkingDay: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={saveCareer} disabled={saving}>
                      {saving ? <><i className="ti ti-loader" /> Saving...</> : "Save changes"}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditingCareer(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div className="profile-grid">
                  {[
                    { label: "Current role", value: profile?.currentRole },
                    { label: "Current company", value: profile?.currentCompany },
                    { label: "Years of experience", value: profile?.yearsExperience != null && profile?.yearsExperience !== "" ? `${profile.yearsExperience} years` : null },
                    { label: "Notice period", value: profile?.noticePeriod },
                    {
                      label: "Notice status",
                      value: profile?.servingNotice
                        ? `Serving Notice (LWD: ${profile?.lastWorkingDay || "Not specified"})`
                        : "Not serving notice"
                    }
                  ].map(({ label, value }) => (
                    <div key={label} className="profile-field">
                      <span className="profile-field-label">{label}</span>
                      {value
                        ? <span className="profile-field-value">{value}</span>
                        : <span className="profile-field-empty">Not set</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compensation & Job Search Preferences */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Compensation & Job Search Preferences</h2>
                {!editingPreferences && (
                  <button className="btn-icon-edit" onClick={() => setEditingPreferences(true)}>
                    <i className="ti ti-edit" style={{ fontSize: "1rem" }} />
                  </button>
                )}
              </div>

              {editingPreferences ? (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Target Role / Dream Title</label>
                      <input
                        value={preferencesForm.targetRole}
                        onChange={e => setPreferencesForm({ ...preferencesForm, targetRole: e.target.value })}
                        placeholder="e.g. Senior Backend Engineer"
                      />
                    </div>
                    <div className="form-group">
                      <label>Preferred Work Mode</label>
                      <select
                        value={preferencesForm.preferredWorkMode}
                        onChange={e => setPreferencesForm({ ...preferencesForm, preferredWorkMode: e.target.value })}
                      >
                        <option value="">Select work mode</option>
                        <option value="Remote">Remote Only</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                        <option value="Open to Any">Open to Any</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Current CTC / Salary</label>
                      <input
                        value={preferencesForm.currentCtc}
                        onChange={e => setPreferencesForm({ ...preferencesForm, currentCtc: e.target.value })}
                        placeholder="e.g. 14 LPA or $80,000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Expected CTC / Salary</label>
                      <input
                        value={preferencesForm.expectedCtc}
                        onChange={e => setPreferencesForm({ ...preferencesForm, expectedCtc: e.target.value })}
                        placeholder="e.g. 24 LPA or $125,000"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Preferred Locations</label>
                      <input
                        value={preferencesForm.preferredLocations}
                        onChange={e => setPreferencesForm({ ...preferencesForm, preferredLocations: e.target.value })}
                        placeholder="e.g. Bangalore, Hyderabad, Remote India"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={savePreferences} disabled={saving}>
                      {saving ? <><i className="ti ti-loader" /> Saving...</> : "Save changes"}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditingPreferences(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div className="profile-grid">
                  {[
                    { label: "Target role", value: profile?.targetRole },
                    { label: "Preferred work mode", value: profile?.preferredWorkMode },
                    { label: "Current CTC", value: profile?.currentCtc },
                    { label: "Expected CTC", value: profile?.expectedCtc },
                    { label: "Preferred locations", value: profile?.preferredLocations }
                  ].map(({ label, value }) => (
                    <div key={label} className="profile-field">
                      <span className="profile-field-label">{label}</span>
                      {value
                        ? <span className="profile-field-value">{value}</span>
                        : <span className="profile-field-empty">Not set</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}