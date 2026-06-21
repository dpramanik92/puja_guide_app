import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { streamChat, type ChatMessage, type ChatSource } from "../services/api";
import { MapView, type MapData } from "./MapView";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: ChatSource;
  mapData?: MapData;
  streaming?: boolean;
}

interface Props {
  initialQuery?: string;
}

export function ChatScreen({ initialQuery }: Props) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialQueryFired = useRef(false);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialQuery && !initialQueryFired.current) {
      initialQueryFired.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "40px";

      const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
      const asstId = (Date.now() + 1).toString();
      const asstMsg: Message = { id: asstId, role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userMsg, asstMsg]);
      setLoading(true);
      setStatusText(t("chat.searching_docs"));

      const history = messages
        .filter((m) => !m.streaming)
        .map(({ role, content }) => ({ role, content } as ChatMessage));

      try {
        for await (const event of streamChat(trimmed, history)) {
          if (event.type === "source") {
            const statusKey =
              event.source === "web"
                ? "chat.searching_web"
                : event.source === "maps"
                ? "chat.searching_maps"
                : "chat.searching_docs";
            setStatusText(t(statusKey));
            setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, source: event.source } : m))
            );
          } else if (event.type === "token") {
            setStatusText("");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstId ? { ...m, content: m.content + event.token } : m
              )
            );
          } else if (event.type === "mapData") {
            setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, mapData: event.mapData } : m))
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, streaming: false } : m))
            );
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, content: t("chat.errorMessage"), streaming: false } : m
          )
        );
      } finally {
        setLoading(false);
        setStatusText("");
      }
    },
    [loading, messages, t]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "40px";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const sourceLabel = (source: ChatSource) => {
    if (source === "web") return t("chat.source_web");
    if (source === "maps") return t("chat.source_maps");
    return t("chat.source_db");
  };

  return (
    <div className="chat-wrap screen">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🪔</div>
            <div className="empty-text">{t("chat.emptyHint")}</div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg-row ${m.role}`}>
              <div className={`bubble ${m.role}`}>
                {m.content}
                {m.streaming && <span className="cursor">▌</span>}
                {m.role === "assistant" && m.source && !m.streaming && (
                  <div>
                    <span className="source-chip">{sourceLabel(m.source)}</span>
                  </div>
                )}
                {m.mapData && !m.streaming && (
                  <MapView mapData={m.mapData} />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {statusText && (
        <div className="status-bar">
          <div className="spinner" />
          {statusText}
        </div>
      )}

      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize(); }}
          onKeyDown={onKeyDown}
          placeholder={t("chat.placeholder")}
          rows={1}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => handleSend(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? <span className="spinner" style={{ borderColor: "#f3d4b0", borderTopColor: "#fff" }} /> : "➤"}
        </button>
      </div>
    </div>
  );
}
