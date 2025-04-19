"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { SendHorizontal } from "lucide-react";
import { chatWithOllama, getModels, streamChat } from "@/lib/ollama";
import { useToast } from "./ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          description: "Failed to load available models. Please make sure Ollama is running.",
        });
      }
    };
    loadModels();
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
      for await (const chunk of streamChat([...messages, userMessage], selectedModel)) {
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

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto">
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
          {isLoading && (
            <Card className="mr-auto bg-muted p-4 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              </div>
            </Card>
          )}
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
  );
}