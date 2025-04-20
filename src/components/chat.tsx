"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import {
  SendHorizontal,
  ChevronRight,
  Square,
} from "lucide-react";
import { getModels, streamChat } from "@/lib/ollama";
import { useToast } from "./ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Message } from "./chat/message";
import { EditChatDialog } from "./chat/edit-chat-dialog";
import { DeleteChatDialog } from "./chat/delete-chat-dialog";
import { Sidebar } from "./chat/sidebar";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chat as ChatTypeMain } from "@prisma/client";
import { Message as MessageType, ChatProps, PreGeneratedPrompt } from "@/types/chat";
import { Model } from "@/types/model";

interface ChatType extends ChatTypeMain {
  messages: MessageType[];
}
const preGeneratedPrompts: PreGeneratedPrompt[] = [
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
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

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
        if (savedModel && modelList.some((m) => m.name === savedModel)) {
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
            description:
              "Failed to load available models. Please make sure Ollama is running.",
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
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChat, setEditingChat] = useState<ChatType | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingChat, setDeletingChat] = useState<ChatType | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [chatName, setChatName] = useState("");

  const router = useRouter();

  const responseInProgress = useRef(false);
  const currentMessageRef = useRef<MessageType | null>(null);

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
            const chat = chatList.find((c: ChatType) => c.id === initialChatId);
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

  const saveMessages = async (chatId: string, newMessages: MessageType[]) => {
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

    const userMessage: MessageType = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsGenerating(true);
    responseInProgress.current = true;

    try {
      // Create a new chat if this is the first message
      if (!currentChatId) {
        const chatId = await createNewChat(userMessage.content);
        setCurrentChatId(chatId);
      }

      // Initialize an empty assistant message
      const assistantMessage: MessageType = { role: "assistant", content: "" };
      currentMessageRef.current = assistantMessage;
      setMessages((prev) => [...prev, assistantMessage]);

      // Create new AbortController
      abortControllerRef.current = new AbortController();

      // Stream the response
      for await (const chunk of streamChat(
        [...messages, userMessage],
        selectedModel,
        abortControllerRef.current.signal
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
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get response from Ollama. Please try again.",
        });
        // Remove the empty assistant message if there was an error
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      responseInProgress.current = false;
      currentMessageRef.current = null;
      abortControllerRef.current = null;
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

  const handleEditChat = async (chat: ChatType) => {
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

  const handleDeleteChat = async (chat: ChatType) => {
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

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 border-r flex flex-col bg-background overflow-hidden h-screen sticky top-0`}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          selectedModel={selectedModel}
          models={models}
          chats={chats}
          currentChatId={currentChatId}
          chatName={chatName}
          onSidebarClose={() => setIsSidebarOpen(false)}
          onModelChange={setSelectedModel}
          onNewChat={handleNewChat}
          onChatLoad={loadChat}
          onEditChat={(chat) => {
            setEditingChat(chat);
            setEditingName(chat.name);
          }}
          onDeleteChat={setDeletingChat}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-background">
        <ScrollArea className="flex-1 px-4 pb-20 mb-4" ref={scrollAreaRef}>
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
                <Message
                  key={i}
                  message={message}
                  isFirstMessage={i === 0}
                />
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
            {isGenerating ? (
              <Button
                type="button"
                variant="destructive"
                onClick={stopGeneration}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>

      <EditChatDialog
        chat={editingChat}
        open={editingChat !== null}
        onOpenChange={(open) => !open && setEditingChat(null)}
        onSave={handleEditChat}
      />

      <DeleteChatDialog
        chat={deletingChat}
        open={deletingChat !== null}
        onOpenChange={(open) => !open && setDeletingChat(null)}
        onDelete={handleDeleteChat}
      />
    </div>
  );
}
