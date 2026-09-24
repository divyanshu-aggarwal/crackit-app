import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DiscoverSkeleton } from '../components/Skeletons'
import PageHeader from '../components/ui/PageHeader'
import { API_BASE_URL } from '../api/axios'

const API = `${API_BASE_URL}/api`;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

function SourceBadge({ source }) {
  const styles = {
    ADZUNA: { bg: "#dbeafe", color: "#1e40af" },
    JSEARCH: { bg: "#d1fae5", color: "#065f46" },
  };
  const s = styles[source] || { bg: "#f0eeff", color: "#5b21b6" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, background: s.bg, color: s.color,
      letterSpacing: "0.05em", textTransform: "uppercase"
    }}>{source}</span>
  );
}

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}

function JobCard({ job, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/jobs`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: job.title,
          companyName: job.company,
          location: job.location,
          jdText: job.description,
          source: job.source,
          jobUrl: job.url,
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (onSave) onSave();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

return (
  <div
    style={{
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(10px)',

      borderRadius: 18,

      padding: '1.25rem',

      border: '1px solid rgba(255,255,255,0.55)',

      boxShadow:
        '0 2px 10px rgba(124,58,237,0.04)',

      transition:
        'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',

      display: 'flex',
      flexDirection: 'column',
      gap: '0.9rem',

      cursor: 'pointer',

      position: 'relative',
      overflow: 'hidden'
    }}

    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.borderColor = 'rgba(196,181,253,0.65)'
      e.currentTarget.style.boxShadow =
        '0 12px 28px rgba(124,58,237,0.10)'
    }}

    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'
      e.currentTarget.style.boxShadow =
        '0 2px 10px rgba(124,58,237,0.04)'
    }}
  >
    {/* subtle top glow */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 24,
        right: 24,
        height: 1,
        background:
          'linear-gradient(90deg, transparent, rgba(167,139,250,0.55), transparent)'
      }}
    />

    {/* Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.9rem'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#1a1040',
            marginBottom: '0.28rem',
            lineHeight: 1.35,
            letterSpacing: '-0.01em'
          }}
        >
          {job.title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,

              background: 'rgba(124,58,237,0.10)',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: '#7c3aed',

              fontSize: 11,
              fontWeight: 700,

              flexShrink: 0
            }}
          >
            {job.company?.charAt(0)}
          </div>

          <div
            style={{
              fontSize: '0.88rem',
              color: '#7c3aed',
              fontWeight: 600
            }}
          >
            {job.company}
          </div>
        </div>
      </div>

      <SourceBadge source={job.source} />
    </div>
      {/* Meta */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {job.location && (
          <span style={{ fontSize: "0.78rem", color: "#7c6faa", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 12 }} /> {job.location}
          </span>
        )}
        {job.postedAt && (
          <span style={{ fontSize: "0.78rem", color: "#7c6faa", display: "flex", alignItems: "center", gap: 4 }}>
           <i className="ti ti-clock" style={{ fontSize: 12 }} />
           {new Date(job.postedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
        {job.remote && (
          <span style={{ fontSize: "0.78rem", background: "#d1fae5", color: "#065f46", padding: "1px 8px", borderRadius: 99 }}>
            Remote
          </span>
        )}
        {job.jobType && (
          <span style={{ fontSize: "0.78rem", background: "#f0eeff", color: "#5b21b6", padding: "1px 8px", borderRadius: 99 }}>
            {job.jobType}
          </span>
        )}
        {(job.salaryMin || job.salaryMax) && (
          <span style={{ fontSize: "0.78rem", color: "#7c6faa", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-currency-rupee" style={{ fontSize: 12 }} />
            {job.salaryMin && job.salaryMax
              ? `${Math.round(job.salaryMin / 1000)}k – ${Math.round(job.salaryMax / 1000)}k`
              : job.salaryMin ? `From ${Math.round(job.salaryMin / 1000)}k` : `Up to ${Math.round(job.salaryMax / 1000)}k`
            }
          </span>
        )}
      </div>

      {/* Description preview */}
      {job.description && (
        <p style={{
          fontSize: "0.82rem", color: "#666", lineHeight: 1.6,
          margin: 0, display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>
          {job.description}
        </p>
      )}

      {/* Actions */}
<div
  style={{
    display:'flex',
    gap:8,
    flexWrap:'wrap'
  }}
>
  {job.url && (
    <a
      href={job.url}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 13px',
        borderRadius: 10,
        fontSize: 12,
        background: '#fff',
        border: '1px solid rgba(124,58,237,0.18)',
        color: '#7c3aed',
        textDecoration: 'none',
        fontWeight: 700
      }}
    >
      <i className="ti ti-external-link" style={{ fontSize: 13 }} />
      View Job
    </a>
  )}

  <button
    onClick={e => {
      e.stopPropagation()
      handleSave()
    }}
    disabled={saving || saved}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '7px 13px',
      borderRadius: 10,
      fontSize: 12,
      background: saved ? '#d1fae5' : '#7c3aed',
      border: 'none',
      color: saved ? '#065f46' : '#fff',
      fontWeight: 700,
      cursor: saved ? 'default' : 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.15s ease'
    }}
  >
    {saved
      ? <><i className="ti ti-check" style={{ fontSize: 13 }} /> Saved</>
      : saving
        ? <><i className="ti ti-loader" style={{ fontSize: 13 }} /> Saving...</>
        : <><i className="ti ti-plus" style={{ fontSize: 13 }} /> Save Job</>
    }
  </button>
</div>
    </div>
  );
}

function AutoSuggestInput({
  value,
  onChange,
  placeholder,
  type,
  onEnter,
  style
}) {
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debouncedValue = useDebounce(value, 220)

  useEffect(() => {
    if (!focused || !debouncedValue.trim() || debouncedValue.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const endpoint =
          type === 'location'
            ? `${API}/suggestions/locations?q=${encodeURIComponent(debouncedValue)}`
            : `${API}/suggestions/keywords?q=${encodeURIComponent(debouncedValue)}`

        const res = await fetch(endpoint, {
          headers: authHeaders(),
          signal: controller.signal
        })

        if (res.ok) {
          const data = await res.json()
          setSuggestions(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()

    return () => controller.abort()
  }, [debouncedValue, focused, type])

  const chooseSuggestion = (item) => {
    onChange(item)
    setFocused(false)
    setSuggestions([])
  }

  return (
    <div style={{ position: 'relative', flex: 1, ...style }}>
      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 140)}
        onKeyDown={e => {
          if (e.key === 'Enter') onEnter()
        }}
        style={{ width: '100%' }}
      />

      {focused && (suggestions.length > 0 || loading) && (
        <div className="suggest-box">
          {loading && (
            <div className="suggest-item muted">
              <i className="ti ti-loader" /> Searching...
            </div>
          )}

          {!loading && suggestions.map(item => (
            <div
              key={item}
              className="suggest-item"
              onMouseDown={() => chooseSuggestion(item)}
            >
              <i className={`ti ${type === 'location' ? 'ti-map-pin' : 'ti-search'}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DiscoverPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("recommended"); // recommended | search
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommended();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/users/profile`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.preferredLocations && !location) {
          setLocation(data.preferredLocations.split(/[,;/]/)[0].trim());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecommended = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/jobs/discover/recommended`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        setMode("recommended");
      } else {
        setError("Could not load recommendations. Check your profile has a current role set.");
      }
    } catch (e) { setError("Failed to load jobs."); }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams({ keyword, location: location || "India" });
      const res = await fetch(`${API}/jobs/discover/search?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        setMode("search");
      } else {
        setError("Search failed. Try again.");
      }
    } catch (e) { setError("Search failed."); }
    setSearching(false);
  };

  return (
    <>
      <style>{`
        .discover-page { max-width: 960px; }
        .discover-header { margin-bottom: 1.75rem; }
        .discover-title { font-size: 1.4rem; font-weight: 700; color: #1a1040; margin: 0 0 0.25rem; }
        .discover-sub { font-size: 0.88rem; color: #a094c4; margin: 0; }

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(10px);
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 24px rgba(124,58,237,0.08);
  flex-wrap: wrap;
  position: sticky;
  top: 8px;
  z-index: 20;
}
        .search-input {
          flex: 1; min-width: 180px; padding: 0.5rem 0.75rem;
          border: 1.5px solid #e4daff; border-radius: 8px;
          font-size: 0.9rem; font-family: inherit; outline: none;
          color: #1a1040; transition: border-color 0.15s;
        }
        .search-input:focus { border-color: #7c3aed; }

        .jobs-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:1rem;
}

@media (max-width:1100px) {
  .jobs-grid {
    grid-template-columns:1fr;
  }
}

        .mode-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem;
        }
        .mode-label { font-size: 0.88rem; color: #7c6faa; }
        .mode-label strong { color: #1a1040; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1.25rem; background: #7c3aed; color: #fff;
          border: none; border-radius: 8px; font-size: 0.88rem;
          font-family: inherit; cursor: pointer; font-weight: 500;
          transition: background 0.15s; white-space: nowrap;
        }
        .btn-primary:hover { background: #6b2fd6; }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; background: transparent; color: #7c6faa;
          border: 1px solid #e0d9ff; border-radius: 8px; font-size: 0.88rem;
          font-family: inherit; cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .btn-ghost:hover { background: #f5f0ff; color: #1a1040; }

        .loading-state { display: flex; align-items: center; justify-content: center; min-height: 40vh; color: #a094c4; gap: 0.5rem; }
        .empty-state { text-align: center; padding: 3rem 1rem; }
        .empty-icon { font-size: 3rem; color: #d4c9f5; display: block; margin-bottom: 1rem; }
        .empty-title { font-size: 1rem; font-weight: 600; color: #1a1040; margin: 0 0 0.5rem; }
        .empty-sub { font-size: 0.88rem; color: #a094c4; margin: 0 0 1.5rem; }

        .error-box {
          display: flex; align-items: center; gap: 8px;
          background: #fff1f1; border: 1px solid #fecaca;
          border-radius: 10px; padding: 10px 14px;
          font-size: 0.85rem; color: #ef4444; margin-bottom: 1rem;
        }

        .suggest-box {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4daff;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(124,58,237,0.14);
  overflow: hidden;
  z-index: 50;
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  font-size: 13px;
  color: #1a1040;
  cursor: pointer;
  transition: background 0.12s ease;
}

.suggest-item:hover {
  background: #f5f0ff;
  color: #7c3aed;
}

.suggest-item i {
  font-size: 14px;
  color: #a78bfa;
}

.suggest-item.muted {
  color: #a094c4;
  cursor: default;
}
      `}</style>

      <div className="discover-page">
        {/* Header */}
       <PageHeader
  title="Discover Jobs"
  subtitle="AI-curated opportunities for your profile"
  icon="ti-sparkles"
/>

        {/* Search bar */}
        <div className="search-bar">
         <AutoSuggestInput
  value={keyword}
  onChange={setKeyword}
  placeholder="Job title, skills, keywords..."
  type="keyword"
  onEnter={handleSearch}
/>

<AutoSuggestInput
  value={location}
  onChange={setLocation}
  placeholder="Location"
  type="location"
  onEnter={handleSearch}
  style={{ maxWidth: 240 }}
/>
          <button className="btn-primary" onClick={handleSearch} disabled={searching || !keyword.trim()}>
            {searching
              ? <><i className="ti ti-loader" /> Searching...</>
              : <><i className="ti ti-search" /> Search</>
            }
          </button>
          <button className="btn-ghost" onClick={fetchRecommended} disabled={loading}>
            <i className="ti ti-stars" /> Recommended
          </button>
        </div>

        {error && (
          <div className="error-box">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        {/* Mode label */}
        {!loading && jobs.length > 0 && (
          <div className="mode-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span className="mode-label">
              {mode === "recommended" ? (
                <>
                  <strong>{jobs.length}</strong> jobs curated for{" "}
                  <strong style={{ color: "#7c3aed" }}>
                    {profile?.targetRole || profile?.currentRole || "your profile"}
                  </strong>
                  {profile?.preferredLocations && (
                    <span style={{ color: "#64748b" }}> in {profile.preferredLocations}</span>
                  )}
                </>
              ) : (
                <><strong>{jobs.length}</strong> results for "<strong>{keyword}</strong>"</>
              )}
            </span>
            {mode === "recommended" && (
              <span
                onClick={() => navigate("/profile")}
                style={{
                  fontSize: 12,
                  color: "#7c3aed",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <i className="ti ti-adjustments" /> Tune Preferences in Profile
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
        <DiscoverSkeleton />
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-search empty-icon" />
            <p className="empty-title">No jobs found</p>
            <p className="empty-sub">
              {mode === "recommended"
                ? "Make sure your profile has a current role and location set."
                : "Try different keywords or location."
              }
            </p>
            {mode === "recommended" && (
              <button className="btn-primary" onClick={() => navigate("/profile")}>
                Update Profile
              </button>
            )}
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}