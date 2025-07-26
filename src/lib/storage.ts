import prisma from './prisma';

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
    return chats.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt)
    }));
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

class PrismaAdapter {
  async createChat(name: string): Promise<Chat> {
    return prisma.chat.create({
      data: { name },
      include: { messages: true }
    });
  }

  async getAllChats(): Promise<Chat[]> {
    return prisma.chat.findMany({
      include: { messages: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateChat(chatId: string, name: string): Promise<Chat | null> {
    return prisma.chat.update({
      where: { id: chatId },
      data: { name, updatedAt: new Date() },
      include: { messages: true }
    });
  }

  async deleteChat(chatId: string): Promise<void> {
    await prisma.message.deleteMany({ where: { chatId } });
    await prisma.chat.delete({ where: { id: chatId } });
  }

  async addMessages(chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[], newChatName?: string): Promise<Chat | null> {
    const data: any = {
      messages: {
        create: messages.map(msg => ({
          content: msg.content,
          role: msg.role
        }))
      },
      updatedAt: new Date()
    };

    if (newChatName) {
      data.name = newChatName;
    }

    return prisma.chat.update({
      where: { id: chatId },
      data,
      include: { messages: true }
    });
  }
}

class ApiAdapter {
    async createChat(name: string): Promise<Chat> {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create chat');
      return response.json();
    }
  
    async getAllChats(): Promise<Chat[]> {
      const response = await fetch('/api/chat');
      if (!response.ok) throw new Error('Failed to get chats');
      const chats = await response.json();
      return chats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt)
        }));
    }
  
    async updateChat(chatId: string, name: string): Promise<Chat | null> {
      const response = await fetch(`/api/chat/${chatId}`, {
          method: 'PUT',
          body: JSON.stringify({ name }),
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return null;
      return response.json();
    }
  
    async deleteChat(chatId: string): Promise<void> {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
    }
  
    async addMessages(chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[], newChatName?: string): Promise<Chat | null> {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ messages, newChatName }),
          headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return null;
      return response.json();
    }
  }

const isClient = typeof window !== 'undefined';

function getStorageInstance() {
    const defaultToLocal = process.env.NEXT_PUBLIC_STORAGE === 'local' || !process.env.DATABASE_URL;

    if (isClient) {
        const preference = localStorage.getItem('storage_adapter');
        if (preference === 'local') {
            return new LocalStorageAdapter();
        }
        if (preference === 'db') {
            return new ApiAdapter();
        }
        if (defaultToLocal) {
            return new LocalStorageAdapter();
        }
        return new ApiAdapter();
    }
    return new PrismaAdapter();
}

export const storage = getStorageInstance();

export function getStorageType() {
    if (!isClient) {
        const defaultToLocal = process.env.NEXT_PUBLIC_STORAGE === 'local' || !process.env.DATABASE_URL;
        return defaultToLocal ? 'local' : 'db';
    }
    const preference = localStorage.getItem('storage_adapter');
    if (preference) {
        return preference as 'local' | 'db';
    }
    const defaultToLocal = process.env.NEXT_PUBLIC_STORAGE === 'local' || !process.env.DATABASE_URL;
    return defaultToLocal ? 'local' : 'db';
}

export function setStorageType(type: 'local' | 'db') {
    if (isClient) {
        localStorage.setItem('storage_adapter', type);
        window.location.reload();
    }
}