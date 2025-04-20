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

  async addMessages(chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[]): Promise<Chat | null> {
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

  async addMessages(chatId: string, messages: Omit<Message, 'id' | 'chatId' | 'createdAt'>[]): Promise<Chat | null> {
    return prisma.chat.update({
      where: { id: chatId },
      data: {
        messages: {
          create: messages.map(msg => ({
            content: msg.content,
            role: msg.role
          }))
        },
        updatedAt: new Date()
      },
      include: { messages: true }
    });
  }
}

const isClient = typeof window !== 'undefined';
const useLocalStorage = process.env.NEXT_PUBLIC_STORAGE === 'local' || !process.env.DATABASE_URL;

export const storage = isClient && useLocalStorage
  ? new LocalStorageAdapter()
  : new PrismaAdapter();