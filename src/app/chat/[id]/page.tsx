import { Chat } from "@/components/chat";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return <Chat initialChatId={params.id} />;
}
