"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { SendHorizontal, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { chatWithOllama, getModels, streamChat } from "@/lib/ollama";
import { useToast } from "./ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface Model {
  name: string;
  modified_at: string;
  size: number;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function Chat() {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("llama2");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelList = await getModels();
        setModels(modelList);
        if (modelList.length > 0) {
          setSelectedModel(modelList[0].name);
        }
      } catch (error) {
        console.error("Error loading models:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to load available models. Please make sure Ollama is running.",
        });
      }
    };

    const loadChats = async () => {
      try {
        const response = await fetch("/api/chat");
        if (!response.ok) throw new Error("Failed to fetch chats");
        const chatList = await response.json();
        setChats(chatList);
      } catch (error) {
        console.error("Error loading chats:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat history.",
        });
      }
    };

    loadModels();
    loadChats();
  }, [toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewChat = async (message: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: message.slice(0, 30) + "...",
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to create chat");

      const chat = await response.json();
      setCurrentChatId(chat.id);
      return chat.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  };

  const saveMessages = async (chatId: string, newMessages: Message[]) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      if (!response.ok) throw new Error("Failed to save messages");

      const chat = await response.json();
      return chat;
    } catch (error) {
      console.error("Error saving messages:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create a new chat if this is the first message
      if (!currentChatId) {
        const chatId = await createNewChat(userMessage.content);
        setCurrentChatId(chatId);
      }

      // Initialize an empty assistant message
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream the response
      for await (const chunk of streamChat(
        [...messages, userMessage],
        selectedModel
      )) {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.content += chunk.message.content;
          return newMessages;
        });
      }

      // Save messages to the database after streaming is complete
      if (currentChatId) {
        const lastMessage = messages[messages.length - 1];
        await saveMessages(currentChatId, [userMessage, lastMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from Ollama. Please try again.",
      });
      // Remove the empty assistant message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle new chat
  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");
  };

  // Add function to load chat history
  const loadChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setMessages(chat.messages);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chat.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChat = async (chat: Chat) => {
    if (!editingName.trim()) return;
    try {
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName }),
      });

      if (!response.ok) throw new Error('Failed to update chat');

      const updatedChat = await response.json();
      setChats(chats.map(c => c.id === chat.id ? updatedChat : c));
      setEditingChat(null);
      setEditingName("");
    } catch (error) {
      console.error('Error updating chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update chat name.",
      });
    }
  };

  const handleDeleteChat = async (chat: Chat) => {
    try {
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete chat');

      setChats(chats.filter(c => c.id !== chat.id));
      if (currentChatId === chat.id) {
        setMessages([]);
        setCurrentChatId(null);
      }
      setDeletingChat(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat.",
      });
    }
  };

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto">
      {/* Sidebar toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-10"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
      </Button>

      {/* Chat list sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden transition-all duration-300 border-r flex flex-col`}>
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            className="mb-4 w-full"
          >
            New Chat
          </Button>
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {chats.map((chat) => (
                <ContextMenu key={chat.id}>
                  <ContextMenuTrigger>
                    <Button
                      variant={currentChatId === chat.id ? "secondary" : "ghost"}
                      className="w-full justify-start truncate"
                      onClick={() => loadChat(chat.id)}
                    >
                      {chat.name}
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => {
                      setEditingChat(chat);
                      setEditingName(chat.name);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Name
                    </ContextMenuItem>
                    <ContextMenuItem 
                      className="text-destructive"
                      onClick={() => setDeletingChat(chat)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
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
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground">
                Start a conversation with Ollama
              </div>
            )}
            {messages.map((message, i) => (
              <Card
                key={i}
                className={`p-4 ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                } max-w-[80%]`}
              >
                {message.content}
              </Card>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[50px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" disabled={isLoading}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingChat !== null} onOpenChange={() => setEditingChat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingChat(null)}>
              Cancel
            </Button>
            <Button onClick={() => editingChat && handleEditChat(editingChat)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingChat !== null} onOpenChange={() => setDeletingChat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingChat && handleDeleteChat(deletingChat)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
