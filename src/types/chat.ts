export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  contentType?: "text" | "image";
  imageUrl?: string;
  createdAt?: Date;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatProps {
  initialChatId?: string;
}

export interface PreGeneratedPrompt {
  title: string;
  prompt: string;
}