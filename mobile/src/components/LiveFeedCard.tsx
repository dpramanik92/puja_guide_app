import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { LiveCard } from "../services/api";

interface Props {
  card: LiveCard;
}

export function LiveFeedCard({ card }: Props) {
  const { t } = useTranslation();

  const timeAgo = (dateStr: string) => {
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
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => card.url && Linking.openURL(card.url)}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{card.source}</Text>
        </View>
        {card.published_date ? (
          <Text style={styles.timeText}>{timeAgo(card.published_date)}</Text>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {card.title}
      </Text>

      <Text style={styles.summary} numberOfLines={4}>
        {card.summary}
      </Text>

      <Text style={styles.readMore}>{t("common.readMore")} →</Text>
    </TouchableOpacity>
  );
}

const PUJA_RED = "#B22222";
const PUJA_GOLD = "#DAA520";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: PUJA_RED,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sourceBadge: {
    backgroundColor: PUJA_GOLD + "22",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 11,
    color: "#8B6914",
    fontWeight: "600",
  },
  timeText: {
    fontSize: 11,
    color: "#9E8E7E",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 6,
    lineHeight: 21,
  },
  summary: {
    fontSize: 14,
    color: "#5C4033",
    lineHeight: 20,
    marginBottom: 10,
  },
  readMore: {
    fontSize: 13,
    color: PUJA_RED,
    fontWeight: "600",
  },
});
