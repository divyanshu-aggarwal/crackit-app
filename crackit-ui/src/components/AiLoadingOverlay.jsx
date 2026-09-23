import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const MESSAGES = {
  analyze: [
    "Reading job description...",
    "Extracting required skills...",
    "Identifying ATS keywords...",
    "Calculating your match score...",
    "Analysing experience level...",
    "Finalising results...",
  ],
  tailor: [
    "Loading your master resume...",
    "Analysing job requirements...",
    "Rewriting your summary...",
    "Tailoring experience bullets...",
    "Optimising skills section...",
    "Embedding ATS keywords...",
    "Calculating tailored match score...",
    "Almost done...",
  ],
  interview: [
    "Analysing job description...",
    "Researching common questions for this role...",
    "Building your study topics...",
    "Generating practice questions...",
    "Writing suggested answers...",
    "Personalising to your background...",
    "Finalising your prep plan...",
  ],
  parse: [
    "Reading your PDF...",
    "Extracting text content...",
    "Identifying skills and experience...",
    "Parsing work history...",
    "Extracting projects...",
    "Populating your profile...",
    "Almost done...",
  ],
};

export default function AiLoadingOverlay({ type = "analyze", visible }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const messages = MESSAGES[type] || MESSAGES.analyze;

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      setDisplayed("");
      setCharIndex(0);
      setProgress(0);
      return;
    }

    const current = messages[msgIndex];

    if (charIndex < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex(c => c + 1);
      }, 28);

      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setMsgIndex((msgIndex + 1) % messages.length);
      setDisplayed("");
      setCharIndex(0);
    }, 1200);

    return () => clearTimeout(t);
  }, [visible, charIndex, msgIndex, messages]);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p;
        return p + Math.random() * 3;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const icons = {
    analyze: "ti-brain",
    tailor: "ti-wand",
    interview: "ti-message-question",
    parse: "ti-file-cv",
  };

  const labels = {
    analyze: "Analysing JD",
    tailor: "Tailoring Resume",
    interview: "Generating Interview Prep",
    parse: "Parsing Resume",
  };

  const color = "#7c3aed";

  return createPortal(
    <>
      <style>{`
        @keyframes ai-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ai-card-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ai-ring-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes ai-soft-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.96); opacity: 0.75; }
        }

        @keyframes ai-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(240%); }
        }

        @keyframes ai-dot-rise {
          0%, 100% { transform: translateY(0); opacity: 0.45; }
          50% { transform: translateY(-5px); opacity: 1; }
        }

        .ai-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(circle at 18% 18%, rgba(124, 58, 237, 0.18), transparent 34%),
            radial-gradient(circle at 82% 74%, rgba(167, 139, 250, 0.20), transparent 36%),
            rgba(18, 11, 44, 0.58);
          backdrop-filter: blur(14px) saturate(115%);
          -webkit-backdrop-filter: blur(14px) saturate(115%);
          animation: ai-fade-in 0.25s ease;
        }

        .ai-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(circle at center, black, transparent 72%);
          pointer-events: none;
        }

        .ai-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          padding: 34px 32px 30px;
          border-radius: 28px;
          text-align: center;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.55);
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          animation: ai-card-in 0.32s ease;
          overflow: hidden;
        }

        .ai-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(124,58,237,0.12), transparent 35%, rgba(196,181,253,0.16));
          pointer-events: none;
        }

        .ai-card-content {
          position: relative;
          z-index: 1;
        }

        .ai-icon-shell {
          position: relative;
          width: 92px;
          height: 92px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-icon-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #7c3aed, #c4b5fd, #ede9fe, #7c3aed);
          animation: ai-ring-spin 2.8s linear infinite;
        }

        .ai-icon-ring::after {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
        }

        .ai-icon-inner {
          position: relative;
          z-index: 2;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(196,181,253,0.32));
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ai-soft-pulse 2.4s ease-in-out infinite;
        }

        .ai-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.10);
          color: #7c3aed;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 14px;
        }

        .ai-title {
          font-size: 22px;
          font-weight: 800;
          color: #1a1040;
          letter-spacing: -0.03em;
          margin-bottom: 10px;
        }

        .ai-subtitle {
          font-size: 13px;
          color: #8b7ab8;
          margin-bottom: 22px;
        }

        .ai-message-wrap {
          min-height: 25px;
          margin-bottom: 22px;
        }

        .ai-message {
          font-size: 14px;
          color: #5b4a8b;
          line-height: 1.5;
          font-weight: 500;
        }

        .ai-cursor {
          display: inline-block;
          width: 2px;
          height: 15px;
          background: #8b5cf6;
          margin-left: 3px;
          vertical-align: middle;
          animation: ai-soft-pulse 0.8s ease-in-out infinite;
        }

        .ai-progress-track {
          position: relative;
          height: 8px;
          background: #ede9fe;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .ai-progress-fill {
          position: relative;
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
          overflow: hidden;
        }

        .ai-progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: ai-shimmer 1.6s linear infinite;
        }

        .ai-progress-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9b8ec4;
          margin-bottom: 18px;
        }

        .ai-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
        }

        .ai-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: ai-dot-rise 1.1s ease-in-out infinite;
        }

        .ai-dot:nth-child(2) {
          animation-delay: 0.18s;
        }

        .ai-dot:nth-child(3) {
          animation-delay: 0.36s;
        }
      `}</style>

      <div className="ai-overlay">
        <div className="ai-grid" />

        <div className="ai-card">
          <div className="ai-card-content">
            <div className="ai-icon-shell">
              <div className="ai-icon-ring" />
              <div className="ai-icon-inner">
                <i className={`ti ${icons[type]}`} style={{ fontSize: 32, color }} />
              </div>
            </div>

            <div className="ai-label">
              <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
              {labels[type]}
            </div>

            <div className="ai-title">CrackIt AI is working</div>
            <div className="ai-subtitle">Preparing a sharper result for you</div>

            <div className="ai-message-wrap">
              <span className="ai-message">{displayed}</span>
              <span className="ai-cursor" />
            </div>

            <div className="ai-progress-track">
              <div
                className="ai-progress-fill"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                }}
              />
            </div>

            <div className="ai-progress-row">
              <span>Processing</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="ai-dots">
              {[0, 1, 2].map(i => (
                <div key={i} className="ai-dot" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}