export interface ChatRequest {
  model: string;
  messages: { role: "user" | "assistant"; content: string }[];
  stream?: boolean;
  format?: "json";
}

export interface ChatResponse {
  model: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
}

export async function chatWithOllama(messages: ChatRequest["messages"]) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama2",
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data as ChatResponse;
}