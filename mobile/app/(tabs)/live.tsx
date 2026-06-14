import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { LiveFeedCard } from "../../src/components/LiveFeedCard";
import { fetchLiveFeed, type LiveCard } from "../../src/services/api";

const PUJA_RED = "#B22222";

export default function LiveScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "bn";

  const [cards, setCards] = useState<LiveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchLiveFeed(lang);
        setCards(data);
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lang, t]
  );

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PUJA_RED} />
        <Text style={styles.loadingText}>{t("live.refreshing")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={cards}
      keyExtractor={(_, i) => i.toString()}
      renderItem={({ item }) => <LiveFeedCard card={item} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          colors={[PUJA_RED]}
          tintColor={PUJA_RED}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={styles.emptyText}>{t("live.noNews")}</Text>
        </View>
      }
      ListHeaderComponent={
        <View style={styles.headerBanner}>
          <Text style={styles.bannerDot}>🔴</Text>
          <Text style={styles.bannerText}>{t("live.title")}</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  listContent: { paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, minHeight: 300 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#5C4033" },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: "#B22222", textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#5C4033", textAlign: "center" },
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  bannerDot: { fontSize: 14 },
  bannerText: {
    fontSize: 13,
    color: "#B22222",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
