import { Chat } from "@/components/chat";

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <main>
      <Chat initialChatId={params.chatId} />
    </main>
  );
}