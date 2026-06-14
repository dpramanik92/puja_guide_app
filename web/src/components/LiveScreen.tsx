import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { fetchLiveFeed, type LiveCard } from "../services/api";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

export function LiveScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "bn";

  const [cards, setCards] = useState<LiveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveFeed(lang);
      setCards(data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="screen">
        <div className="center-msg">
          <span>📡</span>
          {t("live.refreshing")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen">
        <div className="center-msg">
          <span>⚠️</span>
          {error}
          <button className="refresh-btn" onClick={load}>{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="live-header">
        <span>🔴</span> {t("live.title")}
      </div>

      {cards.length === 0 ? (
        <div className="center-msg">
          <span>📰</span>
          {t("live.noNews")}
        </div>
      ) : (
        cards.map((card, i) => (
          <a
            key={i}
            className="feed-card"
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="card-meta">
              <span className="card-source">{card.source}</span>
              {card.published_date && (
                <span className="card-time">{timeAgo(card.published_date)}</span>
              )}
            </div>
            <div className="card-title">{card.title}</div>
            <div className="card-summary">{card.summary}</div>
            <span className="card-read-more">{t("common.readMore")} →</span>
          </a>
        ))
      )}

      <button className="refresh-btn" onClick={load}>{t("live.refresh")}</button>
    </div>
  );
}
