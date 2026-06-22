import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HomeScreen } from "./components/HomeScreen";
import { ChatScreen } from "./components/ChatScreen";

type Tab = "home" | "chat";

const TABS: { id: Tab; icon: string; labelKey: string }[] = [
  { id: "home", icon: "🏠", labelKey: "tabs.home" },
  { id: "chat", icon: "💬", labelKey: "tabs.chat" },
];

export function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [chatQuery, setChatQuery] = useState<string | undefined>();
  const [chatKey, setChatKey] = useState(0);

  const navigate = (tab: string, query?: string) => {
    setChatQuery(query);
    setChatKey((k) => k + 1);
    setActiveTab(tab as Tab);
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "bn" : "en");
  };

  const newChat = () => {
    setChatQuery(undefined);
    setChatKey((k) => k + 1);
    setActiveTab("chat");
  };

  const TAB_TITLES: Record<Tab, string> = {
    home: t("appName"),
    chat: t("chat.title"),
  };

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/maa_durga_logo.png" alt="Maa Durga" style={{ width: 38, height: 38, objectFit: "contain" }} />
          <h1>{TAB_TITLES[activeTab]}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {activeTab === "chat" && (
            <button className="new-chat-btn" onClick={newChat} title={t("chat.newChat")}>
              ✏️ {t("chat.newChat")}
            </button>
          )}
          <button className="lang-btn" onClick={toggleLang}>
            {i18n.language === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      </header>

      {activeTab === "home" && <HomeScreen onNavigate={navigate} />}
      {activeTab === "chat" && <ChatScreen key={chatKey} initialQuery={chatQuery} />}

      <nav className="tabs">
        {TABS.map(({ id, icon, labelKey }) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? "active" : ""}`}
            onClick={() => { setChatQuery(undefined); setActiveTab(id); }}
          >
            <span className="tab-icon">{icon}</span>
            {t(labelKey)}
          </button>
        ))}
      </nav>
    </div>
  );
}
