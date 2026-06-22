import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

const PUJA_RED = "#B22222";
const PUJA_GOLD = "#DAA520";

const FEATURED_PANDALS = [
  { id: "kumartuli", name_en: "Kumartuli Sarbojanin", name_bn: "কুমারটুলি সর্বজনীন", crowd: "very_high" },
  { id: "bagbazar", name_en: "Bagbazar Sarbojanin", name_bn: "বাগবাজার সর্বজনীন", crowd: "very_high" },
  { id: "college_square", name_en: "College Square", name_bn: "কলেজ স্কোয়ার", crowd: "very_high" },
  { id: "mohammad_ali", name_en: "Mohammad Ali Park", name_bn: "মোহম্মদ আলী পার্ক", crowd: "high" },
  { id: "ekdalia", name_en: "Ekdalia Evergreen", name_bn: "একডালিয়া এভারগ্রিন", crowd: "high" },
];

const CROWD_COLORS: Record<string, string> = {
  low: "#27AE60",
  medium: "#F39C12",
  high: "#E67E22",
  very_high: "#C0392B",
};

const CROWD_LABELS: Record<string, { en: string; bn: string }> = {
  low: { en: "Low", bn: "কম" },
  medium: { en: "Medium", bn: "মাঝারি" },
  high: { en: "High", bn: "বেশি" },
  very_high: { en: "Very High", bn: "অত্যন্ত বেশি" },
};

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

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "bn";

  const fireAction = (queryEn: string, queryBn: string) => {
    const query = lang === "bn" ? queryBn : queryEn;
    router.push({ pathname: "/(tabs)/chat", params: { query } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor={PUJA_RED} />

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t("home.welcome")}</Text>
        <Text style={styles.heroSubtitle}>{t("home.subtitle")}</Text>
      </View>

      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.actionCard, a.id === "food" && styles.actionCardWide]}
            onPress={() => fireAction(a.queryEn, a.queryBn)}
            activeOpacity={0.75}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <View style={a.id === "food" ? { flex: 1 } : undefined}>
              <Text style={styles.actionLabel}>{t(a.labelKey)}</Text>
              <Text style={styles.actionDesc}>{t(a.descKey)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>💡 {t("home.tip")}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t("home.featuredTitle")}</Text>
      {FEATURED_PANDALS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.pandalCard}
          onPress={() => router.push({ pathname: "/(tabs)/chat", params: { query: pandalQuery(p, lang) } })}
        >
          <View style={styles.pandalInfo}>
            <Text style={styles.pandalName}>{lang === "bn" ? p.name_bn : p.name_en}</Text>
            <Text style={styles.pandalHint}>
              {lang === "bn" ? "📍 তথ্য ও দিকনির্দেশনা পান" : "📍 Info & directions"}
            </Text>
          </View>
          <View style={styles.pandalRight}>
            <View style={[styles.crowdBadge, { backgroundColor: CROWD_COLORS[p.crowd] }]}>
              <Text style={styles.crowdText}>
                {lang === "bn" ? CROWD_LABELS[p.crowd].bn : CROWD_LABELS[p.crowd].en}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: PUJA_RED,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "HindSiliguri-Bold",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#FFD0D0",
    fontFamily: "HindSiliguri-Regular",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: -16,
    gap: 10,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionCardWide: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C1810",
    fontFamily: "HindSiliguri-Bold",
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    color: "#9E8E7E",
    fontFamily: "HindSiliguri-Regular",
    lineHeight: 17,
  },
  tipBox: {
    backgroundColor: "#FFF3CD",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: PUJA_GOLD,
  },
  tipText: { fontSize: 13, color: "#856404", lineHeight: 18 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2C1810",
    fontFamily: "HindSiliguri-Bold",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  pandalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pandalInfo: { flex: 1 },
  pandalName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1810",
    fontFamily: "HindSiliguri-Bold",
  },
  pandalHint: {
    fontSize: 12,
    color: "#9E8E7E",
    fontFamily: "HindSiliguri-Regular",
    marginTop: 2,
  },
  pandalRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  crowdBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  crowdText: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" },
  chevron: { fontSize: 20, color: "#C0A090", lineHeight: 24 },
});
