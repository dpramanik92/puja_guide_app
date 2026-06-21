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
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { ChatBubble } from "../../src/components/ChatBubble";
import { MessageInput } from "../../src/components/MessageInput";
import { streamChat, type ChatMessage, type ChatSource, type MapData } from "../../src/services/api";

interface Message extends ChatMessage {
  id: string;
  source?: ChatSource;
  mapData?: MapData;
  isStreaming?: boolean;
}

const PUJA_RED = "#B22222";

const MARKER_COLORS: Record<string, string> = {
  pandal: "#B22222",
  place: "#2563EB",
  origin: "#16A34A",
  destination: "#9333EA",
};

function PandaMap({ mapData }: { mapData: MapData }) {
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={styles.map}
      initialRegion={{
        latitude: mapData.center.lat,
        longitude: mapData.center.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
    >
      {mapData.markers.map((m, i) => (
        <Marker
          key={i}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.name}
          pinColor={MARKER_COLORS[m.type] ?? PUJA_RED}
        />
      ))}
      {mapData.polylines.map((p, i) => (
        <Polyline
          key={i}
          coordinates={p.coords.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
          strokeColor={p.color}
          strokeWidth={4}
        />
      ))}
    </MapView>
  );
}

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

  const sourceStatusKey = (source: ChatSource) => {
    if (source === "web") return "chat.searching_web";
    if (source === "maps") return "chat.searching_maps";
    return "chat.searching_docs";
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
          setStatusText(t(sourceStatusKey(source)));
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
        onMapData: (mapData) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, mapData } : m))
          );
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
            <View>
              <ChatBubble
                role={item.role}
                content={item.content}
                source={item.source}
                isStreaming={item.isStreaming}
              />
              {item.mapData && !item.isStreaming && (
                <View style={styles.mapContainer}>
                  <PandaMap mapData={item.mapData} />
                </View>
              )}
            </View>
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
  mapContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: { height: 220, width: "100%" },
});
