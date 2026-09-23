import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from '../api/axios';
import MarkdownMessage from './chat/MarkdownMessage';

const API = `${API_BASE_URL}/api`;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

const MIN_WIDTH = 420;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 380;

function parseMarkdown(text) {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }

    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function TypewriterText({ text, onDone, onTick, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        onTick?.();
      } else {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {done ? <MarkdownMessage text={text} /> : displayed}
      {!done && <span className="chat-cursor" />}
    </span>
  );
}

function Message({ msg, isLatestAssistant, onTypingDone, onTypingTick }) {
  const isUser = msg.role === "user";

  return (
    <div className={`chat-message-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="chat-avatar bot">
          <i className="ti ti-brain" />
        </div>
      )}

      <div className={`chat-message ${isUser ? "user" : "assistant"}`}>
        {!isUser && isLatestAssistant ? (
          <TypewriterText text={msg.content} onDone={onTypingDone} onTick={onTypingTick} />
        ) : isUser ? (
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {msg.content}
          </span>
        ) : (
          <MarkdownMessage text={msg.content} />
        )}
      </div>

      {isUser && (
        <div className="chat-avatar user">
          <i className="ti ti-user" />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-message-row assistant">
      <div className="chat-avatar bot">
        <i className="ti ti-brain" />
      </div>

      <div className="typing-indicator">
        {[0, 1, 2].map(i => (
          <span key={i} style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "What should I focus on most?",
  "Give me a mock interview question",
  "How to answer behavioral questions?",
  "Explain microservices for this role",
  "What does this company value?",
  "Help me with system design",
];

export default function InterviewChatPanel({ jobId, jobTitle, companyName, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [latestAssistantIndex, setLatestAssistantIndex] = useState(-1);
  const [typingDone, setTypingDone] = useState(true);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [cleared, setCleared] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    onOpenChange?.(open ? panelWidth + 32 : 0);
  }, [open, panelWidth]);

  useEffect(() => {
    if (open && messages.length === 0 && !cleared) {
      loadHistory();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, sending]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const handleTypingTick = () => {
    requestAnimationFrame(() => scrollToBottom("auto"));
  };

  const startResize = e => {
    e.preventDefault();

    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = e => {
      if (!resizingRef.current) return;

      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));

      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);

    try {
      const res = await fetch(`${API}/ai/jobs/${jobId}/chat/history`, {
        headers: authHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setLatestAssistantIndex(-1);
        setTypingDone(true);
      }
    } catch (e) {
      console.error(e);
    }

    setLoadingHistory(false);
  };

  const sendMessage = async text => {
    const msg = text || input.trim();
    if (!msg || sending || !typingDone) return;

    setInput("");
    setCleared(false);

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: msg,
        createdAt: new Date().toISOString(),
      },
    ]);

    setSending(true);
    setTypingDone(false);

    try {
      const res = await fetch(`${API}/ai/jobs/${jobId}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: msg }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.history);

        const absoluteIdx = data.history.reduce(
          (acc, m, i) => (m.role === "assistant" ? i : acc),
          -1
        );

        setLatestAssistantIndex(absoluteIdx);
        setTypingDone(false);

        if (!open) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (e) {
      console.error(e);

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);

      setTypingDone(true);
    }

    setSending(false);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    setLatestAssistantIndex(-1);
    setTypingDone(true);
    setCleared(true);
    setUnreadCount(0);

    try {
      await fetch(`${API}/ai/jobs/${jobId}/chat/history`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const togglePanel = () => {
    const next = !open;

    setOpen(next);
    setUnreadCount(0);
    setLatestAssistantIndex(-1);
    setTypingDone(true);
  };

  return createPortal(
    <>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

@keyframes chat-panel-in {
  0% {
    opacity: 0;
    transform: translate(26px, 26px) scale(0.72);
  }

  65% {
    opacity: 1;
    transform: translate(-5px, -5px) scale(1.025);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

        @keyframes fab-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .chat-panel {
          position: fixed;
top: 20px;
right: 24px;
bottom: 94px;

          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          box-shadow:
            0 18px 50px rgba(26,16,64,0.16),
            0 6px 20px rgba(0,0,0,0.08);

          display: flex;
          flex-direction: column;

          z-index: 99990;

          border: 1px solid rgba(255,255,255,0.72);
          border-radius: 24px;
          overflow: hidden;

animation: chat-panel-in 0.62s cubic-bezier(0.2, 0.9, 0.25, 1.15);
transform-origin: bottom right;
        }

        .resize-handle {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          cursor: col-resize;
          z-index: 20;
        }

        .resize-handle:hover {
          background: rgba(124,58,237,0.08);
        }

        .resize-handle::after {
          content: '';
          position: absolute;
          left: 2px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 44px;
          border-radius: 999px;
          background: #c4b5fd;
          opacity: 0.75;
        }

        .chat-header {
          padding: 1rem 1.25rem 1rem 1.5rem;
          border-bottom: 1px solid #f0eeff;

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: linear-gradient(135deg, rgba(124,58,237,0.04), #fff);
          flex-shrink: 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1rem 0.5rem;
          scroll-behavior: smooth;
        }

        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #e0d9ff;
          border-radius: 99px;
        }

        .chat-message-row {
          display: flex;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .chat-message-row.user {
          justify-content: flex-end;
        }

        .chat-message-row.assistant {
          justify-content: flex-start;
        }

        .chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-avatar i {
          font-size: 13px;
        }

        .chat-avatar.bot {
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          color: #fff;
        }

        .chat-avatar.user {
          background: #ede9fe;
          color: #7c3aed;
        }

        .chat-message {
          max-width: 80%;
          padding: 0.65rem 0.9rem;

          font-size: 0.88rem;
          line-height: 1.6;
        }

        .chat-message.user {
          border-radius: 14px 14px 4px 14px;
          background: #7c3aed;
          color: #fff;
        }

        .chat-message.assistant {
          border-radius: 14px 14px 14px 4px;
          background: #f5f3ff;
          color: #1a1040;
        }

        .chat-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: #a78bfa;
          margin-left: 2px;
          vertical-align: middle;
          animation: blink 0.7s step-end infinite;
        }

        .typing-indicator {
          padding: 0.65rem 0.9rem;
          border-radius: 14px 14px 14px 4px;
          background: #f5f3ff;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: typing-bounce 1.2s ease-in-out infinite;
        }

        .quick-prompts {
          padding: 0.5rem 1rem;
          display: flex;
          gap: 0.4rem;
          overflow-x: auto;
          flex-shrink: 0;
          border-top: 1px solid #f5f3ff;
          flex-wrap: wrap;
        }

        .quick-prompts::-webkit-scrollbar {
          display: none;
        }

        .quick-prompt-btn {
          white-space: nowrap;
          padding: 0.3rem 0.75rem;
          border: 1px solid #e0d9ff;
          border-radius: 999px;
          background: #faf8ff;
          color: #7c3aed;
          font-size: 0.75rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .quick-prompt-btn:hover {
          background: #ede9fe;
          border-color: #c4b5fd;
        }

        .chat-input-area {
          padding: 0.75rem 1rem 1rem;
          border-top: 1px solid #f0eeff;

          display: flex;
          gap: 0.5rem;
          align-items: flex-end;

          flex-shrink: 0;
          background: #fff;
        }

        .chat-textarea {
          flex: 1;
          padding: 0.6rem 0.75rem;

          border: 1.5px solid #e4daff;
          border-radius: 10px;

          font-size: 0.88rem;
          font-family: inherit;

          color: #1a1040;

          resize: none;
          outline: none;

          line-height: 1.5;
          max-height: 120px;
          overflow-y: auto;

          transition: border-color 0.15s;
        }

        .chat-textarea:focus {
          border-color: #7c3aed;
        }

        .send-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;

          background: #7c3aed;
          border: none;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #fff;

          transition: all 0.15s;
          flex-shrink: 0;
        }

        .send-btn:hover {
          background: #6b2fd6;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;

          width: 56px;
          height: 56px;
          border-radius: 50%;

          background: linear-gradient(135deg, #7c3aed, #6b2fd6);
          border: none;

          cursor: pointer;

          z-index: 99991;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 8px 24px rgba(124,58,237,0.4);

          transition: all 0.2s;
          animation: fab-bounce 3s ease-in-out infinite;
        }

        .fab:hover {
          transform: scale(1.1);
          animation: none;
          box-shadow: 0 12px 32px rgba(124,58,237,0.5);
        }

        .fab-open {
          animation: none;
          background: linear-gradient(135deg, #1a1040, #7c3aed);
          box-shadow: 0 10px 28px rgba(26,16,64,0.35);
        }

        .fab-badge {
          position: absolute;
          top: -4px;
          right: -4px;

          width: 18px;
          height: 18px;
          border-radius: 50%;

          background: #10b981;
          border: 2px solid #fff;

          font-size: 10px;
          font-weight: 700;
          color: #fff;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-sm {
          background: none;
          border: none;
          cursor: pointer;

          padding: 5px;
          border-radius: 7px;

          color: #c4b5fd;

          display: flex;
          align-items: center;

          transition: all 0.15s;
        }

        .btn-icon-sm:hover {
          background: #f5f0ff;
          color: #7c3aed;
        }

        .btn-icon-sm.danger:hover {
          background: #fff0f0;
          color: #ef4444;
        }

       @media (max-width: 768px) {
  .chat-panel {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw !important;
    height: 100dvh;
    border-radius: 0;
    z-index: 99999;
    display: flex;
  flex-direction: column;
  }


  .resize-handle {
    display: none;
  }

  .chat-messages {
      flex: 1;f
  min-height: 0;
  overflow-y: auto;
  }

  .chat-input-area {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
     flex-shrink: 0;
  }

  .fab {
    right: 1.25rem;
    bottom: 5.7rem;
  }
}
      `}</style>

      <button className={`fab ${open ? "fab-open" : ""}`} onClick={togglePanel} title="CrackIt Coach">
        <i
          className={`ti ${open ? "ti-x" : "ti-message-chatbot"}`}
          style={{ fontSize: 24, color: "#fff" }}
        />

        {unreadCount > 0 && !open && (
          <div className="fab-badge">{unreadCount}</div>
        )}
      </button>

      {open && (
        <div className="chat-panel" style={{ width: panelWidth }}>
          <div className="resize-handle" onMouseDown={startResize} title="Drag to resize" />

          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i className="ti ti-brain" style={{ fontSize: 18, color: "#fff" }} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a1040" }}>
                  CrackIt Coach
                </div>

                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#a094c4",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {jobTitle} · {companyName}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {messages.length > 0 && (
                <button className="btn-icon-sm danger" onClick={clearChat} title="Clear chat">
                  <i className="ti ti-trash" style={{ fontSize: 15 }} />
                </button>
              )}

              <button className="btn-icon-sm" onClick={() => setOpen(false)} title="Close">
                <i className="ti ti-layout-sidebar-right-collapse" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {loadingHistory ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#a094c4", fontSize: "0.85rem" }}>
                Loading chat history...
              </div>
            ) : messages.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed15, #a78bfa15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                  }}
                >
                  <i className="ti ti-message-chatbot" style={{ fontSize: 28, color: "#7c3aed" }} />
                </div>

                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1040", margin: "0 0 0.5rem" }}>
                  Your CrackIt Coach
                </p>

                <p style={{ fontSize: "0.82rem", color: "#a094c4", lineHeight: 1.7, margin: 0 }}>
                  I know the job, the company, and your background. Ask me anything to ace this interview.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <Message
                    key={i}
                    msg={msg}
                    isLatestAssistant={i === latestAssistantIndex}
                    onTypingDone={() => setTypingDone(true)}
                    onTypingTick={handleTypingTick}
                  />
                ))}

                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {messages.length === 0 && !loadingHistory && (
            <div className="quick-prompts">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="quick-prompt-btn" onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              rows={1}
              placeholder="Ask your coach anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim() || !typingDone}
            >
              <i className="ti ti-send" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}