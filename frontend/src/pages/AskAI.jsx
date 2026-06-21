import { useState, useRef, useEffect } from "react";
  import { Send, Trash2, Bot, User, Loader2, MessageSquare } from "lucide-react";

  function getSmartContext() {
    try {
      const raw = localStorage.getItem("hc_last_prediction");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function buildContextMessage(ctx) {
    const lines = [];
    if (ctx.disease) lines.push(`Predicted Disease: ${ctx.disease}`);
    if (ctx.confidence != null)
      lines.push(`Confidence: ${ctx.confidence.toFixed(1)}%`);
    return lines.join("\n");
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function TypingIndicator() {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{
          background: "white", border: "1px solid var(--border)",
          borderRadius: "0 12px 12px 12px", padding: "12px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#2563EB", display: "inline-block",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function MessageBubble({ msg }) {
    const isUser = msg.role === "user";
    const lines = msg.content.split("\n");

    return (
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 16,
        flexDirection: isUser ? "row-reverse" : "row",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isUser
            ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            : "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {isUser ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
        </div>
        <div style={{ maxWidth: "75%", minWidth: 60 }}>
          <div style={{
            background: isUser ? "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)" : "white",
            color: isUser ? "white" : "var(--foreground)",
            border: isUser ? "none" : "1px solid var(--border)",
            borderRadius: isUser ? "12px 0 12px 12px" : "0 12px 12px 12px",
            padding: "12px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            {lines.map((line, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0 0" }}>
                {line || <br />}
              </p>
            ))}
          </div>
          <div style={{
            fontSize: 11, color: "var(--muted-foreground)", marginTop: 4,
            textAlign: isUser ? "right" : "left",
          }}>
            {formatTime(msg.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  export default function AskAI() {
    const context = getSmartContext();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
      if (context) {
        setInput(buildContextMessage(context) + "\n\nTell me more about my predicted disease.");
      }
      inputRef.current?.focus();
    }, []);

    async function sendMessage(text) {
      const userMsg = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
            "http://127.0.0.1:5000/chat",
            {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({
                message: text
                })
            }
        );
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error ?? "Failed to get a response");
        }

        const aiMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply ?? "",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    function handleSubmit() {
      const text = input.trim();
      if (!text || loading) return;
      sendMessage(text);
    }

    function handleKeyDown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }

    function clearChat() {
      setMessages([]);
      setError(null);
      inputRef.current?.focus();
    }

    return (
      <div style={{
        maxWidth: 800, margin: "0 auto", padding: "24px 16px",
        display: "flex", flexDirection: "column", height: "calc(100vh - 64px)",
      }}>
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
          }
          .ask-ai-textarea:focus { outline: none; }
          .ask-ai-send-btn:hover:not(:disabled) { background: #1d4ed8 !important; }
          .ask-ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .ask-ai-clear-btn:hover { background: rgba(0,0,0,0.06) !important; }
          .ask-ai-quick-btn:hover { background: rgba(37,99,235,0.12) !important; border-color: #2563EB !important; }
        `}</style>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}>
              <Bot size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Ask AI
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                Healthcare AI Assistant &bull; Powered by Groq
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="ask-ai-clear-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                fontSize: 13, color: "var(--muted-foreground)",
                transition: "all 0.15s ease",
              }}
            >
              <Trash2 size={14} />
              Clear chat
            </button>
          )}
        </div>

        {/* Context banner */}
        {context?.disease && messages.length === 0 && (
          <div style={{
            background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, flexShrink: 0,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: "#1d4ed8" }}>
              <strong>Smart context detected:</strong> Your recent prediction was{" "}
              <strong>{context.disease}</strong>
              {context.confidence != null && ` (${context.confidence.toFixed(1)}% confidence)`}.
              Ask me anything about it.
            </span>
          </div>
        )}

        {/* Chat area */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          background: "#f8fafc", borderRadius: 12,
          border: "1px solid var(--border)", marginBottom: 16,
          minHeight: 0,
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 32 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(37,99,235,0.1)", margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquare size={28} color="#2563EB" />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
                How can I help you today?
              </h3>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--muted-foreground)", maxWidth: 400, marginInline: "auto" }}>
                Ask me about any disease, symptoms, precautions, diet recommendations, or specialist doctors.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[
                  "What is Typhoid and how is it treated?",
                  "What foods should I avoid with Malaria?",
                  "Which doctor should I see for Pneumonia?",
                  "What are early signs of Diabetes?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="ask-ai-quick-btn"
                    style={{
                      background: "white", border: "1px solid var(--border)",
                      borderRadius: 20, padding: "8px 14px", cursor: "pointer",
                      fontSize: 13, color: "var(--foreground)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 12,
                  fontSize: 13, color: "#b91c1c",
                }}>
                  {error}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          background: "white", border: "1px solid var(--border)", borderRadius: 12,
          padding: "12px 12px 12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flexShrink: 0,
          display: "flex", alignItems: "flex-end", gap: 10,
        }}>
          <textarea
            ref={inputRef}
            className="ask-ai-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a disease, symptoms, treatment…  (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, border: "none", resize: "none", fontSize: 14,
              lineHeight: 1.5, background: "transparent", color: "var(--foreground)",
              fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="ask-ai-send-btn"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease", flexShrink: 0,
            }}
          >
            {loading
              ? <Loader2 size={16} color="white" style={{ animation: "spin 1s linear infinite" }} />
              : <Send size={16} color="white" />
            }
          </button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted-foreground)", textAlign: "center" }}>
          For informational purposes only. Always consult a qualified healthcare professional.
        </p>
      </div>
    );
  }
  