export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  contentType?: "text" | "image";
  imageUrl?: string;
  createdAt?: Date;
}


// Main chat type used throughout the app (not Prisma)
export interface ChatType {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Local chat type for UI state (if needed)
export type LocalChatType = ChatType;

export interface ChatProps {
  initialChatId?: string;
}

export interface PreGeneratedPrompt {
  title: string;
  prompt: string;
}