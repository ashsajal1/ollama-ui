"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import {
  SendHorizontal,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Grid2X2,
} from "lucide-react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chat as ChatType } from "@prisma/client";
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

interface ChatProps {
  initialChatId?: string;
}

const preGeneratedPrompts = [
  {
    title: "Code Explanation",
    prompt: "Can you explain this code and how it works?",
  },
  {
    title: "Bug Finding",
    prompt: "Can you help me find bugs in this code?",
  },
  {
    title: "Code Review",
    prompt: "Please review this code and suggest improvements.",
  },
  {
    title: "Documentation",
    prompt: "Help me write documentation for this code.",
  },
  {
    title: "Optimization",
    prompt: "How can I optimize this code for better performance?",
  },
  {
    title: "Testing",
    prompt: "Help me write tests for this code.",
  },
];

export function Chat({ initialChatId }: ChatProps) {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Combined effect to handle model loading and selection
  useEffect(() => {
    let mounted = true;

    const initializeModel = async () => {
      try {
        // First try to get the saved model from localStorage
        const savedModel = localStorage.getItem("selectedModel");
        
        // Fetch available models
        const modelList = await getModels();
        if (!mounted) return;
        
        setModels(modelList);

        // Set the selected model in this order:
        // 1. Use saved model if it exists and is available in the model list
        // 2. Otherwise use the first available model
        // 3. Fallback to "llama2" if no models available
        if (savedModel && modelList.some(m => m.name === savedModel)) {
          setSelectedModel(savedModel);
        } else if (modelList.length > 0) {
          const defaultModel = modelList[0].name;
          setSelectedModel(defaultModel);
          localStorage.setItem("selectedModel", defaultModel);
        } else {
          setSelectedModel("llama2");
        }
      } catch (error) {
        console.error("Error loading models:", error);
        if (mounted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load available models. Please make sure Ollama is running.",
          });
          // Set llama2 as fallback
          setSelectedModel("llama2");
        }
      }
    };

    initializeModel();

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Save model to localStorage when it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem("selectedModel", selectedModel);
    }
  }, [selectedModel]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [chatName, setChatName] = useState("");

  const router = useRouter();

  const responseInProgress = useRef(false);
  const currentMessageRef = useRef<Message | null>(null);

  // Function to handle scroll events
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollArea = scrollAreaRef.current;
    let mounted = true;

    const handleScroll = () => {
      if (!mounted || !scrollAreaRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      setShouldAutoScroll(isAtBottom);
    };

    scrollArea.addEventListener("scroll", handleScroll);
    return () => {
      mounted = false;
      scrollArea.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (scrollAreaRef.current && shouldAutoScroll && mounted) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
    return () => {
      mounted = false;
    };
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const modelList = await getModels();
        if (mounted) {
          setModels(modelList);
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading models:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Failed to load available models. Please make sure Ollama is running.",
          });
        }
      }
    };

    const loadChats = async () => {
      try {
        const response = await fetch("/api/chat");
        if (!response.ok) throw new Error("Failed to fetch chats");
        const chatList = await response.json();
        if (mounted) {
          setChats(chatList);
          // If initialChatId is provided, load that chat
          if (initialChatId) {
            const chat = chatList.find((c: Chat) => c.id === initialChatId);
            if (chat) {
              setMessages(chat.messages);
              setCurrentChatId(initialChatId);
            } else {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Chat not found.",
              });
            }
          }
        }
      } catch (error) {
        if (mounted) {
          console.error("Error loading chats:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load chat history.",
          });
        }
      }
    };

    loadModels();
    loadChats();

    return () => {
      mounted = false;
    };
  }, [toast, initialChatId]);

  const createNewChat = async (name: string) => {
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
  };

  const saveMessages = async (chatId: string, newMessages: Message[]) => {
    try {
      // If this is the first message, use it as the chat name
      if (messages.length === 0) {
        const resp = await fetch(`/api/chat/${chatId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newMessages[0].content,
          }),
        });

        if (resp.ok) {
          const chat = await resp.json();
          setCurrentChatId(chat.id);
          setChatName(newMessages[0].content);
        } else {
          console.log("Issue with creating chat");
        }
      }
      
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

      const chat: ChatType = await response.json();
      return chat;
    } catch (error) {
      console.error("Error saving messages:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || responseInProgress.current) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    responseInProgress.current = true;

    try {
      // Create a new chat if this is the first message
      if (!currentChatId) {
        const chatId = await createNewChat(userMessage.content);
        setCurrentChatId(chatId);
      }

      // Initialize an empty assistant message
      const assistantMessage: Message = { role: "assistant", content: "" };
      currentMessageRef.current = assistantMessage;
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream the response
      for await (const chunk of streamChat(
        [...messages, userMessage],
        selectedModel
      )) {
        if (currentMessageRef.current) {
          currentMessageRef.current.content += chunk.message.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content = currentMessageRef.current?.content || "";
            }
            return newMessages;
          });
        }
      }

      // Save messages to the database after streaming is complete
      if (currentChatId && currentMessageRef.current) {
        await saveMessages(currentChatId, [
          userMessage,
          currentMessageRef.current,
        ]);
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
      responseInProgress.current = false;
      currentMessageRef.current = null;
    }
  };

  // Add function to handle new chat
  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");

    const id = await createNewChat("New chat");
    // Fetch the new chat
    if (id) {
      // route to /chatId
      router.push(`/${id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new chat.",
      });
    }
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingName }),
      });

      if (!response.ok) throw new Error("Failed to update chat");

      const updatedChat = await response.json();
      setChats(chats.map((c) => (c.id === chat.id ? updatedChat : c)));
      setEditingChat(null);
      setEditingName("");
    } catch (error) {
      console.error("Error updating chat:", error);
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
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete chat");

      setChats(chats.filter((c) => c.id !== chat.id));
      if (currentChatId === chat.id) {
        setMessages([]);
        setCurrentChatId(null);
        router.push("/");
      }
      setDeletingChat(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat.",
      });
    }
  };

  return (
    <div className="flex h-screen max-w-full mx-auto">
      {/* Fixed Header when sidebar is collapsed */}
      {!isSidebarOpen && (
        <div className="fixed top-0 left-0 p-4 z-20 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <ChevronRight />
          </Button>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
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
        </div>
      )}

      {/* Chat list sidebar with header */}
      <div
        className={`${
          isSidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 border-r flex flex-col bg-background overflow-hidden h-screen sticky top-0`}
      >
        {isSidebarOpen && (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ChevronLeft />
              </Button>
            </div>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4">
                <Button onClick={handleNewChat} className="w-full">
                  New Chat
                </Button>
              </div>
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-2 pr-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className="group flex justify-between cursor-pointer items-center gap-2"
                    >
                      <Link className="w-full" href={`/${chat.id}`}>
                        <Button
                          variant={
                            currentChatId === chat.id ? "secondary" : "ghost"
                          }
                          className="flex-1 justify-start truncate h-9 px-3 w-full"
                          onClick={() => loadChat(chat.id)}
                        >
                          {chat.id === currentChatId && chatName ? chatName : chat.name}
                        </Button>
                      </Link>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingChat(chat);
                            setEditingName(chat.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeletingChat(chat)}
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
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-background">
        <ScrollArea className="flex-1 px-4 pb-20" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-8 space-y-6">
                <h2 className="text-2xl font-semibold text-center">
                  Choose a prompt or start typing
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto p-4">
                  {preGeneratedPrompts.map((item, index) => (
                    <Card
                      key={index}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setInput(item.prompt);
                        // Focus the textarea
                        const textarea = document.querySelector("textarea");
                        if (textarea) textarea.focus();
                      }}
                    >
                      <h3 className="font-medium mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.prompt}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, i) => (
                <Card
                  key={i}
                  className={`p-4 ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted"
                  } max-w-[80%] ${i === 0 ? "mt-4" : ""}`}
                >
                  {message.content}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[50px] max-h-[200px]"
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
          </form>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingChat !== null}
        onOpenChange={() => setEditingChat(null)}
      >
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
      <AlertDialog
        open={deletingChat !== null}
        onOpenChange={() => setDeletingChat(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
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
