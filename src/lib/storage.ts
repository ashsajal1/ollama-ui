export interface Chat {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  role: string;
  chatId: string;
  createdAt: Date;
}

class LocalStorageAdapter {
  private readonly CHATS_KEY = 'ollama_chats';

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getAllChatsSync(): Chat[] {
    const chatsJson = localStorage.getItem(this.CHATS_KEY);
    if (!chatsJson) return [];
    const chats = JSON.parse(chatsJson);
    const parsedChats = chats.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
    }));
    return parsedChats.sort((a: Chat, b: Chat) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createChat(name: string): Promise<Chat> {
    const chats = this.getAllChatsSync();
    const newChat: Chat = {
      id: this.generateId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    chats.push(newChat);
    localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
    return newChat;
  }

  async getAllChats(): Promise<Chat[]> {
    return Promise.resolve(this.getAllChatsSync());
  }

  async updateChat(chatId: string, name: string): Promise<Chat | null> {
    const chats = this.getAllChatsSync();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex === -1) return null;

    chats[chatIndex] = {
      ...chats[chatIndex],
      name,
      updatedAt: new Date()
    };
    localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
    return chats[chatIndex];
  }

  async deleteChat(chatId: string): Promise<void> {
    const chats = this.getAllChatsSync();
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    localStorage.setItem(this.CHATS_KEY, JSON.stringify(filteredChats));
  }

  async addMessages(chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[], newChatName?: string): Promise<Chat | null> {
    const chats = this.getAllChatsSync();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex === -1) return null;

    const newMessages: Message[] = messages.map(msg => ({
      ...msg,
      id: this.generateId(),
      chatId,
      createdAt: new Date()
    }));

    chats[chatIndex] = {
      ...chats[chatIndex],
      name: newChatName || chats[chatIndex].name,
      messages: [...chats[chatIndex].messages, ...newMessages],
      updatedAt: new Date()
    };

    localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
    return chats[chatIndex];
  }
}

const isClient = typeof window !== 'undefined';

function getStorageInstance() {
    if (isClient) {
        return new LocalStorageAdapter();
    }
    
    // Return a mock/dummy adapter for server-side rendering (SSR)
    return {
        createChat: async (name: string): Promise<Chat> => { 
            throw new Error('Cannot create chat on the server.'); 
        },
        getAllChats: async (): Promise<Chat[]> => [],
        updateChat: async (chatId: string, name: string): Promise<Chat | null> => { 
            throw new Error('Cannot update chat on the server.'); 
        },
        deleteChat: async (chatId: string): Promise<void> => { 
            throw new Error('Cannot delete chat on the server.'); 
        },
        addMessages: async (chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[], newChatName?: string): Promise<Chat | null> => { 
            throw new Error('Cannot add messages on the server.'); 
        },
    };
}

export const storage = getStorageInstance();