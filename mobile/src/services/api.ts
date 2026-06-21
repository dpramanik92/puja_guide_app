import EventSource from "react-native-sse";

const BASE_URL = "http://3.95.218.93:8000/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LiveCard {
  title: string;
  summary: string;
  url: string;
  published_date: string;
  source: string;
}

export type ChatSource = "database" | "web" | "maps";

export interface MapMarker {
  name: string;
  lat: number;
  lng: number;
  type: "pandal" | "place" | "origin" | "destination";
  info: string;
}

export interface MapPolyline {
  coords: [number, number][];
  color: string;
}

export interface MapData {
  markers: MapMarker[];
  polylines: MapPolyline[];
  center: { lat: number; lng: number };
}

export interface ChatStreamCallbacks {
  onSource: (source: ChatSource) => void;
  onToken: (token: string) => void;
  onMapData: (mapData: MapData) => void;
  onDone: () => void;
  onError: (err: Event) => void;
}

export function streamChat(
  message: string,
  history: ChatMessage[],
  callbacks: ChatStreamCallbacks
): () => void {
  const url = `${BASE_URL}/chat`;

  const es = new EventSource(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  es.addEventListener("message", (event) => {
    const data = event.data as string;

    if (data === "[DONE]") {
      callbacks.onDone();
      es.close();
      return;
    }

    if (data.startsWith("__SOURCE__")) {
      const source = data.replace("__SOURCE__", "") as ChatSource;
      callbacks.onSource(source);
      return;
    }

    if (data.startsWith("__MAP_DATA__")) {
      try {
        const mapData = JSON.parse(data.slice(12)) as MapData;
        callbacks.onMapData(mapData);
      } catch {
        // ignore malformed map data
      }
      return;
    }

    try {
      callbacks.onToken(JSON.parse(data));
    } catch {
      callbacks.onToken(data);
    }
  });

  es.addEventListener("error", (event) => {
    callbacks.onError(event as Event);
    es.close();
  });

  return () => es.close();
}

export async function fetchLiveFeed(
  lang: "en" | "bn"
): Promise<LiveCard[]> {
  const response = await fetch(`${BASE_URL}/live-feed?lang=${lang}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.cards as LiveCard[];
}
