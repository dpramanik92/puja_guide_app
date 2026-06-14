import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HomeScreen } from "./components/HomeScreen";
import { ChatScreen } from "./components/ChatScreen";
import { LiveScreen } from "./components/LiveScreen";

type Tab = "home" | "chat" | "live";

const TABS: { id: Tab; icon: string; labelKey: string }[] = [
  { id: "home", icon: "🏠", labelKey: "tabs.home" },
  { id: "chat", icon: "💬", labelKey: "tabs.chat" },
  { id: "live", icon: "📡", labelKey: "tabs.live" },
];

export function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [chatQuery, setChatQuery] = useState<string | undefined>();

  const navigate = (tab: string, query?: string) => {
    setChatQuery(query);
    setActiveTab(tab as Tab);
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "bn" : "en");
  };

  const TAB_TITLES: Record<Tab, string> = {
    home: t("appName"),
    chat: t("chat.title"),
    live: t("live.title"),
  };

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/maa_durga_logo.png" alt="Maa Durga" style={{ width: 38, height: 38, objectFit: "contain" }} />
          <h1>{TAB_TITLES[activeTab]}</h1>
        </div>
        <button className="lang-btn" onClick={toggleLang}>
          {i18n.language === "en" ? "বাংলা" : "EN"}
        </button>
      </header>

      {activeTab === "home" && <HomeScreen onNavigate={navigate} />}
      {activeTab === "chat" && <ChatScreen key={chatQuery} initialQuery={chatQuery} />}
      {activeTab === "live" && <LiveScreen />}

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
