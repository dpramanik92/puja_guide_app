import type { MapData } from "../components/MapView";

const BASE_URL = "/api";

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

export type StreamEvent =
  | { type: "source"; source: ChatSource }
  | { type: "token"; token: string }
  | { type: "mapData"; mapData: MapData }
  | { type: "done" };

export async function* streamChat(
  message: string,
  history: ChatMessage[]
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);

      if (data === "[DONE]") {
        yield { type: "done" };
        return;
      }

      if (data.startsWith("__SOURCE__")) {
        yield { type: "source", source: data.replace("__SOURCE__", "") as ChatSource };
      } else if (data.startsWith("__MAP_DATA__")) {
        try {
          yield { type: "mapData", mapData: JSON.parse(data.slice(12)) as MapData };
        } catch {
          // ignore malformed map data
        }
      } else {
        try {
          yield { type: "token", token: JSON.parse(data) };
        } catch {
          yield { type: "token", token: data };
        }
      }
    }
  }

  yield { type: "done" };
}

export async function fetchLiveFeed(lang: "en" | "bn"): Promise<LiveCard[]> {
  const response = await fetch(`${BASE_URL}/live-feed?lang=${lang}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.cards as LiveCard[];
}
