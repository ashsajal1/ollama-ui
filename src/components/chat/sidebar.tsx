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
import { ChatType } from "@/types/chat";
import { Message } from "@/types/chat";
import { Model } from "@/types/model";
import { groupChatsByDate } from "@/lib/utils/date";
import { GearIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "../mode-toggle";

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
      <div className="flex flex-col h-full overflow-hidden relative">
        <div className="p-4">
          <Button onClick={onNewChat} className="w-full">
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-4 relative">
          <div className="space-y-2 pr-2">
            {Object.entries(groupChatsByDate(chats)).map(
              ([category, chatsForDate]) =>
                chatsForDate.length > 0 && (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mt-4 mb-2">
                      {category}
                    </h3>
                    {chatsForDate.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex justify-between cursor-pointer items-center gap-2"
                      >
                        <Button
                          variant={
                            currentChatId === chat.id ? "secondary" : "ghost"
                          }
                          className="flex-1 justify-start truncate h-9 px-3 w-full"
                          onClick={() => onChatLoad(chat.id)}
                        >
                          {chat.id === currentChatId && chatName
                            ? chatName
                            : chat.name}
                        </Button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEditChat(chat as ChatType)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onDeleteChat(chat as ChatType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
        </ScrollArea>
        {/* Settings and mode toggle buttons fixed at the bottom */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-background border-t flex justify-between items-center gap-2">
          <ModeToggle />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="w-10 h-10"
            title="Settings"
          >
            <Link href="/settings">
              <GearIcon className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
