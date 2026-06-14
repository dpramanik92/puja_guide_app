import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { ChatBubble } from "../../src/components/ChatBubble";
import { MessageInput } from "../../src/components/MessageInput";
import { streamChat, type ChatMessage, type ChatSource } from "../../src/services/api";

interface Message extends ChatMessage {
  id: string;
  source?: ChatSource;
  isStreaming?: boolean;
}

const PUJA_RED = "#B22222";

export default function ChatScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ query?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const listRef = useRef<FlatList>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);
  const lastFiredQueryRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = useCallback(
    (text: string) => {
      if (isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setStatusText(t("chat.searching_docs"));
      scrollToBottom();

      const history = messages
        .filter((m) => !m.isStreaming)
        .map(({ role, content }) => ({ role, content }));

      closeStreamRef.current = streamChat(text, history, {
        onSource: (source) => {
          setStatusText(
            source === "web" ? t("chat.searching_web") : t("chat.searching_docs")
          );
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, source } : m))
          );
        },
        onToken: (token) => {
          setStatusText("");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + token, isStreaming: true }
                : m
            )
          );
          scrollToBottom();
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            )
          );
          setIsLoading(false);
          setStatusText("");
        },
        onError: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: t("chat.errorMessage"), isStreaming: false }
                : m
            )
          );
          setIsLoading(false);
          setStatusText("");
        },
      });
    },
    [isLoading, messages, t]
  );

  // Fire auto-query when navigating from home with a pandal query param.
  // Uses a ref to avoid double-firing if the tab was already mounted.
  useEffect(() => {
    const q = params.query;
    if (q && q !== lastFiredQueryRef.current) {
      lastFiredQueryRef.current = q;
      handleSend(q);
    }
  }, [params.query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🪔</Text>
          <Text style={styles.emptyText}>{t("chat.emptyHint")}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <ChatBubble
              role={item.role}
              content={item.content}
              source={item.source}
              isStreaming={item.isStreaming}
            />
          )}
          contentContainerStyle={styles.list}
          onLayout={scrollToBottom}
        />
      )}

      {statusText ? (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={PUJA_RED} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}

      <MessageInput onSend={handleSend} disabled={isLoading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F0" },
  list: { paddingTop: 12, paddingBottom: 8 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 15,
    color: "#5C4033",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "HindSiliguri-Regular",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFF3E0",
    gap: 8,
  },
  statusText: { fontSize: 13, color: "#8B4513", fontStyle: "italic" },
});
