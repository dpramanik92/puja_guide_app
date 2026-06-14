import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, StyleSheet, View, Image } from "react-native";
import { useLanguage } from "../../src/hooks/useLanguage";

const PUJA_RED = "#B22222";
const PUJA_GOLD = "#DAA520";

function LanguageToggle() {
  const { currentLang, toggleLanguage } = useLanguage();
  return (
    <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
      <Text style={styles.langText}>{currentLang === "en" ? "বাংলা" : "EN"}</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PUJA_RED,
        tabBarInactiveTintColor: "#9E8E7E",
        tabBarStyle: { backgroundColor: "#FFF8F0", borderTopColor: "#E8DDD0" },
        headerStyle: { backgroundColor: PUJA_RED },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontFamily: "HindSiliguri-Bold", fontSize: 18 },
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/maa_durga_logo.png")}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          </View>
        ),
        headerRight: () => <LanguageToggle />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
          headerTitle: t("appName"),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.chat"),
          tabBarLabel: t("tabs.chat"),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
          headerTitle: t("chat.title"),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t("tabs.live"),
          tabBarLabel: t("tabs.live"),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📡</Text>,
          headerTitle: t("live.title"),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  langButton: {
    marginRight: 14,
    backgroundColor: PUJA_GOLD,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langText: {
    color: "#2C1810",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: "HindSiliguri-Bold",
  },
});
