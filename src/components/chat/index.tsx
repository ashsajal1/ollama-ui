"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";
import { streamChat } from "@/lib/ollama";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Message } from "./message";
import { EditChatDialog } from "./edit-chat-dialog";
import { DeleteChatDialog } from "./delete-chat-dialog";
import { Sidebar } from "./sidebar";
import { PreGeneratedPrompts } from "./pre-generated-prompts";
import { ChatInput } from "./chat-input";
import { Chat as ChatTypeMain } from "@prisma/client";
import { Message as MessageType, ChatProps } from "@/types/chat";
import { Model } from "@/types/model";
import {
  createNewChat,
  saveMessages,
  updateChatName,
  deleteChat as deleteChatUtil,
  loadChats,
} from "@/lib/utils/chat";
import { initializeModel, saveSelectedModel } from "@/lib/utils/model";

interface ChatType extends ChatTypeMain {
  messages: MessageType[];
}

export function Chat({ initialChatId }: ChatProps) {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChat, setEditingChat] = useState<ChatType | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingChat, setDeletingChat] = useState<ChatType | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [chatName, setChatName] = useState("");

  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseInProgress = useRef(false);
  const currentMessageRef = useRef<MessageType | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

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

  // Combined effect to handle model loading and selection
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { models: modelList, selectedModel: initialModel } =
          await initializeModel();
        if (!mounted) return;

        setModels(modelList);
        setSelectedModel(initialModel);
      } catch (error) {
        if (mounted) {
          console.error("Error loading models:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Failed to load available models. Please make sure Ollama is running.",
          });
          setSelectedModel("llama2");
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [toast]);

  // Save model to localStorage when it changes
  useEffect(() => {
    if (selectedModel) {
      saveSelectedModel(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const chatList = await loadChats();
        if (!mounted) return;

        setChats(
          chatList.map((chat) => ({
            ...chat,
            messages: chat.messages.map((msg) => ({
              ...msg,
              role: msg.role === "user" ? "user" : "assistant",
            })),
          }))
        );
        // If initialChatId is provided, load that chat
        if (initialChatId) {
          const chat = chatList
            .map((c) => ({
              ...c,
              messages: c.messages.map((msg) => ({
                ...msg,
                role: msg.role === "user" ? "user" : "assistant",
              })),
            }))
            .find((c) => c.id === initialChatId);
          if (chat) {
            setMessages(
              chat.messages.map((msg) => ({
                ...msg,
                role: msg.role === "user" ? "user" : "assistant",
              }))
            );
            setCurrentChatId(initialChatId);
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Chat not found.",
            });
          }
        }
      } catch (error) {
        if (mounted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load chat history.",
          });
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [toast, initialChatId]);

  const handleSubmit = async (e: React.FormEvent, fullMessage: string) => {
    e.preventDefault();
    if (!input.trim() || isLoading || responseInProgress.current) return;

    const userMessage: MessageType = {
      role: "user",
      content: fullMessage.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsGenerating(true);
    responseInProgress.current = true;

    try {
      // Create a new chat and navigate if no chat ID exists
      if (!currentChatId) {
        const chatId = await createNewChat(userMessage.content);
        if (chatId) {
          router.push(`/${chatId}`);
          setCurrentChatId(chatId);
          setMessages((prev) => [...prev, userMessage]);
          await saveMessages(chatId, [], [userMessage]);
        } else {
          throw new Error("Failed to create chat");
        }
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
        const updatedChat = await saveMessages(currentChatId, messages, [
          userMessage,
          currentMessageRef.current,
        ]);
        if (messages.length === 0) {
          setChatName(userMessage.content);
        }
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

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");

    const id = await createNewChat("New chat");
    if (id) {
      router.push(`/${id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new chat.",
      });
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setMessages(
          chat.messages.map((msg) => ({
            ...msg,
            role: msg.role === "user" ? "user" : "assistant",
          }))
        );
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

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEditChat = async (chat: ChatType, newName: string) => {
    if (!newName.trim()) return;
    try {
      const updatedChat = await updateChatName(chat.id, newName);
      setChats(
        chats.map((c) => (c.id === chat.id ? updatedChat : c)).filter((c): c is ChatType => c !== null && c !== undefined)
      );
      setEditingChat(null);
      setEditingName("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update chat name.",
      });
    }
  };

  const handleDeleteChat = async (chat: ChatType) => {
    try {
      await deleteChatUtil(chat.id);
      setChats(chats.filter((c) => c.id !== chat.id));
      if (currentChatId === chat.id) {
        setMessages([]);
        setCurrentChatId(null);
        router.push("/");
      }
      setDeletingChat(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat.",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { filepath } = await response.json();

      // Convert filepath to URL for temporary access
      const tempUrl = `/api/image/${encodeURIComponent(filepath)}`;

      const imageMessage: MessageType = {
        role: "user",
        content: "Sent an image",
        contentType: "image",
        imageUrl: tempUrl,
      };

      setMessages((prev) => [...prev, imageMessage]);

      // Save the message if we're in a chat
      if (currentChatId) {
        await saveMessages(currentChatId, messages, [imageMessage]);
      } else {
        // Create a new chat if this is the first message
        const chatId = await createNewChat("Image chat");
        setCurrentChatId(chatId);
        await saveMessages(chatId, [], [imageMessage]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again.",
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
      <div className="flex-1 flex flex-col min-h-0 pb-20 relative bg-background">
        <ScrollArea className="flex-1 px-4 pb-20 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <PreGeneratedPrompts
                onPromptSelect={(prompt) => {
                  setInput(prompt);
                  // Focus the textarea
                  const textarea = document.querySelector("textarea");
                  if (textarea) textarea.focus();
                }}
              />
            ) : (
              messages.map((message, i) => (
                <Message key={i} message={message} isFirstMessage={i === 0} />
              ))
            )}
          </div>

          <div ref={bottomRef} />
        </ScrollArea>

        <ChatInput
          input={input}
          isLoading={isLoading}
          isGenerating={isGenerating}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStopGeneration={stopGeneration}
          onImageUpload={handleImageUpload}
        />
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
