import { useTranslation } from "react-i18next";

const FEATURED_PANDALS = [
  { id: "kumartuli", name_en: "Kumartuli Sarbojanin", name_bn: "কুমারটুলি সর্বজনীন", crowd: "very_high", color: "#C0392B" },
  { id: "bagbazar", name_en: "Bagbazar Sarbojanin", name_bn: "বাগবাজার সর্বজনীন", crowd: "very_high", color: "#C0392B" },
  { id: "college_square", name_en: "College Square", name_bn: "কলেজ স্কোয়ার", crowd: "very_high", color: "#C0392B" },
  { id: "mohammad_ali", name_en: "Mohammad Ali Park", name_bn: "মোহম্মদ আলী পার্ক", crowd: "high", color: "#E67E22" },
  { id: "ekdalia", name_en: "Ekdalia Evergreen", name_bn: "একডালিয়া এভারগ্রিন", crowd: "high", color: "#E67E22" },
];

const CROWD_LABELS: Record<string, { en: string; bn: string }> = {
  low: { en: "Low", bn: "কম" },
  medium: { en: "Medium", bn: "মাঝারি" },
  high: { en: "High", bn: "বেশি" },
  very_high: { en: "Very High", bn: "অত্যন্ত বেশি" },
};

interface Props {
  onNavigate: (tab: string, query?: string) => void;
}

function pandalQuery(p: typeof FEATURED_PANDALS[0], lang: "en" | "bn"): string {
  if (lang === "bn") {
    return `${p.name_bn} সম্পর্কে বিস্তারিত বলুন — এর ইতিহাস, বিশেষত্ব, কখন যাওয়া ভালো, ভিড় কেমন থাকে, এবং কলকাতার বিভিন্ন প্রান্ত থেকে কীভাবে পৌঁছানো যায়।`;
  }
  return `Tell me about ${p.name_en}: its history, unique theme or idol, best visiting time, expected crowd level, and step-by-step directions to reach it from different parts of Kolkata.`;
}

export function HomeScreen({ onNavigate }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "bn";

  return (
    <div className="screen">
      <div className="home-hero">
        <h2>{t("home.welcome")}</h2>
        <p>{t("home.subtitle")}</p>
      </div>

      <div className="home-cta">
        <button className="cta-card" onClick={() => onNavigate("chat")}>
          <span>💬</span>
          <strong>{t("home.chatButton")}</strong>
        </button>
        <button className="cta-card gold" onClick={() => onNavigate("live")}>
          <span>📡</span>
          <strong>{t("home.liveButton")}</strong>
        </button>
      </div>

      <div className="tip-box">💡 {t("home.tip")}</div>

      <div className="section-title">{t("home.featuredTitle")}</div>

      {FEATURED_PANDALS.map((p) => (
        <button
          key={p.id}
          className="pandal-row"
          onClick={() => onNavigate("chat", pandalQuery(p, lang))}
        >
          <div className="pandal-info">
            <span className="pandal-name">{lang === "bn" ? p.name_bn : p.name_en}</span>
            <span className="pandal-hint">
              📍 {lang === "bn" ? "তথ্য ও দিকনির্দেশনা পান" : "Info & directions"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="crowd-badge" style={{ background: p.color }}>
              {lang === "bn" ? CROWD_LABELS[p.crowd].bn : CROWD_LABELS[p.crowd].en}
            </span>
            <span style={{ fontSize: 20, color: "#C0A090" }}>›</span>
          </div>
        </button>
      ))}
    </div>
  );
}
