import { ChatType } from "@/types/chat";

export function getChatDateCategory(chat: ChatType): string {
  const now = new Date();
  const chatDate = new Date(chat.updatedAt);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isSameWeek = (d1: Date, d2: Date) => {
    const firstDayOfWeek1 = new Date(d1.setDate(d1.getDate() - d1.getDay()));
    const firstDayOfWeek2 = new Date(d2.setDate(d2.getDate() - d2.getDay()));
    return isSameDay(firstDayOfWeek1, firstDayOfWeek2);
  };

  const isSameMonth = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

  if (isSameDay(now, chatDate)) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(yesterday, chatDate)) {
    return "Yesterday";
  }

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  if (chatDate > sevenDaysAgo) {
    return "Last 7 Days";
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  if (chatDate > thirtyDaysAgo) {
    return "Last 30 Days";
  }

  return "Older";
}

export function groupChatsByDate(chats: ChatType[]): Record<string, ChatType[]> {
  const groupedChats: Record<string, ChatType[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 Days": [],
    "Last 30 Days": [],
    Older: [],
  };

  chats.forEach((chat) => {
    const category = getChatDateCategory(chat);
    if (groupedChats[category]) {
      groupedChats[category].push(chat);
    } else {
      groupedChats[category] = [chat];
    }
  });

  return groupedChats;
}
