import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { ChevronLeft } from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Chat } from "@prisma/client";
import { Message } from "@/types/chat";
import { Model } from "@/types/model";

interface ChatType extends Chat {
  messages: Message[];
}

interface SidebarProps {
  isSidebarOpen: boolean;
  selectedModel: string;
  models: Model[];
  chats: ChatType[];
  currentChatId: string | null;
  chatName: string;
  onSidebarClose: () => void;
  onModelChange: (model: string) => void;
  onNewChat: () => void;
  onChatLoad: (chatId: string) => void;
  onEditChat: (chat: ChatType) => void;
  onDeleteChat: (chat: ChatType) => void;
}

export function Sidebar({
  isSidebarOpen,
  selectedModel,
  models,
  chats,
  currentChatId,
  chatName,
  onSidebarClose,
  onModelChange,
  onNewChat,
  onChatLoad,
  onEditChat,
  onDeleteChat,
}: SidebarProps) {
  if (!isSidebarOpen) return null;

  return (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={onSidebarClose}>
          <ChevronLeft />
        </Button>
      </div>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4">
          <Button onClick={onNewChat} className="w-full">
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-4 relative">
          <div className="space-y-2 pr-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="group flex justify-between cursor-pointer items-center gap-2"
              >
                <Link className="w-full" href={`/${chat.id}`}>
                  <Button
                    variant={currentChatId === chat.id ? "secondary" : "ghost"}
                    className="flex-1 justify-start truncate h-9 px-3 w-full"
                    onClick={() => onChatLoad(chat.id)}
                  >
                    {chat.id === currentChatId && chatName
                      ? chatName
                      : chat.name}
                  </Button>
                </Link>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEditChat(chat)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDeleteChat(chat)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
