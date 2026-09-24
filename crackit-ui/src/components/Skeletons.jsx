// ─── Skeleton base components ─────────────────────────────────────────────

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .skeleton-base {
    background: linear-gradient(90deg, #f0eeff 25%, #e8e2ff 50%, #f0eeff 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 6px;
  }
  .skeleton-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .skeleton-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    gap: 16px;
  }
  .skeleton-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .skeleton-donut-row {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .skeleton-search-bar {
    background: #fff;
    border-radius: 14px;
    padding: 0.875rem 1rem;
    margin-bottom: 24px;
    display: flex;
    gap: 12px;
  }
  @media (max-width: 768px) {
    .skeleton-grid-2 {
      grid-template-columns: 1fr !important;
    }
    .skeleton-header-flex {
      flex-direction: column !important;
      align-items: stretch !important;
      margin-bottom: 20px !important;
    }
    .skeleton-header-actions {
      width: 100% !important;
      justify-content: flex-start !important;
    }
    .skeleton-donut-row {
      flex-direction: column !important;
      align-items: center !important;
      gap: 16px !important;
    }
    .skeleton-search-bar {
      flex-direction: column !important;
    }
    .skeleton-search-bar > * {
      width: 100% !important;
    }
  }
`;

function SkeletonBox({ width = "100%", height = 16, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton-base"
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

function SkeletonCard({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1.25rem",
      boxShadow: "0 1px 3px rgba(124,92,191,0.06)", ...style
    }}>
      {children}
    </div>
  );
}

// ─── Jobs page skeleton ───────────────────────────────────────────────────

export function JobsSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="skeleton-header-flex">
          <div>
            <SkeletonBox width={80} height={28} style={{ marginBottom: 8 }} />
            <SkeletonBox width={120} height={14} />
          </div>
          <div className="skeleton-header-actions">
            <SkeletonBox width={100} height={40} radius={18} />
            <SkeletonBox width={130} height={40} radius={18} />
          </div>
        </div>

        {/* Grid */}
        <div className="skeleton-grid-2" style={{ gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
                  <SkeletonBox width="50%" height={12} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="40%" height={11} />
                </div>
                <SkeletonBox width={60} height={22} radius={20} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Tracker page skeleton ────────────────────────────────────────────────

export function TrackerSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 28 }}>
          <SkeletonBox width={100} height={24} style={{ marginBottom: 8 }} />
          <SkeletonBox width={200} height={13} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <SkeletonBox width="45%" height={15} style={{ marginBottom: 8 }} />
                <SkeletonBox width="30%" height={12} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SkeletonBox width={60} height={12} />
                <SkeletonBox width={80} height={26} radius={99} />
                <SkeletonBox width={70} height={32} radius={10} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 940 }}>
        {/* Header */}
        <div className="skeleton-header-flex" style={{ marginBottom: 32 }}>
          <div>
            <SkeletonBox width={200} height={28} style={{ marginBottom: 8 }} />
            <SkeletonBox width={250} height={16} />
          </div>
          <div className="skeleton-header-actions">
            <SkeletonBox width={155} height={40} radius={22} />
            <SkeletonBox width={140} height={40} radius={18} />
          </div>
        </div>

        {/* Row 1 */}
        <div className="skeleton-grid-2" style={{ marginBottom: 16 }}>
          <SkeletonCard>
            <SkeletonBox width="50%" height={16} style={{ marginBottom: 18 }} />
            <div className="skeleton-donut-row">
              <SkeletonBox width={120} height={120} radius="50%" />
              <div style={{ flex: 1, width: "100%" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <SkeletonBox width={10} height={10} radius="50%" />
                    <SkeletonBox width="60%" height={12} />
                    <SkeletonBox width={30} height={12} />
                  </div>
                ))}
              </div>
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonBox width="50%" height={16} style={{ marginBottom: 18 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "0.5px solid #f0eeff" }}>
                <SkeletonBox width={90} height={14} />
                <div style={{ flex: 1 }}>
                  <SkeletonBox width="100%" height={5} radius={4} />
                </div>
                <SkeletonBox width={36} height={14} />
              </div>
            ))}
          </SkeletonCard>
        </div>

        {/* Row 2 */}
        <div className="skeleton-grid-2">
          <SkeletonCard>
            <SkeletonBox width="50%" height={16} style={{ marginBottom: 18 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "0.5px solid #f0eeff" }}>
                <div>
                  <SkeletonBox width={160} height={14} style={{ marginBottom: 6 }} />
                  <SkeletonBox width={100} height={12} />
                </div>
                <SkeletonBox width={80} height={26} radius={99} />
              </div>
            ))}
          </SkeletonCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SkeletonCard>
              <SkeletonBox width="40%" height={16} style={{ marginBottom: 18 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: "#f9f7ff", borderRadius: 14, padding: 14 }}>
                    <SkeletonBox width={24} height={24} radius={6} style={{ marginBottom: 8 }} />
                    <SkeletonBox width={40} height={22} style={{ marginBottom: 6 }} />
                    <SkeletonBox width="80%" height={12} />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Discover page skeleton ───────────────────────────────────────────────

export function DiscoverSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 24 }}>
          <SkeletonBox width={160} height={28} style={{ marginBottom: 8 }} />
          <SkeletonBox width={320} height={14} />
        </div>

        {/* Search bar */}
        <div className="skeleton-search-bar">
          <SkeletonBox height={40} style={{ flex: 1 }} radius={8} />
          <SkeletonBox width={220} height={40} radius={8} />
          <SkeletonBox width={90} height={40} radius={8} />
          <SkeletonBox width={120} height={40} radius={8} />
        </div>

        {/* Grid */}
        <div className="skeleton-grid-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <SkeletonBox width="70%" height={16} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="45%" height={13} />
                </div>
                <SkeletonBox width={60} height={20} radius={99} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <SkeletonBox width={100} height={12} />
                <SkeletonBox width={60} height={12} />
              </div>
              <SkeletonBox width="100%" height={12} style={{ marginBottom: 4 }} />
              <SkeletonBox width="85%" height={12} style={{ marginBottom: 4 }} />
              <SkeletonBox width="60%" height={12} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <SkeletonBox width={80} height={30} radius={8} />
                <SkeletonBox width={90} height={30} radius={8} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Job detail skeleton ──────────────────────────────────────────────────

export function JobDetailSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 860 }}>
        <SkeletonCard style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox width="55%" height={22} style={{ marginBottom: 10 }} />
              <SkeletonBox width="35%" height={14} style={{ marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <SkeletonBox width={80} height={24} radius={20} />
                <SkeletonBox width={90} height={24} radius={20} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonBox width={110} height={36} radius={10} />
              <SkeletonBox width={120} height={36} radius={10} />
              <SkeletonBox width={130} height={36} radius={10} />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </>
  );
}