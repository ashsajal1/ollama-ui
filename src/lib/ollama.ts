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

export async function* streamChat(messages: ChatRequest["messages"], model: string = "llama2") {
  const abortController = new AbortController();
  const signal = abortController.signal;

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No reader available");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);
      
      for (const line of lines) {
        if (line) {
          try {
            yield JSON.parse(line) as ChatResponse;
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request was aborted');
      return;
    }
    throw error;
  }
}