import { Message, Chat as ChatType } from "@/types/chat";

export async function createNewChat(name: string) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.slice(0, 30) + "...",
      }),
    });

    if (!response.ok) throw new Error("Failed to create chat");

    const chat = await response.json();
    return chat.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function saveMessages(chatId: string, messages: Message[], newMessages: Message[]) {
  try {
    const newChatName = messages.length === 0 ? newMessages[0].content : undefined;

    const response = await fetch(`/api/chat/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        newChatName,
      }),
    });

    if (!response.ok) throw new Error("Failed to save messages");

    const chat: ChatType = await response.json();
    return chat;
  } catch (error) {
    console.error("Error saving messages:", error);
    throw error;
  }
}

export async function updateChatName(chatId: string, newName: string) {
  try {
    const response = await fetch(`/api/chat/${chatId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) throw new Error("Failed to update chat");

    const updatedChat = await response.json();
    return updatedChat;
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
}

export async function deleteChat(chatId: string) {
  try {
    const response = await fetch(`/api/chat/${chatId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete chat");
    
    return true;
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

export async function loadChats() {
  try {
    const response = await fetch("/api/chat");
    if (!response.ok) throw new Error("Failed to fetch chats");
    return await response.json();
  } catch (error) {
    console.error("Error loading chats:", error);
    throw error;
  }
}