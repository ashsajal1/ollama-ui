interface Model {
  name: string;
  modified_at: string;
  size: number;
}

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

export async function getModels(): Promise<Model[]> {
  const response = await fetch("http://localhost:11434/api/tags");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.models;
}

export async function chatWithOllama(messages: ChatRequest["messages"], model: string = "llama2") {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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