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

const QUICK_ACTIONS = [
  {
    id: "plan",
    icon: "🗺️",
    labelKey: "home.action_plan",
    descKey: "home.action_plan_desc",
    queryEn: "Help me plan a pandal hopping itinerary for Durga Puja 2026 in Kolkata. Suggest the best pandals to visit and create an optimized route.",
    queryBn: "কলকাতার দুর্গাপূজা ২০২৬-এর জন্য পণ্ডাল হপিং পরিকল্পনা করতে সাহায্য করুন। সেরা পণ্ডালগুলি পরামর্শ দিন এবং একটি সুবিধাজনক রুট তৈরি করুন।",
  },
  {
    id: "directions",
    icon: "🧭",
    labelKey: "home.action_directions",
    descKey: "home.action_directions_desc",
    queryEn: "I want to visit a Durga Puja pandal. Can you help me get directions? Please ask me where I am starting from and which pandal I want to reach.",
    queryBn: "আমি একটি দুর্গাপূজার পণ্ডালে যেতে চাই। আমাকে দিকনির্দেশনা পেতে সাহায্য করুন। আমি কোথা থেকে যাচ্ছি এবং কোন পণ্ডালে যেতে চাই তা জিজ্ঞেস করুন।",
  },
  {
    id: "nearby",
    icon: "📍",
    labelKey: "home.action_nearby",
    descKey: "home.action_nearby_desc",
    queryEn: "I want to find Durga Puja pandals near me. Please ask me for my current location and show me what's nearby.",
    queryBn: "আমার কাছের দুর্গাপূজার পণ্ডালগুলি খুঁজতে চাই। আমার অবস্থান জিজ্ঞেস করুন এবং কাছের পণ্ডালগুলি দেখান।",
  },
  {
    id: "about",
    icon: "ℹ️",
    labelKey: "home.action_about",
    descKey: "home.action_about_desc",
    queryEn: "Tell me about the top famous Durga Puja pandals in Kolkata — their history, unique themes, and what makes each one special.",
    queryBn: "কলকাতার বিখ্যাত দুর্গাপূজার পণ্ডালগুলি সম্পর্কে বলুন — তাদের ইতিহাস, অনন্য থিম এবং প্রতিটির বিশেষত্ব কী।",
  },
  {
    id: "food",
    icon: "🍽️",
    labelKey: "home.action_food",
    descKey: "home.action_food_desc",
    queryEn: "I want to find restaurants and cafes near a Durga Puja pandal. Please ask me which pandal or area I'm near, then show me good food options nearby.",
    queryBn: "আমি একটি দুর্গাপূজার পণ্ডালের কাছে রেস্তোরাঁ ও ক্যাফে খুঁজতে চাই। আমি কোন পণ্ডাল বা এলাকার কাছে আছি তা জিজ্ঞেস করুন, তারপর কাছের ভালো খাবারের জায়গা দেখান।",
  },
];

export function HomeScreen({ onNavigate }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "bn";

  return (
    <div className="screen">
      <div className="home-hero">
        <h2>{t("home.welcome")}</h2>
        <p>{t("home.subtitle")}</p>
      </div>

      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            className="quick-action-card"
            onClick={() => onNavigate("chat", lang === "bn" ? a.queryBn : a.queryEn)}
          >
            <span className="qa-icon">{a.icon}</span>
            <strong className="qa-label">{t(a.labelKey)}</strong>
            <span className="qa-desc">{t(a.descKey)}</span>
          </button>
        ))}
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
