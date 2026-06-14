import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { ChatSource } from "../services/api";

interface Props {
  role: "user" | "assistant";
  content: string;
  source?: ChatSource;
  isStreaming?: boolean;
}

export function ChatBubble({ role, content, source, isStreaming }: Props) {
  const { t } = useTranslation();
  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {content}
          {isStreaming ? "▌" : ""}
        </Text>
        {!isUser && source && !isStreaming && (
          <View style={styles.sourceChip}>
            <Text style={styles.sourceText}>
              {source === "database" ? t("chat.source_db") : t("chat.source_web")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const PUJA_RED = "#B22222";
const PUJA_GOLD = "#DAA520";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: PUJA_RED,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#F5F0E8",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: { color: "#FFFFFF" },
  textAssistant: { color: "#2C1810" },
  sourceChip: {
    marginTop: 6,
    backgroundColor: PUJA_GOLD + "33",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  sourceText: {
    fontSize: 11,
    color: "#8B6914",
  },
});
