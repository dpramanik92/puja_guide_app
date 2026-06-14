import EventSource from "react-native-sse";

const BASE_URL = __DEV__
  ? "http://192.168.29.125:8000/api"
  : "https://your-backend.example.com/api";

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

export type ChatSource = "database" | "web";

export interface ChatStreamCallbacks {
  onSource: (source: ChatSource) => void;
  onToken: (token: string) => void;
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
