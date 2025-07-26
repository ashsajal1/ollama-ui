import { storage } from "@/lib/storage";
import { Message } from "@/types/chat";

export async function createNewChat(name: string) {
  try {
    const chat = await storage.createChat(name.slice(0, 30) + "...");
    return chat.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function saveMessages(
  chatId: string,
  messages: Message[],
  newMessages: Message[]
) {
  try {
    const newChatName =
      messages.length === 0 ? newMessages[0].content : undefined;
    const chat = await storage.addMessages(
      chatId,
      newMessages,
      newChatName
    );
    if (!chat) {
      throw new Error("Failed to add messages: chat not found.");
    }
    return chat;
  } catch (error) {
    console.error("Error saving messages:", error);
    throw error;
  }
}

export async function updateChatName(chatId: string, newName: string) {
  try {
    const updatedChat = await storage.updateChat(chatId, newName);
    return updatedChat;
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
}

export async function deleteChat(chatId: string) {
  try {
    await storage.deleteChat(chatId);
    return true;
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

export async function loadChats() {
  try {
    const chats = await storage.getAllChats();
    return chats;
  } catch (error) {
    console.error("Error loading chats:", error);
    throw error;
  }
}
